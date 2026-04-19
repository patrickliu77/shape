"""Single language filter: English in, target-language out.

Everything in the product is authored in English. When the student picks a
non-English language, prose flows through this module: math expressions are
masked out so Claude can't damage them, the masked prose is translated, and
the original math is spliced back in.

Used by:
- /tts                       — translate transcripts before Azure synthesizes them
- /translate                 — frontend's batched UI-string translator
- /ask                       — translate chat answers + step-by-step into the
                               student's language

Cached on disk per (text, lang) so repeat plays cost zero LLM tokens.
"""

from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path

CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache" / "translations"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

LANG_NAMES = {
    "en": "English",
    "ar": "Egyptian colloquial Arabic",
    "hi": "Hindi (Devanagari script)",
    "zh": "Simplified Chinese",
    "fr": "French",
    "kk": "Kazakh (Cyrillic script)",
    "ja": "Japanese (mix of Kanji, Hiragana, and Katakana as natural)",
}

# ── Math masking ────────────────────────────────────────────────────────────
# Trusting Claude to "preserve LaTeX" was unreliable: it would re-escape
# backslashes, drop $-delimiters, or paraphrase variable names. Instead we
# strip every math fragment out before translation, replace it with an opaque
# XML-like sentinel, and splice the original back in afterwards. XML tags are
# the format Claude is most reliable at preserving verbatim.
_MATH_RE = re.compile(
    r"(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]*?\\\))"
)

# Permissive matcher: accepts the canonical `<m0/>` form Claude SHOULD return,
# plus the common corruptions we've seen in the wild — surrounding markdown
# bold (`**<m0/>**`), CJK / square brackets (`【m0】`, `[m0]`), markdown bold
# inside (`[**m0**]`), missing slash, extra spaces.
_SENTINEL_RE = re.compile(
    r"\*{0,2}"
    r"(?:<\s*\*{0,2}\s*m\s*(\d+)\s*\*{0,2}\s*/?\s*>"
    r"|[\[⟦【「]\s*\*{0,2}\s*m\s*(\d+)\s*\*{0,2}\s*[\]⟧】」])"
    r"\*{0,2}",
    re.IGNORECASE,
)


def _mask_math(text: str) -> tuple[str, list[str]]:
    fragments: list[str] = []

    def sub(m: re.Match[str]) -> str:
        fragments.append(m.group(0))
        return f"<m{len(fragments) - 1}/>"

    return _MATH_RE.sub(sub, text), fragments


def _restore_math(text: str, fragments: list[str]) -> str:
    def sub(m: re.Match[str]) -> str:
        idx_str = m.group(1) or m.group(2)
        idx = int(idx_str)
        return fragments[idx] if 0 <= idx < len(fragments) else m.group(0)

    return _SENTINEL_RE.sub(sub, text)


# ── Heuristic: skip translation if the text already looks like the target ──

def _looks_like(text: str, target_lang: str) -> bool:
    non_ascii = sum(1 for c in text if ord(c) > 127)
    if not text:
        return True
    ratio = non_ascii / len(text)
    if target_lang in ("hi", "zh", "ar", "kk", "ja") and ratio > 0.3:
        return True
    if target_lang == "fr":
        if any(c in text for c in "àâçéèêëîïôûùüÿœæ"):
            return True
        lower = text.lower()
        if any(
            word in lower
            for word in (" le ", " la ", " les ", " un ", " une ", " est ", " et ", " que ")
        ):
            return True
    if target_lang == "en":
        return ratio < 0.05
    return False


def _cache_path(text: str, target_lang: str) -> Path:
    h = hashlib.sha256(f"{target_lang}:{text}".encode("utf-8")).hexdigest()[:24]
    return CACHE_DIR / f"{target_lang}_{h}.txt"


# ── Public API ──────────────────────────────────────────────────────────────

def translate(text: str, target_lang: str) -> str:
    """Return `text` translated into `target_lang`, cached on disk."""
    if target_lang == "en" or not text.strip():
        return text
    if _looks_like(text, target_lang):
        return text

    cache = _cache_path(text, target_lang)
    if cache.exists():
        try:
            return cache.read_text(encoding="utf-8")
        except Exception:  # noqa: BLE001
            pass

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return text

    masked, fragments = _mask_math(text)
    try:
        translated_masked = _claude_translate(masked, target_lang)
        if not translated_masked:
            return text
        out = _restore_math(translated_masked, fragments)
        try:
            cache.write_text(out, encoding="utf-8")
        except Exception:  # noqa: BLE001
            pass
        return out
    except Exception as e:  # noqa: BLE001
        print(f"[translate] {target_lang} fallback to English: {e}")
        return text


def _claude_translate(text: str, target_lang: str) -> str:
    """One Claude round-trip — text is already math-masked."""
    api_key = os.environ["ANTHROPIC_API_KEY"]
    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)
    target_name = LANG_NAMES.get(target_lang, target_lang)
    system = (
        f"You translate English into {target_name}. The input may contain "
        f"opaque XML tokens like <m0/>, <m1/>, <m2/> — these are placeholders "
        f"for math expressions and you MUST keep them EXACTLY in your "
        f"output, identical to how they appeared in the input: same casing, "
        f"same digits, same `<` and `/>` characters. Do NOT wrap them in "
        f"markdown, do NOT replace `<>` with `[]`, do NOT add extra "
        f"asterisks. Treat them as immutable code tokens. Translate only "
        f"the surrounding prose. Use a warm, patient, older-sibling "
        f"tutoring register suitable for a teenage student. Match the "
        f"length of the English source closely — do not pad, expand, or "
        f"add extra phrases; the result will be slotted into a tight UI "
        f"that mirrors the English layout. Reply with ONLY the translation "
        f"— no preamble, no quotation marks, no explanation, no markdown."
    )
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": text}],
        timeout=60.0,
    )
    return "".join(
        b.text for b in resp.content if getattr(b, "type", None) == "text"
    ).strip()


# ── Batched API ─────────────────────────────────────────────────────────────
# Coalesces many short UI strings into a single Claude call so switching
# language doesn't fire 30+ requests at once.
_BATCH_SEP = "\n[[~~SEP~~]]\n"


def translate_batch(texts: list[str], target_lang: str) -> list[str]:
    if target_lang == "en" or not texts:
        return list(texts)

    out: list[str | None] = [None] * len(texts)
    missing_idx: list[int] = []
    missing_text: list[str] = []
    missing_masked: list[str] = []
    missing_frags: list[list[str]] = []

    for i, t in enumerate(texts):
        if not t.strip() or _looks_like(t, target_lang):
            out[i] = t
            continue
        cache = _cache_path(t, target_lang)
        if cache.exists():
            try:
                out[i] = cache.read_text(encoding="utf-8")
                continue
            except Exception:  # noqa: BLE001
                pass
        masked, frags = _mask_math(t)
        missing_idx.append(i)
        missing_text.append(t)
        missing_masked.append(masked)
        missing_frags.append(frags)

    if missing_text:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            for i, t in zip(missing_idx, missing_text):
                out[i] = t
        else:
            try:
                joined = _BATCH_SEP.join(missing_masked)
                from anthropic import Anthropic

                client = Anthropic(api_key=api_key)
                target_name = LANG_NAMES.get(target_lang, target_lang)
                system = (
                    f"You translate English fragments into {target_name}. "
                    f"You will receive several independent fragments separated "
                    f"EXACTLY by the line `[[~~SEP~~]]`. Translate each "
                    f"fragment and emit them back in the same order with the "
                    f"same `[[~~SEP~~]]` separator. No preamble, no quotes, "
                    f"no extra text, no markdown. Opaque XML tokens like "
                    f"<m0/>, <m1/> are math placeholders — preserve them "
                    f"EXACTLY, identical characters, no wrapping in markdown "
                    f"or bracket changes. Match the length of each English "
                    f"source closely — do not pad or expand; the results "
                    f"slot into a tight UI that mirrors the English layout. "
                    f"Use a warm, patient older-sibling tutoring register."
                )
                resp = client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=4000,
                    system=system,
                    messages=[{"role": "user", "content": joined}],
                    timeout=90.0,
                )
                raw = "".join(
                    b.text
                    for b in resp.content
                    if getattr(b, "type", None) == "text"
                ).strip()
                parts = [p.strip() for p in raw.split("[[~~SEP~~]]")]
                if len(parts) != len(missing_masked):
                    # Claude fragmented differently — fall back per item.
                    for i, t, frags in zip(
                        missing_idx, missing_text, missing_frags
                    ):
                        try:
                            out[i] = translate(t, target_lang)
                        except Exception:  # noqa: BLE001
                            out[i] = t
                else:
                    for i, t, frags, tr in zip(
                        missing_idx, missing_text, missing_frags, parts
                    ):
                        restored = _restore_math(tr or "", frags) or t
                        out[i] = restored
                        try:
                            _cache_path(t, target_lang).write_text(
                                restored, encoding="utf-8"
                            )
                        except Exception:  # noqa: BLE001
                            pass
            except Exception as e:  # noqa: BLE001
                print(
                    f"[translate_batch] {target_lang} batched call failed "
                    f"({e}); falling back to per-item translate()."
                )
                # Per-item fallback — slower but more robust to long inputs
                # or low-resource languages where Claude fragments unevenly.
                for i, t in zip(missing_idx, missing_text):
                    try:
                        out[i] = translate(t, target_lang)
                    except Exception:  # noqa: BLE001
                        out[i] = t

    return [o or "" for o in out]
