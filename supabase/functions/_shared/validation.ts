import {
  MAX_CHAT_MESSAGE_CHARS,
  MAX_CHAT_MESSAGES,
  MAX_CHAT_TOTAL_CHARS,
  MAX_REFLECTION_FIELD_CHARS,
  type ChatMessage,
  type ChatRequest,
  type ReflectionRequest,
} from "./contracts.ts";
import { SecurityError } from "./security.ts";

export function validateChatRequest(value: unknown, id: string): { messages: ChatMessage[]; stream: boolean } {
  if (!value || typeof value !== "object") {
    throw new SecurityError("Missing or invalid messages parameter", 400, id);
  }
  const body = value as ChatRequest;
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_CHAT_MESSAGES) {
    throw new SecurityError("Missing or invalid messages parameter", 400, id);
  }

  let totalChars = 0;
  const messages = body.messages.map((raw) => {
    if (!raw || typeof raw !== "object") {
      throw new SecurityError("Missing or invalid messages parameter", 400, id);
    }
    const message = raw as Record<string, unknown>;
    const role = message.role;
    const content = message.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      throw new SecurityError("Missing or invalid messages parameter", 400, id);
    }
    const normalized = content.trim();
    if (!normalized || normalized.length > MAX_CHAT_MESSAGE_CHARS) {
      throw new SecurityError("Message is empty or too large", 400, id);
    }
    totalChars += normalized.length;
    return { role, content: normalized } as ChatMessage;
  });

  if (totalChars > MAX_CHAT_TOTAL_CHARS) {
    throw new SecurityError("Conversation is too large", 413, id);
  }

  return { messages, stream: body.stream === true };
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
