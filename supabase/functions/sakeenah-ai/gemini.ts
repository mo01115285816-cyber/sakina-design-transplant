import { GoogleGenAI } from "npm:@google/genai@2.10.0";

let client: GoogleGenAI | null = null;

export function hasGeminiApiKey(): boolean {
  return Boolean(Deno.env.get("GEMINI_API_KEY")?.trim());
}

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!key) throw new Error("Gemini service is not configured");
  client = new GoogleGenAI({ apiKey: key });
  return client;
}
