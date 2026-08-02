/**
 * Client for the local WalkBuddy AI rephrase server (ai-server/server.py).
 *
 * The model runs on ONE machine on the network — typically a teammate's
 * laptop — not a hosted service. Point every other dev at that machine by
 * setting VITE_AI_SERVER_URL (e.g. http://192.168.1.42:8000) in .env.local.
 * Defaults to localhost for whoever is running the server themselves.
 */
const AI_SERVER_URL = (
  (import.meta.env.VITE_AI_SERVER_URL as string | undefined) || "http://localhost:8000"
).replace(/\/$/, "");

export interface RephraseResult {
  rephrased: string;
  device: string;
  model: string;
  took_ms: number;
}

/** True if the local model server is up and reachable. */
export async function checkAiServer(timeoutMs = 2500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${AI_SERVER_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ask the local model to rephrase `text`. Throws a friendly Error when the
 * server is unreachable so the UI can tell the user to start it.
 */
export async function rephraseText(
  text: string,
  style?: string
): Promise<RephraseResult> {
  let res: Response;
  try {
    res = await fetch(`${AI_SERVER_URL}/rephrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style }),
    });
  } catch {
    throw new Error(
      `Can't reach the AI server at ${AI_SERVER_URL}. Make sure ai-server is running (see ai-server/README.md).`
    );
  }

  if (!res.ok) {
    throw new Error(`AI server error (${res.status}). Check the ai-server logs.`);
  }

  return (await res.json()) as RephraseResult;
}

export { AI_SERVER_URL };
