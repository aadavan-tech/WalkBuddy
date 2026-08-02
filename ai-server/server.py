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
import time

import torch
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = os.environ.get("AI_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
HOST = os.environ.get("AI_HOST", "0.0.0.0")
PORT = int(os.environ.get("AI_PORT", "8000"))
ALLOW_ORIGINS = os.environ.get("AI_ALLOW_ORIGINS", "*").split(",")


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
    instruction = f"Rewrite this trail description"
    if style:
        instruction += f" ({style})"
    instruction += f":\n\n{text}"

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
def rephrase(req: RephraseRequest):
    text = (req.text or "").strip()
    if not text:
        return RephraseResponse(
            rephrased="", device=DEVICE, model=MODEL_NAME, took_ms=0
        )
    t0 = time.time()
    result = generate(text, req.style)
    return RephraseResponse(
        rephrased=result or text,
        device=DEVICE,
        model=MODEL_NAME,
        took_ms=int((time.time() - t0) * 1000),
    )


if __name__ == "__main__":
    print(f"[walkbuddy-ai] serving on http://{HOST}:{PORT}  (device={DEVICE})")
    uvicorn.run(app, host=HOST, port=PORT)
