import { getCurrentSession } from "./auth-service";
import { getSupabaseClient, supabaseKey, supabaseUrl } from "./supabase-client";

export type SharedConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type SharedConversationPayload = {
  conversation: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
  };
  messages: SharedConversationMessage[];
  share: {
    createdAt: string;
    expiresAt: string | null;
  };
};

export type ConversationShareResult = {
  shareId: string;
  token: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
};

function getSharingUrl() {
  const base = supabaseUrl?.replace(/\/$/, "");
  if (!base || !supabaseKey) throw new Error("لم يتم إعداد اتصال المشاركة.");
  return `${base}/functions/v1/sakeenah-sharing`;
}

async function callSharing<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const session = await getCurrentSession();
  if (!session?.access_token) throw new Error("يجب تسجيل الدخول أولًا.");

  const response = await fetch(getSharingUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result?.error === "string" ? result.error : "تعذر تنفيذ العملية حاليًا.");
  }
  return result as T;
}

export function getPublicShareTokenFromPath(pathname = typeof window !== "undefined" ? window.location.pathname : "") {
  const match = pathname.match(/^\/shared\/chat\/([A-Za-z0-9_-]{32,96})\/?$/);
  return match?.[1] ?? null;
}

export async function loadPublicSharedConversation(token: string): Promise<SharedConversationPayload> {
  const response = await fetch(`${getSharingUrl()}?token=${encodeURIComponent(token)}`, {
    headers: { apikey: supabaseKey },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "رابط المشاركة غير صالح أو منتهي.");
  return result as SharedConversationPayload;
}

export function createSakeenahConversationShare(conversationId: string) {
  return callSharing<ConversationShareResult>("create_share", { conversationId });
}

export function revokeSakeenahConversationShare(conversationId: string) {
  return callSharing<{ revoked: boolean }>("revoke_share", { conversationId });
}

export function forkSakeenahSharedConversation(token: string) {
  return callSharing<{ conversationId: string }>("fork", { token });
}

export async function renameSakeenahConversation(conversationId: string, title: string) {
  const normalizedTitle = title.trim().slice(0, 160);
  if (!normalizedTitle) throw new Error("اسم المحادثة لا يمكن أن يكون فارغًا.");

  const { data, error } = await getSupabaseClient()
    .from("ai_conversations")
    .update({ title: normalizedTitle })
    .eq("id", conversationId)
    .select("id,title,updated_at")
    .single();

  if (error) throw error;
  return { conversation: data as { id: string; title: string; updated_at: string } };
}

export async function pinSakeenahConversation(conversationId: string, pinned: boolean) {
  const { data, error } = await getSupabaseClient()
    .from("ai_conversations")
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq("id", conversationId)
    .select("id,pinned_at")
    .single();

  if (error) throw error;
  return { conversation: data as { id: string; pinned_at: string | null } };
}

export async function permanentlyDeleteSakeenahConversation(conversationId: string) {
  const { data, error } = await getSupabaseClient()
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("المحادثة غير موجودة أو لم تعد متاحة.");
  return { deleted: true as const, conversationId };
}
