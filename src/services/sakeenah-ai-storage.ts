import { getSupabaseClient } from "./supabase-client";

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  context_summary: string | null;
  summary_updated_at: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type StoredConversation = {
  id: string;
  title: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

function toConversation(row: ConversationRow): StoredConversation {
  return {
    id: row.id,
    title: row.title,
    lastMessageAt: new Date(row.last_message_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
  };
}

export async function listSakeenahConversations(): Promise<StoredConversation[]> {
  const { data, error } = await getSupabaseClient()
    .from("ai_conversations")
    .select("id,user_id,title,context_summary,summary_updated_at,last_message_at,created_at,updated_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data ?? []) as ConversationRow[]).map(toConversation);
}

export async function createSakeenahConversation(title = "محادثة جديدة"): Promise<StoredConversation> {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("يجب تسجيل الدخول أولًا.");

  const { data, error } = await client
    .from("ai_conversations")
    .insert({
      user_id: userData.user.id,
      title: title.trim().slice(0, 160) || "محادثة جديدة",
    })
    .select("id,user_id,title,context_summary,summary_updated_at,last_message_at,created_at,updated_at")
    .single();

  if (error) throw error;
  return toConversation(data as ConversationRow);
}

export async function loadSakeenahMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await getSupabaseClient()
    .from("ai_messages")
    .select("id,conversation_id,user_id,role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) throw error;
  return ((data ?? []) as MessageRow[]).map(toMessage);
}

export async function deleteSakeenahConversation(conversationId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId);

  if (error) throw error;
}
