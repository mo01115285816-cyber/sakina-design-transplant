import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import recitersRouter from "./routes/reciters";
import quranReflectionRouter from "./routes/quran-reflection";
import sakeenahAiRouter from "./routes/sakeenah-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API routes
  app.use("/api", recitersRouter);
  app.use("/api/quran", quranReflectionRouter);
  app.use("/api/sakeenah-ai", sakeenahAiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
