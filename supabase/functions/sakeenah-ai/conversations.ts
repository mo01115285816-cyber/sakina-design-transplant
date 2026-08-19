import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";
import { getGeminiClient, hasGeminiApiKey } from "./gemini.ts";
import { requiredEnv, SecurityError, type AuthenticatedUser } from "./security.ts";
import type { ChatMessage } from "./contracts.ts";

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  context_summary: string | null;
  summary_updated_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const RECENT_CONTEXT_MESSAGES = 18;
const SUMMARY_EVERY_MESSAGES = 10;
const MAX_SUMMARY_CHARS = 10_000;

function getUserClient(accessToken: string): SupabaseClient {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!publishableKey) throw new Error("Missing Supabase publishable key");

  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function assertConversationId(conversationId: string, id: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
    throw new SecurityError("Invalid conversation", 400, id);
  }
}

function toChatMessage(row: MessageRow): ChatMessage {
  return { role: row.role, content: row.content };
}

function makeTitle(content: string): string {
  const normalized = content
    .replace(/[`*_#>\[\]()`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || "محادثة جديدة").slice(0, 56);
}

export async function loadConversationContext(
  user: AuthenticatedUser,
  conversationId: string,
  message: string,
  id: string,
): Promise<{ conversation: ConversationRow; messages: ChatMessage[]; messageCount: number }> {
  assertConversationId(conversationId, id);
  const client = getUserClient(user.accessToken);
  const { data: conversation, error: conversationError } = await client
    .from("ai_conversations")
    .select("id,user_id,title,context_summary,summary_updated_at")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (conversationError || !conversation) {
    throw new SecurityError("Conversation not found", 404, id);
  }

  const { data: recentRows, error: messagesError, count } = await client
    .from("ai_messages")
    .select("id,conversation_id,user_id,role,content,created_at", { count: "exact" })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(RECENT_CONTEXT_MESSAGES);

  if (messagesError) throw new SecurityError("Conversation history unavailable", 503, id);

  const orderedRecentMessages = ((recentRows ?? []) as MessageRow[]).reverse().map(toChatMessage);
  const firstUserIndex = orderedRecentMessages.findIndex((item) => item.role === "user");
  const recentMessages = firstUserIndex >= 0 ? orderedRecentMessages.slice(firstUserIndex) : [];
  const contextMessages: ChatMessage[] = [];
  if (conversation.context_summary?.trim()) {
    contextMessages.push({
      role: "user",
      content: `[ملخص سابق للمحادثة — استخدمه لفهم السياق ولا تعرضه للمستخدم]\n${conversation.context_summary.trim()}`,
    });
    contextMessages.push({
      role: "assistant",
      content: "تم استيعاب ملخص المحادثة السابقة وسأتابع مع الحفاظ على السياق.",
    });
  }
  contextMessages.push(...recentMessages);
  contextMessages.push({ role: "user", content: message });

  const mergedMessages = contextMessages.reduce<ChatMessage[]>((result, current) => {
    const previous = result[result.length - 1];
    if (previous?.role === current.role) {
      previous.content = `${previous.content}\n\n${current.content}`;
    } else {
      result.push({ ...current });
    }
    return result;
  }, []);

  return {
    conversation: conversation as ConversationRow,
    messages: mergedMessages,
    messageCount: (count ?? 0) + 1,
  };
}

export async function saveUserMessage(
  user: AuthenticatedUser,
  conversationId: string,
  message: string,
  id: string,
): Promise<void> {
  const client = getUserClient(user.accessToken);
  const { error } = await client.from("ai_messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (error) throw new SecurityError("Could not save user message", 503, id);
}

export async function saveAssistantMessage(
  user: AuthenticatedUser,
  conversation: ConversationRow,
  userMessage: string,
  content: string,
  messageCount: number,
  id: string,
): Promise<void> {
  const client = getUserClient(user.accessToken);
  const { error: messageError } = await client.from("ai_messages").insert({
    conversation_id: conversation.id,
    user_id: user.id,
    role: "assistant",
    content,
  });
  if (messageError) throw new SecurityError("Could not save assistant message", 503, id);

  const update: Record<string, string> = {
    last_message_at: new Date().toISOString(),
  };
  if (conversation.title === "محادثة جديدة") update.title = makeTitle(userMessage);
  const { error: conversationError } = await client
    .from("ai_conversations")
    .update(update)
    .eq("id", conversation.id)
    .eq("user_id", user.id);
  if (conversationError) throw new SecurityError("Could not update conversation", 503, id);

  if (messageCount >= SUMMARY_EVERY_MESSAGES && messageCount % SUMMARY_EVERY_MESSAGES === 0) {
    void updateRollingSummary(user, conversation.id, conversation.context_summary, id);
  }
}

async function updateRollingSummary(
  user: AuthenticatedUser,
  conversationId: string,
  previousSummary: string | null,
  id: string,
): Promise<void> {
  if (!hasGeminiApiKey()) return;
  try {
    const client = getUserClient(user.accessToken);
    const { data: rows, error } = await client
      .from("ai_messages")
      .select("role,content,created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(RECENT_CONTEXT_MESSAGES);
    if (error) return;

    const transcript = ((rows ?? []) as Array<Pick<MessageRow, "role" | "content" | "created_at">>)
      .reverse()
      .map((row) => `${row.role === "user" ? "المستخدم" : "سكينة"}: ${row.content}`)
      .join("\n");
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [{
          text: [
            "أنشئ ملخصًا داخليًا موجزًا للمحادثة التالية ليستعمله مساعد شرعي في متابعة الحوار.",
            "احتفظ بالأسئلة والقرارات والتفضيلات المهمة فقط، ولا تضف معلومات غير موجودة.",
            "لا تذكر أنك تلخص، ولا تخاطب المستخدم، ولا تتجاوز 400 كلمة.",
            previousSummary ? `الملخص السابق:\n${previousSummary}` : "لا يوجد ملخص سابق.",
            `الرسائل الأخيرة:\n${transcript}`,
          ].join("\n\n"),
        }],
      }],
      config: { temperature: 0.1 },
    });
    const summary = response.text?.trim().slice(0, MAX_SUMMARY_CHARS);
    if (!summary) return;
    await client
      .from("ai_conversations")
      .update({ context_summary: summary, summary_updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);
  } catch (error) {
    console.error(JSON.stringify({
      event: "sakeenah_ai_summary_error",
      request_id: id,
      error: "summary_update_failed",
    }));
  }
}
