import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not set. AI reflection features will have a beautiful offline fallback.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "PLACEHOLDER_KEY"
    });
  }
  return aiClient;
}

export function hasGeminiApiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
