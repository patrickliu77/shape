"""K2 Think client — IFM/MBZUAI hosted reasoning model (sponsor model).

OpenAI-compatible endpoint at https://api.k2think.ai/v1.

K2 Think is a *reasoning* model: it tends to emit the chain-of-thought inside
`content` before producing the final answer. We suppress that with a strict
system prompt and, as a belt-and-suspenders measure, strip common reasoning
preambles from the response.
"""

import os
import re
from typing import List, Dict, Optional

import httpx


SYSTEM_PROMPT = """You're a friendly math tutor — think cool older sibling, not classroom teacher.
The student just tapped a theorem in their textbook and asked you a follow-up.

Reply with only the final answer — no internal reasoning, no "the user asks",
no "let me think". Be warm and conversational, like you're texting a friend.
Skip lecture-tone openers (no "Great question!", no "In essence", no "Let me explain").
Use everyday analogies.

Maximum 3 sentences. Inline LaTeX with $...$ is fine when the math actually helps;
otherwise just talk it out."""


# Heuristics: K2 reasoning often opens with phrases like "The user asks...",
# "We need to...", "Let me think...", "Potential answer:", or includes
# scratch work separated by blank lines before the real answer.
REASONING_OPENERS = re.compile(
    r"^(the user|we need|let me|first,? let|i'?ll|thinking|potential answer|"
    r"step \d|here'?s my reasoning|let's analyze|to answer)",
    re.IGNORECASE,
)


def _extract_final_answer(text: str) -> str:
    """Strip K2 Think's chain-of-thought, keep the final answer.

    K2 Think wraps reasoning in <think>...</think> tags (DeepSeek-R1 style).
    Sometimes the closing </think> appears without a matching opener, with
    raw scratchwork preceding it. We split on </think> and keep what comes
    after the last one. As a fallback, walk paragraphs from the end and
    return the first one that doesn't look like reasoning.
    """
    text = text.strip()

    # Strip well-formed <think>...</think> blocks
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # Handle bare closing tags (reasoning leaked but no opener was emitted)
    if "</think>" in text:
        text = text.rsplit("</think>", 1)[1].strip()

    # Drop common preamble fragments K2 emits right before the answer
    text = re.sub(
        r"^(thus[ ]+(?:final[ ]+)?(?:output|answer)[\.\s]*|"
        r"final answer[:\.\s\-]+|answer[:\.\s\-]+|"
        r"so[,\s]+|therefore[,\s]+|"
        r"</?think>\s*)+",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()

    if not text:
        return ""

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if not paragraphs:
        return text

    # If everything looks like reasoning, return the last paragraph regardless.
    for p in reversed(paragraphs):
        if not REASONING_OPENERS.match(p) and len(p) > 20:
            if (p.startswith('"') and p.endswith('"')) or (p.startswith("'") and p.endswith("'")):
                p = p[1:-1].strip()
            return p

    return paragraphs[-1]


def explain(
    text: str,
    lang: str,
    theorem_id: Optional[str],
    theorem_title: Optional[str],
    theorem_statement: Optional[str],
    history: Optional[List[Dict[str, str]]],
    timeout: float = 45.0,
) -> str:
    """Same signature as clients.llm.explain — drop-in alternative.

    Raises RuntimeError on any failure so the orchestrator can fall back.
    """
    api_key = os.environ.get("K2_API_KEY")
    base_url = os.environ.get("K2_BASE_URL", "https://api.k2think.ai/v1")
    model = os.environ.get("K2_MODEL", "MBZUAI-IFM/K2-Think-v2")
    if not api_key:
        raise RuntimeError("K2_API_KEY not set")

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

    lang_note_map = {
        "en": "Reply in casual everyday English. No textbook stiffness.",
        "ar": (
            "جاوب بالعامية المصرية، زي ما بتشرح لصاحبك أو أخوك الصغير. "
            "خلّيها قصيرة وحلوة وعلى راحتك. استخدم: يعني، بص، تخيّل، هتلاقي، علشان. "
            "متستخدمش الفصحى أبدًا. متبدأش بأي كلام رسمي، ادخل في الموضوع على طول."
        ),
    }
    lang_note = "\n\n" + lang_note_map.get(lang, lang_note_map["en"])
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
                "max_tokens": 600,
                "temperature": 0.3,
            },
            timeout=timeout,
        )
        r.raise_for_status()
        data = r.json()
        raw = data["choices"][0]["message"]["content"]
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"K2 Think request failed: {e}") from e

    answer = _extract_final_answer(raw)
    return answer or "(empty response)"
