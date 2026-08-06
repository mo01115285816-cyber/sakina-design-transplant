import { Router } from "express";
import type { RecitersResponse, ApiError } from "../types";

const router = Router();

// Proxy endpoint for mp3quran reciters to bypass CORS
// Proxy endpoint for mp3quran reciters to bypass CORS
router.get("/reciters", async (_req, res) => {
  try {
    const response = await fetch("https://www.mp3quran.net/api/v3/reciters?language=ar");
    if (!response.ok) {
      throw new Error(`Failed to fetch from mp3quran: ${response.statusText}`);
    }
    const data = await response.json() as RecitersResponse;
    res.json(data);
  } catch (error: any) {
    console.error("Proxy fetch reciters error:", error);
    const errBody: ApiError = { error: error.message || "Failed to fetch reciters" };
    res.status(500).json(errBody);
  }
});

export default router;
