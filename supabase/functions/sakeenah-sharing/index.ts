import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_TITLE_CHARS = 160;
const PUBLIC_APP_URL = (Deno.env.get("PUBLIC_APP_URL") ?? "https://sakina-design-transplant.vercel.app").replace(/\/$/, "");

class ShareError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}

function requestId() {
  return crypto.randomUUID();
}

function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) throw new ShareError("service_unavailable", 503, "خدمة المشاركة غير متاحة حاليًا.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function allowedOrigin(origin: string | null) {
  if (!origin) return true;
  return new Set([
    "https://sakina-design-transplant.vercel.app",
    "https://localhost",
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "capacitor://localhost",
  ]).has(origin);
}

function headers(request: Request, publicRead = false) {
  const origin = request.headers.get("origin");
  const result = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin",
  });
  if (publicRead) {
    result.set("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigin(origin)) {
    result.set("Access-Control-Allow-Origin", origin);
  }
  result.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
  result.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return result;
}

function json(request: Request, body: unknown, status = 200, publicRead = false, id?: string) {
  const result = headers(request, publicRead);
  if (id) result.set("X-Request-Id", id);
  return new Response(JSON.stringify(body), { status, headers: result });
}

function assertOrigin(request: Request) {
  if (!allowedOrigin(request.headers.get("origin"))) {
    throw new ShareError("origin_not_allowed", 403, "مصدر الطلب غير مسموح.");
  }
}

async function readBody(request: Request) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new ShareError("body_too_large", 413, "بيانات الطلب كبيرة جدًا.");
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ShareError("invalid_json", 400, "بيانات الطلب غير صالحة.");
  }
}

function stringField(body: Record<string, unknown>, field: string, max: number) {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  if (!value || value.length > max) throw new ShareError("invalid_input", 400, "بيانات الطلب غير صالحة.");
  return value;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requireUser(request: Request, client: SupabaseClient) {
  assertOrigin(request);
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new ShareError("unauthorized", 401, "يجب تسجيل الدخول أولًا.");
  const token = header.slice(7).trim();
  if (!token || token.length > 16_384) throw new ShareError("unauthorized", 401, "جلسة الدخول غير صالحة.");
  const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) throw new ShareError("unauthorized", 401, "جلسة الدخول غير صالحة.");
  return data.user;
}

async function publicConversation(client: SupabaseClient, token: string) {
  const tokenHash = await sha256Hex(token);
  const { data, error } = await client.rpc("get_shared_sakeenah_conversation", { p_token_hash: tokenHash });
  if (error || !data) throw new ShareError("share_not_found", 404, "المحادثة غير متاحة حاليًا.");
  return data;
}

async function createShare(client: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const conversationId = stringField(body, "conversationId", 64);
  if (!isUuid(conversationId)) throw new ShareError("invalid_input", 400, "معرّف المحادثة غير صالح.");
  const { data, error } = await client.rpc("create_sakeenah_share", {
    p_conversation_id: conversationId,
    p_owner_user_id: userId,
  });
  if (error || !data) throw new ShareError("share_failed", 503, "تعذر إنشاء رابط المشاركة.");
  return {
    ...data,
    url: `${PUBLIC_APP_URL}/shared/chat/${encodeURIComponent(data.token)}`,
  };
}

async function updateConversation(client: SupabaseClient, userId: string, action: string, body: Record<string, unknown>) {
  const conversationId = stringField(body, "conversationId", 64);
  if (!isUuid(conversationId)) throw new ShareError("invalid_input", 400, "معرّف المحادثة غير صالح.");
  if (action === "rename") {
    const title = stringField(body, "title", MAX_TITLE_CHARS);
    const { data, error } = await client.from("ai_conversations").update({ title }).eq("id", conversationId).eq("user_id", userId).select("id,title,updated_at").maybeSingle();
    if (error || !data) throw new ShareError("not_found", 404, "المحادثة غير موجودة.");
    return { conversation: data };
  }
  if (action === "pin") {
    const pinned = body.pinned === true;
    const { data, error } = await client.from("ai_conversations").update({ pinned_at: pinned ? new Date().toISOString() : null }).eq("id", conversationId).eq("user_id", userId).select("id,pinned_at").maybeSingle();
    if (error || !data) throw new ShareError("not_found", 404, "المحادثة غير موجودة.");
    return { conversation: data };
  }
  if (action === "delete") {
    const { data, error } = await client.from("ai_conversations").delete().eq("id", conversationId).eq("user_id", userId).select("id").maybeSingle();
    if (error || !data) throw new ShareError("not_found", 404, "المحادثة غير موجودة.");
    return { deleted: true, conversationId };
  }
  throw new ShareError("invalid_action", 400, "الإجراء غير مدعوم.");
}

async function revokeShare(client: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const conversationId = stringField(body, "conversationId", 64);
  if (!isUuid(conversationId)) throw new ShareError("invalid_input", 400, "معرّف المحادثة غير صالح.");
  const { data, error } = await client
    .from("ai_conversation_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("owner_user_id", userId)
    .is("revoked_at", null)
    .select("id")
    .limit(1);
  if (error) throw new ShareError("share_failed", 503, "تعذر إلغاء رابط المشاركة.");
  return { revoked: (data ?? []).length > 0 };
}

async function forkConversation(client: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const token = stringField(body, "token", 96);
  const hash = await sha256Hex(token);
  const { data, error } = await client.rpc("fork_sakeenah_conversation", { p_token_hash: hash, p_forked_user_id: userId });
  if (error || !data) throw new ShareError("fork_failed", 400, "تعذر مواصلة المحادثة حاليًا.");
  return { conversationId: data as string };
}

Deno.serve(async (request: Request) => {
  const id = requestId();
  try {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(request) });
    const client = serviceClient();
    const url = new URL(request.url);

    if (request.method === "GET") {
      const token = url.searchParams.get("token") ?? "";
      return json(request, await publicConversation(client, token), 200, true, id);
    }

    if (request.method !== "POST") throw new ShareError("method_not_allowed", 405, "الطريقة غير مدعومة.");
    const body = await readBody(request);
    const action = typeof body.action === "string" ? body.action : "";
    const user = await requireUser(request, client);

    if (action === "create_share") return json(request, await createShare(client, user.id, body), 200, false, id);
    if (action === "revoke_share") return json(request, await revokeShare(client, user.id, body), 200, false, id);
    if (action === "fork") return json(request, await forkConversation(client, user.id, body), 200, false, id);
    if (action === "rename" || action === "pin" || action === "delete") return json(request, await updateConversation(client, user.id, action, body), 200, false, id);
    throw new ShareError("invalid_action", 400, "الإجراء غير مدعوم.");
  } catch (error) {
    if (error instanceof ShareError) return json(request, { error: error.message, code: error.code }, error.status, request.method === "GET", id);
    console.error(JSON.stringify({ event: "sakeenah_sharing_error", request_id: id, message: error instanceof Error ? error.message.slice(0, 240) : "unknown" }));
    return json(request, { error: "تعذر تنفيذ العملية حاليًا.", code: "internal_error" }, 500, request.method === "GET", id);
  }
});
