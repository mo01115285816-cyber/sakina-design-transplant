import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getGeminiClient, hasGeminiApiKey } from "./gemini.ts";
import { OFFLINE_FALLBACK_TEXT, SAKEENAH_SYSTEM_INSTRUCTION } from "./prompts.ts";
import {
  corsForRequest,
  jsonResponse,
  preflightResponse,
  readJson,
  requireUser,
  requestId,
  SecurityError,
  streamHeaders,
  consumeRateLimit,
} from "./security.ts";
import { loadConversationContext, saveAssistantMessage, saveUserMessage } from "./conversations.ts";
import type { ChatMessage } from "./contracts.ts";
import { validateChatRequest } from "./validation.ts";
import { getSystemInstructionCache } from "./system-instruction-cache.ts";

function formatMessagesForGemini(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function safeErrorDetails(error: unknown): { name: string; message: string; status?: string; code?: string } {
  const candidate = error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown };
  const rawMessage = candidate && typeof candidate.message === "string"
    ? candidate.message
    : String(error);
  const message = rawMessage
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, "[redacted-key]")
    .replace(/([?&](?:key|api_key)=)[^&\\s]+/gi, "$1[redacted]")
    .slice(0, 240);
  return {
    name: typeof candidate?.name === "string" ? candidate.name : "UnknownError",
    message,
    ...(candidate?.status !== undefined ? { status: String(candidate.status).slice(0, 40) } : {}),
    ...(candidate?.code !== undefined ? { code: String(candidate.code).slice(0, 40) } : {}),
  };
}

async function getGeminiGenerationConfig(ai: ReturnType<typeof getGeminiClient>): Promise<Record<string, unknown>> {
  const cachedContent = await getSystemInstructionCache(ai);
  if (cachedContent) {
    console.info(JSON.stringify({ event: "sakeenah_ai_context_mode", mode: "explicit_cache" }));
    return { cachedContent, temperature: 0.1 };
  }

  console.info(JSON.stringify({ event: "sakeenah_ai_context_mode", mode: "direct_fallback" }));
  return {
    systemInstruction: SAKEENAH_SYSTEM_INSTRUCTION,
    temperature: 0.1,
  };
}

function errorResponse(request: Request, error: unknown, id: string): Response {
  if (error instanceof SecurityError) {
    return jsonResponse(request, { error: error.message }, error.status, id);
  }
  console.error(JSON.stringify({
    event: "sakeenah_ai_error",
    request_id: id,
    error: "provider_or_runtime_error",
    details: safeErrorDetails(error),
  }));
  return jsonResponse(request, { error: "Failed to generate AI response" }, 500, id);
}

async function generateAnswer(messages: ChatMessage[]): Promise<string> {
  if (!hasGeminiApiKey()) return OFFLINE_FALLBACK_TEXT;
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: formatMessagesForGemini(messages),
    config: await getGeminiGenerationConfig(ai),
  });
  return response.text?.trim() || "";
}

function streamResponse(
  request: Request,
  user: Awaited<ReturnType<typeof requireUser>>,
  conversationId: string,
  message: string,
  id: string,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      let assistantText = "";
      try {
        const context = await loadConversationContext(user, conversationId, message, id);
        await saveUserMessage(user, conversationId, message, id);

        if (!hasGeminiApiKey()) {
          const words = OFFLINE_FALLBACK_TEXT.split(" ");
          for (let index = 0; index < words.length; index += 1) {
            const chunkWord = `${index === 0 ? "" : " "}${words[index]}`;
            assistantText += chunkWord;
            send(JSON.stringify({ text: chunkWord }));
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        } else {
          const ai = getGeminiClient();
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: formatMessagesForGemini(context.messages),
            config: await getGeminiGenerationConfig(ai),
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              assistantText += text;
              send(JSON.stringify({ text }));
            }
          }
        }

        if (assistantText.trim()) {
          await saveAssistantMessage(user, context.conversation, message, assistantText.trim(), context.messageCount, id);
        }
        send("[DONE]");
      } catch (error) {
        send(JSON.stringify({ error: "Failed to generate stream response" }));
        send("[DONE]");
        console.error(JSON.stringify({
          event: "sakeenah_ai_stream_error",
          request_id: id,
          details: safeErrorDetails(error),
        }));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { status: 200, headers: streamHeaders(request, id) });
}

Deno.serve(async (request: Request) => {
  const id = requestId();
  if (request.method === "OPTIONS") return preflightResponse(request);
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405, id);

  try {
    const user = await requireUser(request, id);
    await consumeRateLimit(id, user.accessToken);
    const body = await readJson(request, id);
    const { conversationId, message, stream } = validateChatRequest(body, id);

    if (stream) {
      return streamResponse(request, user, conversationId, message, id);
    }

    const context = await loadConversationContext(user, conversationId, message, id);
    await saveUserMessage(user, conversationId, message, id);
    const text = await generateAnswer(context.messages);
    if (text) {
      await saveAssistantMessage(user, context.conversation, message, text, context.messageCount, id);
    }
    return jsonResponse(request, { text }, 200, id);
  } catch (error) {
    return errorResponse(request, error, id);
  }
});
