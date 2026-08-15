# Live migration checks

- Supabase function `sakeenah-ai`: ACTIVE, version 3, `verify_jwt=true`.
- Supabase function `quran-reflection`: ACTIVE, version 3, `verify_jwt=true`.
- Unauthenticated POST to `/functions/v1/sakeenah-ai` returned HTTP 401 with `Authentication required`.
- Unauthenticated POST to `/functions/v1/quran-reflection` returned HTTP 401 with `Authentication required`.
- OPTIONS request from `https://evil.example` returned HTTP 403 with `Origin not allowed`.
- Web client `npm run build` passed after switching Sakeenah AI to the Supabase Function URL and removing the old `VITE_API_BASE_URL` dependency.
- Prompt comparison test reported `CHAT_PROMPT_IDENTICAL=true` and `REFLECTION_TEMPLATE_IDENTICAL=true`.
- Supabase Security Advisor no longer reports the rate-limit SECURITY DEFINER warning. One unrelated project-level warning remains: leaked password protection is disabled in Supabase Auth and must be enabled from the Auth password-security settings.
- The deployed Vercel site currently renders Sakeenah successfully at `/auth/callback`.
