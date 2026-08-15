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
import type { ChatMessage } from "./contracts.ts";
import { validateChatRequest } from "./validation.ts";

function formatMessagesForGemini(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function errorResponse(request: Request, error: unknown, id: string): Response {
  if (error instanceof SecurityError) {
    return jsonResponse(request, { error: error.message }, error.status, id);
  }
  console.error(JSON.stringify({ event: "sakeenah_ai_error", request_id: id, error: "provider_or_runtime_error" }));
  return jsonResponse(request, { error: "Failed to generate AI response" }, 500, id);
}

function streamResponse(request: Request, messages: ChatMessage[], id: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      try {
        if (!hasGeminiApiKey()) {
          const words = OFFLINE_FALLBACK_TEXT.split(" ");
          for (let index = 0; index < words.length; index += 1) {
            const chunkWord = `${index === 0 ? "" : " "}${words[index]}`;
            send(JSON.stringify({ text: chunkWord }));
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
          send("[DONE]");
          return;
        }

        const ai = getGeminiClient();
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.5-flash",
          contents: formatMessagesForGemini(messages),
          config: {
            systemInstruction: SAKEENAH_SYSTEM_INSTRUCTION,
            temperature: 0.1,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) send(JSON.stringify({ text }));
        }
        send("[DONE]");
      } catch {
        send(JSON.stringify({ error: "Failed to generate stream response" }));
        send("[DONE]");
        console.error(JSON.stringify({ event: "sakeenah_ai_stream_error", request_id: id }));
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
    const { messages, stream } = validateChatRequest(body, id);

    if (stream) return streamResponse(request, messages, id);

    if (!hasGeminiApiKey()) return jsonResponse(request, { text: OFFLINE_FALLBACK_TEXT }, 200, id);

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formatMessagesForGemini(messages),
      config: {
        systemInstruction: SAKEENAH_SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });
    return jsonResponse(request, { text: response.text?.trim() || "" }, 200, id);
  } catch (error) {
    return errorResponse(request, error, id);
  }
});
