import {
  MAX_CHAT_MESSAGE_CHARS,
  MAX_CHAT_MESSAGES,
  MAX_CHAT_TOTAL_CHARS,
  MAX_CONVERSATION_ID_CHARS,
  MAX_REFLECTION_FIELD_CHARS,
  type ChatMessage,
  type ChatRequest,
  type ReflectionRequest,
} from "./contracts.ts";
import { SecurityError } from "./security.ts";

export function validateChatRequest(value: unknown, id: string): { conversationId: string; message: string; stream: boolean } {
  if (!value || typeof value !== "object") {
    throw new SecurityError("Missing or invalid conversation request", 400, id);
  }
  const body = value as ChatRequest;
  if (typeof body.conversationId !== "string" || body.conversationId.trim().length === 0 || body.conversationId.length > MAX_CONVERSATION_ID_CHARS) {
    throw new SecurityError("Missing or invalid conversation", 400, id);
  }
  if (typeof body.message !== "string") {
    throw new SecurityError("Missing or invalid message", 400, id);
  }
  const message = body.message.trim();
  if (!message || message.length > MAX_CHAT_MESSAGE_CHARS) {
    throw new SecurityError("Message is empty or too large", 400, id);
  }
  return { conversationId: body.conversationId.trim(), message, stream: body.stream === true };
}

function requiredText(value: unknown, field: string, id: string, max = MAX_REFLECTION_FIELD_CHARS): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new SecurityError(`Missing required field: ${field}`, 400, id);
  }
  const text = String(value).trim();
  if (!text || text.length > max) {
    throw new SecurityError(`Invalid field: ${field}`, 400, id);
  }
  return text;
}

export function validateReflectionRequest(value: unknown, id: string) {
  if (!value || typeof value !== "object") {
    throw new SecurityError("Missing required fields", 400, id);
  }
  const body = value as ReflectionRequest;
  return {
    verseText: requiredText(body.verseText, "verseText", id),
    surahName: requiredText(body.surahName, "surahName", id, 256),
    verseNumber: requiredText(body.verseNumber, "verseNumber", id, 32),
    tafsirText: body.tafsirText == null ? undefined : requiredText(body.tafsirText, "tafsirText", id),
  };
}
