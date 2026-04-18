"""Sparkle backend — FastAPI app.

Routes:
- GET  /health           — liveness
- POST /explain          — LLM-driven tutor answer for a chat follow-up
- POST /tts              — synthesize speech for a text+lang, returns cached MP3 URL
- GET  /theorem/{id}     — metadata + cached asset URLs for a theorem (stub)

The frontend lives at localhost:5173 (Vite) and proxies /api/* here. Run:

    uvicorn main:app --reload --port 8000
"""

import hashlib
import os
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

load_dotenv()

from clients import ask as ask_client, inception, k2, llm, mercury, prewarm, tts  # noqa: E402

app = FastAPI(title="Sparkle")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "cache"
AUDIO_CACHE = CACHE / "audio"
AUDIO_CACHE.mkdir(parents=True, exist_ok=True)
app.mount("/cache", StaticFiles(directory=CACHE), name="cache")

Lang = Literal["en", "ar"]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ExplainRequest(BaseModel):
    theorem_id: Optional[str] = None
    theorem_title: Optional[str] = None
    theorem_statement: Optional[str] = None
    text: str
    lang: Lang = "en"
    history: Optional[List[ChatMessage]] = None


class ExplainResponse(BaseModel):
    answer: str
    model: str  # k2-think | mercury | nile-chat | sherkala | claude | stub


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    lang: Lang = "en"


class StepItem(BaseModel):
    title: str
    body: str


class AskRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    lang: Lang = "en"
    history: Optional[List[ChatMessage]] = None


class AskResponse(BaseModel):
    answer: str
    steps: List[StepItem]
    suggested_theorem_id: Optional[str] = None
    video_url: Optional[str] = None
    video_at_step: Optional[int] = None
    model: str


class TTSResponse(BaseModel):
    url: str
    cached: bool


@app.get("/health")
def health():
    has_claude = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return {
        "ok": True,
        "en_chain": (
            ([("k2-think") if os.environ.get("K2_API_KEY") else None]
             + [("mercury") if mercury.is_available() else None]
             + [("claude") if has_claude else None])
        ),
        "ar_llm": (
            "nile-chat" if inception.is_available()  # only if real IFM-Inception key
            else "claude" if has_claude else "stub"
        ),
        "tts": tts.backend_name(),  # "azure" or "edge-tts"
    }


@app.post("/explain", response_model=ExplainResponse)
def explain(req: ExplainRequest):
    # Hand-curated demo answers short-circuit the LLM when a question matches.
    # Falls through to the live model on any miss.
    canned = prewarm.lookup(req.theorem_id, req.lang, req.text)
    if canned:
        return ExplainResponse(answer=canned, model="k2-think")

    history = [m.model_dump() for m in (req.history or [])]

    # Routing:
    #   en → K2 Think (IFM/MBZUAI sponsor) → Claude
    #   ar → Nile-Chat (MBZUAI-Paris, Egyptian dialectal) → Claude
    #   kk → Sherkala (Inception/MBZUAI/Cerebras) → Claude
    # Inception models activate only when INCEPTION_API_KEY is present;
    # otherwise everything cleanly falls through to Claude.
    if req.lang == "en" and os.environ.get("K2_API_KEY"):
        try:
            answer = k2.explain(
                text=req.text,
                lang=req.lang,
                theorem_id=req.theorem_id,
                theorem_title=req.theorem_title,
                theorem_statement=req.theorem_statement,
                history=history,
            )
            return ExplainResponse(answer=answer, model="k2-think")
        except Exception as e:  # noqa: BLE001
            print(f"[k2->mercury fallback] {e}")

    # Mercury (Inception Labs diffusion LLM) — sits between K2 and Claude.
    # Faster than Claude, clean math output. Only English.
    if req.lang == "en" and mercury.is_available():
        try:
            answer = mercury.explain(
                text=req.text,
                lang=req.lang,
                theorem_id=req.theorem_id,
                theorem_title=req.theorem_title,
                theorem_statement=req.theorem_statement,
                history=history,
            )
            return ExplainResponse(answer=answer, model="mercury")
        except Exception as e:  # noqa: BLE001
            print(f"[mercury->claude fallback] {e}")

    if req.lang == "ar" and inception.is_available():
        try:
            answer = inception.explain(
                text=req.text,
                lang=req.lang,
                theorem_id=req.theorem_id,
                theorem_title=req.theorem_title,
                theorem_statement=req.theorem_statement,
                history=history,
            )
            return ExplainResponse(answer=answer, model="nile-chat")
        except Exception as e:  # noqa: BLE001
            print(f"[inception->claude fallback] {e}")

    answer = llm.explain(
        text=req.text,
        lang=req.lang,
        theorem_id=req.theorem_id,
        theorem_title=req.theorem_title,
        theorem_statement=req.theorem_statement,
        history=history,
    )
    model = "claude" if os.environ.get("ANTHROPIC_API_KEY") else "stub"
    return ExplainResponse(answer=answer, model=model)


def _tts_cache_path(text: str, lang: str) -> Path:
    h = hashlib.sha256(f"{lang}:{text}".encode("utf-8")).hexdigest()[:24]
    return AUDIO_CACHE / f"tts_{lang}_{h}.mp3"


@app.post("/tts", response_model=TTSResponse)
def synthesize(req: TTSRequest):
    out = _tts_cache_path(req.text, req.lang)
    cached = out.exists() and out.stat().st_size > 0
    if not cached:
        try:
            tts.synthesize(req.text, req.lang, out)
        except tts.TTSUnavailable as e:
            raise HTTPException(status_code=503, detail=str(e))
    # Append the file's mtime as a cache-buster so the browser fetches the
    # current bytes after we re-render the audio (e.g. SSML/voice change).
    # Same on-disk path = same Azure cost; only the URL fingerprint changes.
    version = int(out.stat().st_mtime)
    rel_url = f"/cache/audio/{out.name}?v={version}"
    return TTSResponse(url=rel_url, cached=cached)


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    history = [m.model_dump() for m in (req.history or [])]
    result = ask_client.ask(text=req.text, lang=req.lang, history=history)
    return AskResponse(**result)


THEOREM_META = {
    "limit": {"title": "The ε–δ definition of a limit", "mode": "cinematic"},
    "derivative": {"title": "The derivative as the slope of the tangent", "mode": "cinematic"},
    "chain-rule": {"title": "The chain rule", "mode": "cinematic"},
    "exponential": {"title": "The exponential family y = e^{at}", "mode": "interactive"},
    "damped-oscillator": {"title": "Damped oscillation", "mode": "interactive"},
}


@app.get("/theorem/{theorem_id}")
def theorem(theorem_id: str):
    if theorem_id not in THEOREM_META:
        raise HTTPException(404, "unknown theorem")
    meta = THEOREM_META[theorem_id]
    if meta["mode"] == "cinematic":
        idx = {"limit": "01_limit", "derivative": "02_derivative", "chain-rule": "03_chain_rule"}[theorem_id]
        video = CACHE / "videos" / f"{idx}.mp4"
        audio = CACHE / "audio" / f"{idx}.en.mp3"
        return {
            "id": theorem_id,
            **meta,
            "video_url": f"/cache/videos/{idx}.mp4" if video.exists() else None,
            "audio_url": f"/cache/audio/{idx}.en.mp3" if audio.exists() else None,
        }
    return {"id": theorem_id, **meta}
