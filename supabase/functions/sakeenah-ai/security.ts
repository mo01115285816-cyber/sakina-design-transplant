import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { corsHeaders as supabaseCorsHeaders } from "npm:@supabase/supabase-js@2.112.3/cors";

const MAX_BODY_BYTES = 256 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://sakina-design-transplant.vercel.app",
  "https://localhost",
  "http://localhost",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "capacitor://localhost",
]);

export interface AuthenticatedUser {
  id: string;
  email?: string;
  accessToken: string;
}

export function requestId(): string {
  return crypto.randomUUID();
}

export function corsForRequest(request: Request): Headers {
  const headers = new Headers(supabaseCorsHeaders);
  const origin = request.headers.get("origin");
  headers.delete("Access-Control-Allow-Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Vary", "Origin");
  headers.set("Cache-Control", "no-store");
  return headers;
}

export function preflightResponse(request: Request): Response {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsForRequest(request) });
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
  id?: string,
): Response {
  const headers = corsForRequest(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (id) headers.set("X-Request-Id", id);
  return new Response(JSON.stringify(body), { status, headers });
}

export function streamHeaders(request: Request, id: string): Headers {
  const headers = corsForRequest(request);
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Connection", "keep-alive");
  headers.set("X-Request-Id", id);
  return headers;
}

export async function readJson(request: Request, id: string): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new SecurityError("Request body is too large", 413, id);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new SecurityError("Request body is too large", 413, id);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new SecurityError("Invalid JSON body", 400, id);
  }
}

export async function requireUser(request: Request, id: string): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    throw new SecurityError("Authentication required", 401, id);
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token || token.length > 16_384) {
    throw new SecurityError("Authentication required", 401, id);
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!publishableKey) {
    throw new SecurityError("Authentication service unavailable", 503, id);
  }

  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new SecurityError("Authentication required", 401, id);
  }

  return { id: data.user.id, email: data.user.email, accessToken: token };
}

export async function consumeRateLimit(id: string, accessToken: string): Promise<void> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!publishableKey) {
    throw new SecurityError("Rate limit service unavailable", 503, id);
  }

  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await client.rpc("consume_ai_rate_limit");
  if (error) {
    console.error(JSON.stringify({ event: "rate_limit_error", request_id: id, code: error.code }));
    throw new SecurityError("Rate limit service unavailable", 503, id);
  }
  if (data !== true) {
    throw new SecurityError("Too many AI requests. Please try again later.", 429, id);
  }
}

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

export class SecurityError extends Error {
  constructor(message: string, public readonly status: number, public readonly id: string) {
    super(message);
    this.name = "SecurityError";
  }
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || ALLOWED_ORIGINS.has(origin);
}
