# WalkBuddy — Local AI Rephrase Server

A tiny FastAPI server that runs a **~0.5B** instruction model locally to
rephrase trail descriptions in the Post Trail form. It runs on **one machine**
(a teammate's laptop) — not a hosted cloud service.

The model auto-selects the fastest device: **CUDA** (NVIDIA) → **MPS**
(Apple Silicon) → **CPU**.

## Run it

Requires Python 3.10–3.13.

```bash
cd ai-server
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

First run downloads the model (~1 GB) from Hugging Face, then caches it.
When ready you'll see:

```
[walkbuddy-ai] loading Qwen/Qwen2.5-0.5B-Instruct on mps (torch.float16) …
[walkbuddy-ai] ready in 3.2s
[walkbuddy-ai] serving on http://0.0.0.0:8000  (device=mps)
```

Quick test:

```bash
curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/rephrase \
  -H 'Content-Type: application/json' \
  -d '{"text":"nice park walk with trees and a lake"}'
```

## Point the web app at it

The app defaults to `http://localhost:8000`, so if you run both on the same
machine it just works.

To use a teammate's laptop as the shared model host, set this in the web app's
`.env.local` (use that laptop's LAN IP) and restart `npm run dev`:

```
VITE_AI_SERVER_URL="http://192.168.1.42:8000"
```

The server binds `0.0.0.0` so it's reachable on the LAN. Both machines must be
on the same network.

## Config (env vars, all optional)

| Var | Default | Notes |
|-----|---------|-------|
| `AI_MODEL` | `Qwen/Qwen2.5-0.5B-Instruct` | Any HF causal-LM chat model |
| `AI_DEVICE` | auto | Force `cuda` / `mps` / `cpu` |
| `AI_HOST` | `0.0.0.0` | |
| `AI_PORT` | `8000` | |
| `AI_ALLOW_ORIGINS` | `*` | Comma-separated CORS origins |

## Notes

- This is a **dev/local** tool. It is intentionally not part of the Vercel
  deploy — the web app degrades gracefully (the button just shows a "can't
  reach the AI server" message) when the server isn't running.
- `.venv/` and the model cache are gitignored.
