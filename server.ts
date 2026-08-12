import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    device: "cpu",
    model: process.env.GEMINI_API_KEY ? "gemini-2.5-flash" : "fallback-text-processor"
  });
});

// AI Rephrase endpoint
app.post(["/rephrase", "/api/rephrase"], async (req, res) => {
  const { text, style } = req.body || {};
  const trimmedText = typeof text === "string" ? text.trim() : "";

  if (!trimmedText) {
    return res.json({ rephrased: "", device: "cpu", model: "none", took_ms: 0 });
  }

  const startTime = Date.now();

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You rewrite short trail/route descriptions for a walking & running social app. Rephrase the following text so it is clear, vivid and engaging, keeping the same facts and roughly the same length${
        style ? ` (${style})` : ""
      }:\n\n${trimmedText}\n\nReply with ONLY the rewritten description — no preamble, no quotes, no options.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const rephrased = response.text ? response.text.trim() : trimmedText;
      return res.json({
        rephrased,
        device: "cloud-gemini",
        model: "gemini-2.5-flash",
        took_ms: Date.now() - startTime,
      });
    } catch (err: any) {
      console.warn("[WalkBuddy] Gemini rephrase error, using fallback:", err?.message);
    }
  }

  // Fallback rephrase logic if GEMINI_API_KEY is missing or errors
  const rephrased = `Scenic trail update: ${trimmedText}`;
  return res.json({
    rephrased,
    device: "cpu",
    model: "fallback-rephrase",
    took_ms: Date.now() - startTime,
  });
});

// Configure Vite or Serve Static Production files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WalkBuddy Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
