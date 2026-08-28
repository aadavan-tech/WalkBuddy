"""
WalkBuddy — local AI rephrase server.

Runs a small (~0.5B) instruction-tuned decoder model on ONE machine (a
teammate's laptop), not a hosted cloud server. The WalkBuddy web app calls
POST /rephrase to polish a trail description; the user then accepts or
rejects the suggestion in the UI.

Device is chosen automatically: CUDA (NVIDIA) -> MPS (Apple Silicon) -> CPU.
Override with AI_DEVICE=cuda|mps|cpu.

Run:
    cd ai-server
    python3.13 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python server.py

Config (all optional, via env):
    AI_MODEL   default "Qwen/Qwen2.5-0.5B-Instruct"
    AI_HOST    default "0.0.0.0"  (0.0.0.0 lets LAN teammates reach it)
    AI_PORT    default "8000"
    AI_DEVICE  force a device instead of auto-detect
    AI_ALLOW_ORIGINS  comma-separated CORS origins (default "*")
"""

import os
import re
import time
from collections import defaultdict
from threading import Lock

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = os.environ.get("AI_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
HOST = os.environ.get("AI_HOST", "0.0.0.0")
PORT = int(os.environ.get("AI_PORT", "8000"))

# CORS: require explicit origins in production (no wildcards)
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
ALLOW_ORIGINS = os.environ.get("AI_ALLOW_ORIGINS", "*").split(",")

if ENVIRONMENT == "production" and "*" in ALLOW_ORIGINS:
    raise ValueError(
        "AI_ALLOW_ORIGINS must be explicitly set in production (no wildcards). "
        "Example: AI_ALLOW_ORIGINS=https://walkbuddy.app,https://staging.walkbuddy.app,http://localhost:3000"
    )

# ---- Rate limiting for AI rephrase endpoint (SECURITY_AUDIT.md) ----
# Simple in-memory token bucket (per IP). For production, use Redis-backed limiter.
REPHRASE_RATE_LIMIT = 30  # requests
REPHRASE_WINDOW_SEC = 60  # 1 minute
_rate_limit_buckets: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))
_rate_limit_lock = Lock()


def rate_limit_rephrase(ip: str) -> bool:
    """Token bucket rate limiter. Returns True if allowed, False if rate limited."""
    now = time.time()
    with _rate_limit_lock:
        count, reset_at = _rate_limit_buckets[ip]
        if now > reset_at:
            _rate_limit_buckets[ip] = (1, now + REPHRASE_WINDOW_SEC)
            return True
        if count >= REPHRASE_RATE_LIMIT:
            return False
        _rate_limit_buckets[ip] = (count + 1, reset_at)
        return True


# ---- Prompt-injection hardening (SECURITY_AUDIT.md critical finding) ----

ALLOWED_STYLES = {
    "more energetic",
    "more concise",
    "shorter",
    "more descriptive",
    "friendlier",
    "more professional",
    "more casual",
}

MAX_INPUT_LENGTH = 2000
MAX_STYLE_LENGTH = 100

# Regex patterns to strip common prompt-injection / jailbreak attempts
INJECTION_PATTERNS = [
    (re.compile(r"USER_INPUT_START|USER_INPUT_END", re.IGNORECASE), ""),
    (re.compile(r"ignore\s+all\s+(previous|prior|above)\s+instructions", re.IGNORECASE), "[filtered]"),
    (re.compile(r"system\s+prompt", re.IGNORECASE), "[filtered]"),
    (re.compile(r"developer\s+instructions", re.IGNORECASE), "[filtered]"),
    (re.compile(r"(reveal|leak|output|print|show)\b.{0,30}\b(api\s*key|secret|password|token)", re.IGNORECASE), "[filtered]"),
    (re.compile(r"environment\s+variables", re.IGNORECASE), "[filtered]"),
    (re.compile(r"<\|"), ""),  # Strip special token syntax (e.g. ）
]


def sanitize_prompt_input(input_text: str, max_len: int = MAX_INPUT_LENGTH) -> str:
    """Strip common prompt-injection / jailbreak patterns from untrusted user text."""
    sanitized = input_text
    for pattern, replacement in INJECTION_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    return sanitized[:max_len]


def safe_style(style: str | None) -> str:
    """Restrict freeform style hint to an allowlist; return empty string if not allowed."""
    if not isinstance(style, str):
        return ""
    normalized = style.strip().lower()[:MAX_STYLE_LENGTH]
    return normalized if normalized in ALLOWED_STYLES else ""


def pick_device() -> str:
    """CUDA -> MPS -> CPU, unless AI_DEVICE forces one."""
    forced = os.environ.get("AI_DEVICE")
    if forced:
        return forced
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


DEVICE = pick_device()
# fp16 on GPU/MPS is faster and lighter; CPU stays in fp32 for stability.
DTYPE = torch.float16 if DEVICE in ("cuda", "mps") else torch.float32

print(f"[walkbuddy-ai] loading {MODEL_NAME} on {DEVICE} ({DTYPE}) …")
_t0 = time.time()
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=DTYPE)
model.to(DEVICE)
model.eval()
print(f"[walkbuddy-ai] ready in {time.time() - _t0:.1f}s")

SYSTEM_PROMPT = (
    "You rewrite short trail/route descriptions for a walking & running social "
    "app. Rephrase the user's text so it is clear, vivid and engaging, keeping "
    "the same facts and roughly the same length. Reply with ONLY the rewritten "
    "description — no preamble, no quotes, no options."
)

app = FastAPI(title="WalkBuddy AI Rephrase")

# ---- Security headers (SECURITY_AUDIT.md) ----
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # HSTS (only in production over HTTPS)
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # CSP
    response.headers["Content-Security-Policy"] = "; ".join([
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
    ])
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RephraseRequest(BaseModel):
    text: str
    # Optional freeform style hint, e.g. "more energetic", "shorter".
    style: str | None = None


class RephraseResponse(BaseModel):
    rephrased: str
    device: str
    model: str
    took_ms: int


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "model": MODEL_NAME,
        "cuda": torch.cuda.is_available(),
        "mps": getattr(torch.backends, "mps", None) is not None
        and torch.backends.mps.is_available(),
    }


@torch.inference_mode()
def generate(text: str, style: str | None) -> str:
    """Generate a rephrased version of the input text using the local model.

    Uses explicit delimiters to isolate user input from instructions,
    mitigating prompt injection.
    """
    safe_style_hint = safe_style(style)
    sanitized_text = sanitize_prompt_input(text)

    # Build prompt with explicit delimiters to isolate user content
    prompt_parts = [
        SYSTEM_PROMPT,
        "",
        f"Task: Rephrase the user's trail description so it is clear, vivid and engaging, "
        f"keeping the same facts and roughly the same length"
        f"{f' ({safe_style_hint})' if safe_style_hint else ''}.",
        "",
        "USER_INPUT_START",
        sanitized_text,
        "USER_INPUT_END",
        "",
        "Rules: Reply with ONLY the rewritten description — no preamble, no quotes, no options.",
    ]
    instruction = "\n".join(prompt_parts)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": instruction},
    ]
    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
    output = model.generate(
        **inputs,
        max_new_tokens=200,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        pad_token_id=tokenizer.eos_token_id,
    )
    # Only decode the newly generated tokens, not the prompt.
    new_tokens = output[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


@app.post("/rephrase", response_model=RephraseResponse)
def rephrase(req: RephraseRequest, request: Request):
    # Rate limit per IP
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limit_rephrase(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many requests. Please wait a moment before trying again.",
                "retry_after_seconds": REPHRASE_WINDOW_SEC,
            },
        )

    # Sanitize and validate inputs before processing
    raw_text = (req.text or "").strip()
    sanitized_text = sanitize_prompt_input(raw_text)

    if not sanitized_text:
        return RephraseResponse(
            rephrased="", device=DEVICE, model=MODEL_NAME, took_ms=0
        )

    t0 = time.time()
    # Pass original style (will be sanitized in generate())
    result = generate(sanitized_text, req.style)
    return RephraseResponse(
        rephrased=result or sanitized_text,
        device=DEVICE,
        model=MODEL_NAME,
        took_ms=int((time.time() - t0) * 1000),
    )


if __name__ == "__main__":
    print(f"[walkbuddy-ai] serving on http://{HOST}:{PORT}  (device={DEVICE})")
    uvicorn.run(app, host=HOST, port=PORT)
