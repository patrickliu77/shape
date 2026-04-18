"""Tiny lookup table for hand-curated demo answers.

Reads backend/prewarm.json once at import. The /explain endpoint calls
`lookup(theorem_id, lang, text)`; if all keywords for any entry are present
(case-insensitive substring) in `text`, that entry's answer is returned.
Otherwise the live LLM (K2 Think → Claude fallback) handles it.
"""

import json
from pathlib import Path
from typing import Optional

_PATH = Path(__file__).resolve().parent.parent / "prewarm.json"

try:
    _DATA: dict = json.loads(_PATH.read_text(encoding="utf-8"))
except FileNotFoundError:
    _DATA = {}


def lookup(theorem_id: Optional[str], lang: str, text: str) -> Optional[str]:
    if not theorem_id:
        return None
    by_theorem = _DATA.get(theorem_id) or {}
    entries = by_theorem.get(lang) or []
    text_lc = text.lower()
    for entry in entries:
        keywords = [k.lower() for k in entry.get("all", [])]
        if keywords and all(k in text_lc for k in keywords):
            return entry["answer"]
    return None
