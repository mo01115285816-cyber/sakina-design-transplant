export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  conversationId?: unknown;
  message?: unknown;
  messages?: unknown;
  stream?: unknown;
}

export interface ReflectionRequest {
  verseText?: unknown;
  surahName?: unknown;
  verseNumber?: unknown;
  tafsirText?: unknown;
}

export const MAX_CHAT_MESSAGES = 24;
export const MAX_CHAT_MESSAGE_CHARS = 8_000;
export const MAX_CHAT_TOTAL_CHARS = 48_000;
export const MAX_CONVERSATION_ID_CHARS = 64;
export const MAX_REFLECTION_FIELD_CHARS = 12_000;
