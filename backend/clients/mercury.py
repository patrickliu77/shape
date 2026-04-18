"""Inception Labs Mercury client — diffusion LLM, OpenAI-compatible.

This is *Inception Labs* (the diffusion-LLM startup, inceptionlabs.ai), NOT
'Inception by G42' which ships Jais/Sherkala/Nile-Chat. Confusingly similar
names, totally different companies.

Mercury is fast, mathematically literate, and uses `\\(...\\)` style LaTeX in
output (the frontend MathText component handles both that and `$...$`).

Wired as a fallback after K2 Think for English — Mercury is faster than
Claude and produces clean math, so it's a better mid-tier fallback than
going straight to Claude on K2 hiccups.
"""

import os
from typing import List, Dict, Optional

import httpx

DEFAULT_BASE_URL = "https://api.inceptionlabs.ai/v1"
DEFAULT_MODEL = "mercury-2"
ENV_KEY = "MERCURY_API_KEY"

SYSTEM_PROMPT = """You're a friendly math tutor — think cool older sibling, not classroom teacher.
The student just tapped a theorem in their textbook and asked you a follow-up.

Reply with only the final answer — no internal reasoning, no preface. Be warm and
conversational, like you're texting a friend. Skip lecture-tone openers (no "Great
question!", no "Let me explain"). Use everyday analogies.

Maximum 3 sentences. Inline LaTeX with $...$ when math truly helps; otherwise just
talk it out."""

LANG_INSTRUCTION = {
    "en": "Reply in casual everyday English. No textbook stiffness.",
    "ar": (
        "جاوب بالعامية المصرية، زي ما بتشرح لصاحبك. خلّيها قصيرة، حلوة، "
        "وعلى راحتك. استخدم: يعني، بص، تخيّل، هتلاقي. متستخدمش الفصحى أبدًا، "
        "ومتبدأش بأي كلام رسمي."
    ),
}


def is_available() -> bool:
    return bool(os.environ.get(ENV_KEY))


def explain(
    text: str,
    lang: str,
    theorem_id: Optional[str],
    theorem_title: Optional[str],
    theorem_statement: Optional[str],
    history: Optional[List[Dict[str, str]]],
    timeout: float = 30.0,
) -> str:
    api_key = os.environ.get(ENV_KEY)
    base_url = os.environ.get("MERCURY_BASE_URL", DEFAULT_BASE_URL)
    model = os.environ.get("MERCURY_MODEL", DEFAULT_MODEL)
    if not api_key:
        raise RuntimeError("MERCURY_API_KEY not set")

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

    lang_note = "\n\n" + LANG_INSTRUCTION.get(lang, LANG_INSTRUCTION["en"])
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
                "temperature": 0.3,
            },
            timeout=timeout,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip() or "(empty response)"
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Mercury request failed: {e}") from e
