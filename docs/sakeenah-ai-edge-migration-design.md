# Sakeenah AI Edge Functions migration design

## Decision

Move the authenticated chat and Quran reflection APIs to Supabase Edge Functions. Preserve the existing prompts, model name, temperature, message mapping, fallback text, response schema, and SSE event format. Keep the current Express routes temporarily as a rollback reference until the Edge Functions pass parity tests; the frontend will switch only after the new functions are verified.

Supabase Edge Functions are TypeScript functions running on the Deno-compatible edge runtime and are intended for authenticated HTTP endpoints, third-party API orchestration, and small AI tasks [1]. The official authentication pattern keeps JWT verification enabled and uses an authenticated user context [2].

## Viable approaches

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---|---|
| Supabase Edge Functions (selected) | Centralizes Auth, project secrets, and AI endpoints; removes the separate Express production host; requires a Deno-compatible rewrite and explicit streaming tests | Uses Supabase function invocations and Gemini usage; no separate server host | Medium |
| Keep Express on a dedicated HTTPS host | Smallest application-code change and preserves the existing Node/SSE runtime; adds another host, deployment pipeline, secret store, monitoring surface, and URL configuration | Separate host cost plus Gemini usage | Low to medium |
| Replace streaming with one-shot requests | Simplest client/server transport; changes the current user experience and may increase perceived latency, so it is not acceptable for the current Sakeenah UX | Lowest infrastructure complexity | Low, but behaviorally incompatible |

The selected approach is the first one because the user wants Supabase to own the backend secrets and because Supabase documents Edge Functions for authenticated endpoints and AI orchestration [1]. The second approach remains the rollback option. The third approach is explicitly rejected because it changes the current streaming behavior.

## Function boundaries

- `sakeenah-ai`: accepts `POST /chat` and `POST /chat/stream` within one function, preserving the current route semantics.
- `quran-reflection`: accepts `POST /reflection`, preserving the current request and response schema.

Both functions will require a valid user JWT. Platform JWT verification remains enabled, and the handler will obtain the authenticated user context using the current Supabase server authentication pattern [2]. CORS will allow the production Vercel origin and local Capacitor/web development origins only; preflight handling follows the official Edge Function guidance [3].

## Secret boundary

`GEMINI_API_KEY` remains a Supabase project secret and is read only by the Edge Function. The Supabase URL and publishable key remain public client configuration. No Google, Gemini, service-role, or secret API key is added to Vercel `VITE_` variables, the browser bundle, or the APK.

## Compatibility contract

The chat system instruction remains byte-for-byte identical to the existing service. The model remains `gemini-3.5-flash`, temperature remains `0.1`, and assistant messages continue to map to Gemini's `model` role. Streaming emits `data: {"text":"..."}\n\n` chunks followed by `data: [DONE]\n\n`. Reflection keeps its existing Arabic prompt, model, fallback response, and `{ reflection: string }` response.

## Security controls

The functions will reject non-POST requests, require a valid JWT, reject malformed JSON, bound the number and size of messages, bound reflection input lengths, use per-user rate limiting backed by a locked database table/function, avoid logging tokens or user content, return generic provider errors, and emit a request correlation ID without sensitive payloads. The client will continue sending the session access token and will stop depending on a separately hosted AI base URL after the Edge Function path is verified.

## References

[1]: https://supabase.com/docs/guides/functions "Supabase Edge Functions"
[2]: https://supabase.com/docs/guides/functions/auth "Securing Edge Functions"
[3]: https://supabase.com/docs/guides/functions/cors "CORS support for invoking Edge Functions"
