import { Router } from "express";
import { generateSakeenahChatResponse, streamSakeenahChatResponse } from "../services/sakeenah-ai-service";
import type { ChatMessage } from "../services/sakeenah-ai-service";
import type { ApiError } from "../types";

const router = Router();

interface ChatRequestBody {
  messages?: ChatMessage[];
}

// Sakeenah AI chatbot endpoint (non-streaming)
router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body as ChatRequestBody;

    if (!messages || !Array.isArray(messages)) {
      const errBody: ApiError = { error: "Missing or invalid messages parameter" };
      res.status(400).json(errBody);
      return;
    }

    const result = await generateSakeenahChatResponse(messages);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini chat endpoint error:", error);
    const errBody: ApiError = { error: "Failed to generate AI response" };
    res.status(500).json(errBody);
  }
});

// Sakeenah AI chatbot streaming endpoint (SSE)
router.post("/chat/stream", async (req, res) => {
  try {
    const { messages } = req.body as ChatRequestBody;

    if (!messages || !Array.isArray(messages)) {
      const errBody: ApiError = { error: "Missing or invalid messages parameter" };
      res.status(400).json(errBody);
      return;
    }

    await streamSakeenahChatResponse(messages, res);
  } catch (error: any) {
    console.error("Gemini chat stream endpoint error:", error);
    if (!res.headersSent) {
      const errBody: ApiError = { error: "Failed to generate stream response" };
      res.status(500).json(errBody);
    } else {
      res.write(`data: ${JSON.stringify({ error: "Failed to generate stream response" })}\n\n`);
      res.end();
    }
  }
});

export default router;
