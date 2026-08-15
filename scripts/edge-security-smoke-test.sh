#!/usr/bin/env bash
set -u

PROJECT_URL="${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL before running}"
PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:?Set VITE_SUPABASE_PUBLISHABLE_KEY before running}"

request_status() {
  local label="$1"
  shift
  local status
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$@")
  printf '%-30s %s\n' "$label" "$status"
}

printf '%s\n' 'Edge Function security smoke test'
request_status 'chat without bearer' \
  -X POST "$PROJECT_URL/functions/v1/sakeenah-ai" \
  -H "apikey: $PUBLISHABLE_KEY" -H 'Content-Type: application/json' \
  --data '{"messages":[],"stream":true}'
request_status 'reflection without bearer' \
  -X POST "$PROJECT_URL/functions/v1/quran-reflection" \
  -H "apikey: $PUBLISHABLE_KEY" -H 'Content-Type: application/json' \
  --data '{"verseText":"x","surahName":"x","verseNumber":"1"}'
request_status 'chat with fake bearer' \
  -X POST "$PROJECT_URL/functions/v1/sakeenah-ai" \
  -H "apikey: $PUBLISHABLE_KEY" -H 'Authorization: Bearer invalid.invalid.invalid' \
  -H 'Content-Type: application/json' --data '{"messages":[],"stream":true}'
request_status 'chat wrong method' \
  -X GET "$PROJECT_URL/functions/v1/sakeenah-ai" \
  -H "apikey: $PUBLISHABLE_KEY"
request_status 'CORS disallowed origin' \
  -X OPTIONS "$PROJECT_URL/functions/v1/sakeenah-ai" \
  -H "apikey: $PUBLISHABLE_KEY" -H 'Origin: https://evil.example' \
  -H 'Access-Control-Request-Method: POST'
request_status 'CORS allowed origin' \
  -X OPTIONS "$PROJECT_URL/functions/v1/sakeenah-ai" \
  -H "apikey: $PUBLISHABLE_KEY" -H 'Origin: https://sakina-design-transplant.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,apikey,content-type'
