# Supabase Edge Functions research notes

## Official sources

- Supabase Edge Functions guide: https://supabase.com/docs/guides/functions
- Securing Edge Functions: https://supabase.com/docs/guides/functions/auth
- CORS support: https://supabase.com/docs/guides/functions/cors
- Function configuration: https://supabase.com/docs/guides/functions/function-configuration
- Quickstart and deployment: https://supabase.com/docs/guides/functions/quickstart
- Google Gen AI JavaScript SDK: https://googleapis.github.io/js-genai/

## Verified design facts

Supabase Edge Functions run TypeScript on a Deno-compatible edge runtime and are intended for authenticated HTTP endpoints, third-party API orchestration, and small AI tasks. The official auth pattern keeps JWT verification enabled and can use an authenticated user context. The platform's default `verify_jwt` setting should remain enabled for user-facing functions.

The official CORS guidance supports automatic preflight handling with `withSupabase`, or importing synchronized `corsHeaders` from `npm:@supabase/supabase-js@^2/cors` when handling requests manually. The implementation uses the latter with an explicit origin allow-list for the Vercel site, Capacitor WebView origins, and local development.

The official quickstart confirms production function URLs use `https://<project-ref>.supabase.co/functions/v1/<function-name>`, and client applications can invoke functions with `supabase.functions.invoke`. The current chat client uses direct fetch to preserve the existing readable SSE stream contract; it sends the publishable key and the user's Bearer access token.

The Google Gen AI JavaScript SDK documentation confirms server-side API-key use, warns not to expose API keys in browser code, and supports `generateContentStream`. The migration pins `@google/genai@2.10.0` to match the existing project dependency and keeps the existing `gemini-3.5-flash` model and temperature settings.
