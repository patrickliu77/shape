"""Pre-translate every English UI/textbook string into all supported
languages, then bundle the result as a JSON file the frontend hydrates on
load. This makes language switches feel instant — no waiting on Claude or
even on a /translate round-trip — because the frontend already has the
target-language string in memory.

Run from repo root after setting ANTHROPIC_API_KEY in backend/.env:

    python scripts/preload_translations.py

Outputs:
    frontend/src/preloaded-translations.json   (~120 strings × 6 languages)

Re-run whenever you add new visible English strings to a component or to
theorems-data.ts / Textbook.tsx. Existing translations are reused from the
backend disk cache, so it's incremental.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "backend" / ".env")

from clients import translate  # noqa: E402

LANGS = ["ar", "hi", "zh", "fr", "kk", "ja"]

# ── Hand-maintained UI labels ───────────────────────────────────────────────
# Mirror every STR table value across the components. Keep in sync when you
# add a new visible string to a component.
UI_LABELS = [
    # CinematicView
    "▶ Play with narration",
    "■ Stop",
    "Animation not rendered yet.",
    "Run python scripts/build_cache.py to generate it.",
    "Loading narration…",
    "Volume",
    "Mute",
    "Unmute",
    "✨ Generate visualization",
    "Tap to generate a Manim animation for this theorem.",
    "Generating visualization…",
    # InlineVideoGate
    "✨ Show me",
    "Tap to render the visualization for this step.",
    # InteractiveView
    "▶ Play explanation",
    "Describe current",
    # Surface3DView
    "↻ Reset view",
    "Drag to rotate · scroll to zoom",
    # GlobalChat
    "Ask any math question…",
    "Ask",
    "Ask shape",
    "I can answer math questions and point you to the right textbook visualization.",
    "▶ Open visualization",
    "Close",
    "Thinking…",
    "Sorry — couldn't reach the AI right now.",
    "Step-by-step",
    "Play narration",
    "Stop",
    "Try:",
    "Why does the chain rule multiply derivatives?",
    "What's the derivative of e^(x²)?",
    "Why is ∫e^(-x²)dx equal to √π?",
    # ExplainPanel STR
    "Interactive",
    "Animated",
    "Transcript",
    "Ask about this theorem",
    "Why does this work?",
    "Send",
    "thinking…",
    "(Backend not reachable. Start the FastAPI server with `uvicorn main:app` in the backend/ folder.)",
    "Tap any theorem in the textbook to explore it.",
    # ExplainPanel MODE_LABEL_EN
    "3D Interactive",
    "Animated · Interactive",
    "Animated · 3D",
    "Interactive · 3D",
    "Animated · Interactive · 3D",
    # TheoremBlock BADGE_EN
    "Animated · simpler explanation",
    "Interactive · simpler explanation",
    "3D Interactive · simpler explanation",
    "Animated · Interactive · simpler explanation",
    "Animated · 3D · simpler explanation",
    "Interactive · 3D · simpler explanation",
    "Animated · Interactive · 3D · simpler explanation",
    # FormalDefinition kinds
    "Definition",
    "Theorem",
    "Proposition",
    "Corollary",
    "Lemma",
    # Textbook chrome
    "Chapter",
]


def _unescape_ts_string(s: str) -> str:
    """Turn a TypeScript source-string literal into its runtime value.

    Handles \\n, \\\\, \\\", and the common LaTeX-escape pattern \\\\lim → \\lim.
    """
    return (
        s.replace("\\\\", "\x00")  # placeholder so we don't double-process
        .replace('\\"', '"')
        .replace("\\'", "'")
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\x00", "\\")
    )


def _extract_string_values(path: Path, keys: list[str]) -> list[str]:
    """Regex-pull `key: "..."` literals out of a .ts/.tsx file.

    This is intentionally dumb but robust enough for our hand-authored data
    files where every string lives on a single source line (possibly long).
    """
    text = path.read_text(encoding="utf-8")
    found: list[str] = []
    seen: set[str] = set()
    for key in keys:
        # `key: "..."` — value is double-quoted; backslash escapes allowed.
        pattern = rf'\b{re.escape(key)}\s*:\s*"((?:[^"\\]|\\.)*)"'
        for m in re.finditer(pattern, text, re.DOTALL):
            value = _unescape_ts_string(m.group(1))
            if value and value not in seen:
                seen.add(value)
                found.append(value)
    return found


def main() -> int:
    print("[preload] gathering English strings…")

    theorem_strings = _extract_string_values(
        ROOT / "frontend" / "src" / "theorems-data.ts",
        keys=["title", "context"],
    )

    # Pull chapter / section text out of every book module — the original
    # calculus.ts plus geometry.ts and algebra.ts and any future additions.
    book_files = [
        ROOT / "frontend" / "src" / "components" / "Textbook.tsx",  # legacy
        ROOT / "frontend" / "src" / "books" / "calculus.ts",
        ROOT / "frontend" / "src" / "books" / "geometry.ts",
        ROOT / "frontend" / "src" / "books" / "algebra.ts",
    ]
    textbook_strings: list[str] = []
    for path in book_files:
        if not path.exists():
            continue
        textbook_strings.extend(
            _extract_string_values(
                path,
                keys=["title", "blurb", "heading", "body", "name", "intro", "context"],
            )
        )

    all_strings: list[str] = []
    seen: set[str] = set()
    for s in [*UI_LABELS, *theorem_strings, *textbook_strings]:
        if s and s not in seen:
            seen.add(s)
            all_strings.append(s)

    print(
        f"[preload] {len(all_strings)} unique strings × {len(LANGS)} languages "
        f"= {len(all_strings) * len(LANGS)} translations"
    )

    out_path = ROOT / "frontend" / "src" / "preloaded-translations.json"

    # Start from whatever is already on disk so a partial run survives — if
    # we crash on lang N, langs 1..N-1 stay bundled and the user still
    # benefits from instant switches into them.
    bundle: dict[str, dict[str, str]] = {}
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8"))
            if isinstance(existing, dict):
                bundle = {k: v for k, v in existing.items() if isinstance(v, dict)}
        except Exception:  # noqa: BLE001
            pass

    for lang in LANGS:
        print(f"[preload] {lang}: translating…", flush=True)
        translated = translate.translate_batch(all_strings, lang)
        # Map English source → translated. Drop entries that came back
        # identical (heuristic skipped them) so the JSON only carries useful
        # delta. The frontend falls back to English when a key is missing.
        per_lang: dict[str, str] = {}
        for src, dst in zip(all_strings, translated):
            if dst and dst != src:
                per_lang[src] = dst
        bundle[lang] = per_lang
        print(f"[preload] {lang}: {len(per_lang)}/{len(all_strings)} cached", flush=True)
        # Persist after every language so a Ctrl-C or crash doesn't wipe
        # the work we already did. The frontend imports this file directly
        # so Vite HMR will pick up the new translations on the next render.
        out_path.write_text(
            json.dumps(bundle, ensure_ascii=False, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        print(f"[preload] wrote {out_path.relative_to(ROOT)} ({len(bundle)} langs so far)", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
