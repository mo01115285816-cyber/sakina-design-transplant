import { Router } from "express";
import { generateReflection } from "../services/reflection-service";
import type { ReflectionRequest, ReflectionResponse, ApiError } from "../types";

const router = Router();

// AI-powered Quran verse Tadabbur (reflection) endpoint
// AI-powered Quran verse Tadabbur (reflection) endpoint
router.post("/reflection", async (req, res) => {
  try {
    const { verseText, surahName, verseNumber, tafsirText } = req.body as ReflectionRequest;

    if (!verseText || !surahName || !verseNumber) {
      const errBody: ApiError = { error: "Missing required fields: verseText, surahName, verseNumber" };
      res.status(400).json(errBody);
      return;
    }

    const result: ReflectionResponse = await generateReflection({ verseText, surahName, verseNumber, tafsirText });
    res.json(result);
  } catch (error: any) {
    console.error("Gemini reflection endpoint error:", error);
    const errBody: ApiError = { error: "Failed to generate AI reflection points" };
    res.status(500).json(errBody);
  }
});

export default router;
