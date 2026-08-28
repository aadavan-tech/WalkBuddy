/**
 * Client for the WalkBuddy AI rephrase service.
 *
 * Calls the WalkBuddy application server at /api/rephrase (powered by Gemini API
 * with server fallback) or a custom remote AI server if VITE_AI_SERVER_URL is defined.
 */
const rawUrl = (import.meta.env.VITE_AI_SERVER_URL as string | undefined) || "";
const AI_SERVER_URL = rawUrl.replace(/\/$/, "");

export interface RephraseResult {
  rephrased: string;
  device: string;
  model: string;
  took_ms: number;
}

/** True if the AI server is up and reachable. */
export async function checkAiServer(timeoutMs = 2500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const url = AI_SERVER_URL ? `${AI_SERVER_URL}/health` : "/api/health";
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Rephrase `text`. Calls /api/rephrase or custom AI server.
 */
export async function rephraseText(
  text: string,
  style?: string
): Promise<RephraseResult> {
  let res: Response | null = null;
  const endpoint = AI_SERVER_URL ? `${AI_SERVER_URL}/rephrase` : "/api/rephrase";

  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style }),
    });
  } catch {
    // If custom endpoint failed, try relative /api/rephrase
    if (AI_SERVER_URL) {
      try {
        res = await fetch("/api/rephrase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, style }),
        });
      } catch {
        res = null;
      }
    }
  }

  if (!res) {
    throw new Error("Can't reach the AI rephrase service.");
  }

  if (!res.ok) {
    throw new Error(`AI service error (${res.status}).`);
  }

  return (await res.json()) as RephraseResult;
}

export { AI_SERVER_URL };
