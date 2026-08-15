# Sakeenah AI migration baseline

## Scope

The migration must preserve the existing Sakeenah AI behavior exactly. The system prompt, Arabic tone, source hierarchy, citation requirements, anti-jailbreak rules, distress handling, out-of-scope responses, model name, temperature, fallback messages, and streaming event format are behavioral invariants.

## Current chat behavior

The protected Express endpoints are:

- `POST /api/sakeenah-ai/chat` for a JSON response.
- `POST /api/sakeenah-ai/chat/stream` for SSE streaming.

Both require a Supabase Bearer JWT. The request body is `{ "messages": [{ "role": "user" | "assistant", "content": string }] }`.

The chat service currently uses the model `gemini-3.5-flash`, temperature `0.1`, the verbatim Arabic `SAKEENAH_SYSTEM_INSTRUCTION` in `src/server/services/sakeenah-ai-service.ts`, and maps assistant messages to Gemini role `model`. The streaming contract is `data: {"text":"..."}\n\n` followed by `data: [DONE]\n\n`. Errors are sent as `data: {"error":"..."}\n\n` after streaming begins.

## Current Quran reflection behavior

The protected Express endpoint is `POST /api/quran/reflection`. Its request body is `{ verseText, surahName, verseNumber, tafsirText? }`; its response is `{ reflection: string }`. The service prompt in `src/server/services/reflection-service.ts` must be preserved verbatim, and it currently uses `gemini-3.5-flash` without a temperature override. The no-key fallback text must remain unchanged.

## Current frontend contract

`SakeenahAIScreen.tsx` sends the Supabase access token as `Authorization: Bearer <token>`, reads the response body with `ReadableStream.getReader()`, parses SSE `data:` lines, appends `parsed.text`, and terminates on `[DONE]`. Native Android currently requires `VITE_API_BASE_URL`; this requirement can be removed only after the client uses a Supabase Edge Function invocation or a stable Supabase Function URL.

## Security invariants

Gemini credentials must never be included in Vercel `VITE_` variables, browser bundles, or APKs. Edge Functions must validate the JWT, validate and bound the request body, enforce per-user/IP rate limits, avoid logging tokens or user content, restrict CORS to the web origin and Capacitor origin, and return generic errors without provider internals.

## Migration acceptance criteria

1. The exact chat and reflection prompts remain unchanged.
2. Model and temperature settings remain unchanged unless an explicit compatibility decision is documented.
3. Web and Android receive equivalent response text and streaming semantics.
4. Unauthenticated requests return 401/403 and malformed or oversized requests are rejected.
5. Gemini secret is readable only by the Edge Function.
6. Existing authentication, profiles, RLS, and Google OAuth behavior remain unaffected.
7. Web build, Android build, and endpoint security tests pass before deployment.
