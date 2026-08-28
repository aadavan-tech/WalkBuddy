import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---- Security headers (SECURITY_AUDIT.md) ----
// Defense-in-depth: CSP, HSTS, frame options, etc.
app.use((req, res, next) => {
  // HSTS (only set in production over HTTPS)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // CSP: restrict sources for scripts, styles, images, etc.
  // Adjust as needed for your Vite dev setup and external resources.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite needs unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind/React need unsafe-inline
      "img-src 'self' data: https:", // Allow data URLs and HTTPS images
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co", // Supabase realtime
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; ")
  );
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ---- Rate limiting for AI rephrase endpoint (SECURITY_AUDIT.md) ----
// Simple in-memory token bucket (per IP). For production, use Redis-backed limiter.
const REPHRASE_RATE_LIMIT = 30; // requests
const REPHRASE_WINDOW_MS = 60_000; // 1 minute
const rephraseBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitRephrase(ip: string): boolean {
  const now = Date.now();
  const bucket = rephraseBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rephraseBuckets.set(ip, { count: 1, resetAt: now + REPHRASE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= REPHRASE_RATE_LIMIT) {
    return false;
  }
  bucket.count++;
  return true;
}

// ---- Prompt-injection hardening (SECURITY_AUDIT.md critical finding) ----

const ALLOWED_STYLES = new Set([
  "more energetic",
  "more concise",
  "shorter",
  "more descriptive",
  "friendlier",
  "more professional",
  "more casual",
]);

const MAX_INPUT_LENGTH = 2000;
const MAX_STYLE_LENGTH = 100;

// Strip common prompt-injection / jailbreak patterns from untrusted user text
// before it is interpolated into the LLM prompt.
function sanitizePromptInput(input: string, max = MAX_INPUT_LENGTH): string {
  return input
    .replace(/USER_INPUT_START|USER_INPUT_END/gi, "")
    .replace(/ignore\s+all\s+(previous|prior|above)\s+instructions/gi, "[filtered]")
    .replace(/system\s+prompt/gi, "[filtered]")
    .replace(/developer\s+instructions/gi, "[filtered]")
    .replace(/(reveal|leak|output|print|show)\b.{0,30}\b(api\s*key|secret|password|token)/gi, "[filtered]")
    .replace(/environment\s+variables/gi, "[filtered]")
    .replace(/<\|/g, "") // Strip special token syntax (e.g. <|im_start|>)
    .slice(0, max);
}

// The freeform `style` hint is also user-controlled — restrict to an allowlist.
function safeStyle(style: unknown): string {
  if (typeof style !== "string") return "";
  const normalized = style.trim().slice(0, MAX_STYLE_LENGTH).toLowerCase();
  return ALLOWED_STYLES.has(normalized) ? normalized : "";
}

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
  // Rate limit per IP
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!rateLimitRephrase(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please wait a moment before trying again.",
      retry_after_seconds: Math.ceil(REPHRASE_WINDOW_MS / 1000),
    });
  }

  const { text, style } = req.body || {};
  const rawText = typeof text === "string" ? text : "";
  const rawStyle = typeof style === "string" ? style : "";

  // Sanitize and validate inputs before using them in the prompt
  const sanitizedText = sanitizePromptInput(rawText.trim());
  const safeStyleHint = safeStyle(rawStyle);

  if (!sanitizedText) {
    return res.json({ rephrased: "", device: "cpu", model: "none", took_ms: 0 });
  }

  const startTime = Date.now();

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Use explicit delimiters + sanitized input to isolate user content
      const prompt = `You rewrite short trail/route descriptions for a walking & running social app.
Task: Rephrase the user's trail description so it is clear, vivid and engaging, keeping the same facts and roughly the same length${safeStyleHint ? ` (${safeStyleHint})` : ""}.

USER_INPUT_START
${sanitizedText}
USER_INPUT_END

Rules: Reply with ONLY the rewritten description — no preamble, no quotes, no options.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const rephrased = response.text ? response.text.trim() : sanitizedText;
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
  const rephrased = `Scenic trail update: ${sanitizedText}`;
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
