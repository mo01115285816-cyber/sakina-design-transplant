import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getGeminiClient, hasGeminiApiKey } from "./gemini.ts";
import { buildReflectionPrompt } from "./prompts.ts";
import {
  consumeRateLimit,
  jsonResponse,
  preflightResponse,
  readJson,
  requireUser,
  requestId,
  SecurityError,
} from "./security.ts";
import { validateReflectionRequest } from "./validation.ts";

function errorResponse(request: Request, error: unknown, id: string): Response {
  if (error instanceof SecurityError) {
    return jsonResponse(request, { error: error.message }, error.status, id);
  }
  console.error(JSON.stringify({ event: "quran_reflection_error", request_id: id, error: "provider_or_runtime_error" }));
  return jsonResponse(request, { error: "Failed to generate AI reflection points" }, 500, id);
}

Deno.serve(async (request: Request) => {
  const id = requestId();
  if (request.method === "OPTIONS") return preflightResponse(request);
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405, id);

  try {
    const user = await requireUser(request, id);
    await consumeRateLimit(id, user.accessToken);
    const body = await readJson(request, id);
    const { verseText, surahName, verseNumber, tafsirText } = validateReflectionRequest(body, id);

    if (!hasGeminiApiKey()) {
      return jsonResponse(
        request,
        {
          reflection: `تدبر في قوله تعالى: { ${verseText} } - سورة ${surahName}، آية ${verseNumber}. تفكر في عظمة هذه الكلمات الربانية، فكل حرف في كتاب الله يحمل هداية ونوراً لطريقك، فاستلهم من معانيها السامية ما يقوي إيمانك ويرشد سلوكك اليومي.`,
        },
        200,
        id,
      );
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: buildReflectionPrompt(verseText, surahName, verseNumber, tafsirText),
    });
    return jsonResponse(request, { reflection: response.text?.trim() || "" }, 200, id);
  } catch (error) {
    return errorResponse(request, error, id);
  }
});
