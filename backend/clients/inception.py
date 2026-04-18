"""Inception Labs (G42 / IFM commercial arm) client — Jais + Nile-Chat + Sherkala.

OpenAI-compatible endpoint at https://api.inceptionlabs.ai. Activates only when
INCEPTION_API_KEY is set. Without it, callers get RuntimeError so they can fall
back to Claude.

Models:
  ar (Egyptian dialectal) → MBZUAI-Paris/Nile-Chat-4B
  kk (Kazakh)             → inceptionai/Llama-3.1-Sherkala-8B-Chat
  ar (MSA, future)        → inceptionai/jais-30b-v3

To get a key: docs.inceptionlabs.ai → request access (1-3 day approval).
"""

import os
import re
from typing import List, Dict, Optional

import httpx

DEFAULT_BASE_URL = "https://api.inceptionlabs.ai/v1"

MODEL_BY_LANG = {
    # Egyptian Arabic — Nile-Chat-4B is dialectal (handles Arabic script and Arabizi)
    "ar": "MBZUAI-Paris/Nile-Chat-4B",
}

# If you want MSA-style Arabic answers, swap ar → "inceptionai/jais-30b-v3"
JAIS_MSA_MODEL = "inceptionai/jais-30b-v3"


SYSTEM_PROMPT = """You are a patient, clear math tutor helping a K-12 student understand calculus.

You are embedded in an interactive textbook. The student has just tapped a specific theorem
and is asking a follow-up. Reply with only the final answer — no internal reasoning,
no preface. Maximum 3 sentences. Plain language with geometric or physical intuition.
Inline LaTeX with $...$ is fine for math notation."""

LANG_INSTRUCTION = {
    "ar": (
        "جاوب بالعامية المصرية، زي ما بتشرح لصاحبك. خلّيها قصيرة، حلوة، "
        "وعلى راحتك. متستخدمش الفصحى أبدًا."
    ),
}


def is_available() -> bool:
    return bool(os.environ.get("INCEPTION_API_KEY"))


def explain(
    text: str,
    lang: str,
    theorem_id: Optional[str],
    theorem_title: Optional[str],
    theorem_statement: Optional[str],
    history: Optional[List[Dict[str, str]]],
    timeout: float = 45.0,
) -> str:
    api_key = os.environ.get("INCEPTION_API_KEY")
    base_url = os.environ.get("INCEPTION_BASE_URL", DEFAULT_BASE_URL)
    if not api_key:
        raise RuntimeError("INCEPTION_API_KEY not set")

    model = MODEL_BY_LANG.get(lang)
    if not model:
        raise RuntimeError(f"no Inception model mapped for lang={lang}")

    context_lines = []
    if theorem_title:
        context_lines.append(f"Theorem: {theorem_title}")
    if theorem_statement:
        context_lines.append(f"Statement (LaTeX): {theorem_statement}")
    if theorem_id and not theorem_title:
        context_lines.append(f"Theorem id: {theorem_id}")
    context_block = (
        "\n\n--- Current theorem ---\n" + "\n".join(context_lines) if context_lines else ""
    )

    lang_note = "\n\n" + LANG_INSTRUCTION.get(lang, "")
    system = SYSTEM_PROMPT + context_block + lang_note

    messages: List[Dict[str, str]] = [{"role": "system", "content": system}]
    for m in (history or [])[:-1]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": text})

    try:
        r = httpx.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.4,
            },
            timeout=timeout,
        )
        r.raise_for_status()
        data = r.json()
        raw = data["choices"][0]["message"]["content"].strip()
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Inception request failed: {e}") from e

    # Light cleanup — Sherkala/Nile-Chat sometimes wrap answers in quotes
    raw = re.sub(r"^['\"]+|['\"]+$", "", raw).strip()
    return raw or "(empty response)"
