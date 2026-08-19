import type { GoogleGenAI } from "npm:@google/genai@2.10.0";
import { SAKEENAH_SYSTEM_INSTRUCTION } from "./prompts.ts";

const CACHE_MODEL = "gemini-3.5-flash";
const CACHE_TTL_SECONDS = 60 * 60;
const CACHE_REFRESH_MARGIN_SECONDS = 5 * 60;
const CACHE_RETRY_BACKOFF_MS = 30_000;

type CacheState = {
  name: string;
  promptHash: string;
  expiresAtMs: number;
};

type CacheClient = Pick<GoogleGenAI, "caches">;

let cacheState: CacheState | null = null;
let cacheCreationPromise: Promise<CacheState | null> | null = null;
let cacheRetryAfterMs = 0;

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isUsable(state: CacheState, promptHash: string, nowMs: number): boolean {
  return state.promptHash === promptHash
    && state.expiresAtMs - nowMs > CACHE_REFRESH_MARGIN_SECONDS * 1000;
}

function safeProviderError(error: unknown): { name: string; message?: string; status?: string; code?: string } {
  const candidate = error as { name?: unknown; message?: unknown; status?: unknown; code?: unknown };
  const rawMessage = typeof candidate?.message === "string" ? candidate.message : "";
  const message = rawMessage
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, "[redacted-key]")
    .replace(/([?&](?:key|api_key)=)[^&\\s]+/gi, "$1[redacted]")
    .slice(0, 240);
  return {
    name: typeof candidate?.name === "string" ? candidate.name.slice(0, 80) : "UnknownError",
    ...(message ? { message } : {}),
    ...(candidate?.status !== undefined ? { status: String(candidate.status).slice(0, 40) } : {}),
    ...(candidate?.code !== undefined ? { code: String(candidate.code).slice(0, 40) } : {}),
  };
}

async function createCache(client: CacheClient, promptHash: string): Promise<CacheState | null> {
  try {
    const cache = await client.caches.create({
      model: CACHE_MODEL,
      config: {
        displayName: `sakeenah-system-${promptHash.slice(0, 12)}`,
        systemInstruction: SAKEENAH_SYSTEM_INSTRUCTION,
        ttl: `${CACHE_TTL_SECONDS}s`,
      },
    });

    if (!cache.name) {
      throw new Error("Gemini returned a cached content without a resource name");
    }

    const providerExpiryMs = cache.expireTime ? Date.parse(cache.expireTime) : Number.NaN;
    const expiresAtMs = Number.isFinite(providerExpiryMs)
      ? providerExpiryMs
      : Date.now() + CACHE_TTL_SECONDS * 1000;

    const nextState: CacheState = { name: cache.name, promptHash, expiresAtMs };
    cacheState = nextState;
    cacheRetryAfterMs = 0;
    console.info(JSON.stringify({
      event: "sakeenah_ai_system_cache_ready",
      model: CACHE_MODEL,
      ttl_seconds: CACHE_TTL_SECONDS,
      prompt_hash_prefix: promptHash.slice(0, 12),
    }));
    return nextState;
  } catch (error) {
    cacheRetryAfterMs = Date.now() + CACHE_RETRY_BACKOFF_MS;
    console.warn(JSON.stringify({
      event: "sakeenah_ai_system_cache_unavailable",
      retry_after_ms: CACHE_RETRY_BACKOFF_MS,
      details: safeProviderError(error),
    }));
    return null;
  }
}

export async function getSystemInstructionCache(client: CacheClient): Promise<string | null> {
  const promptHash = await sha256Hex(SAKEENAH_SYSTEM_INSTRUCTION);
  const nowMs = Date.now();

  if (cacheState && isUsable(cacheState, promptHash, nowMs)) {
    return cacheState.name;
  }

  if (nowMs < cacheRetryAfterMs) return null;

  if (!cacheCreationPromise) {
    cacheCreationPromise = createCache(client, promptHash).finally(() => {
      cacheCreationPromise = null;
    });
  }

  const nextState = await cacheCreationPromise;
  return nextState?.name ?? null;
}

export function getSystemInstructionCacheForTests(): CacheState | null {
  return cacheState;
}

export function resetSystemInstructionCacheForTests(): void {
  cacheState = null;
  cacheCreationPromise = null;
  cacheRetryAfterMs = 0;
}
