"""Turn an uploaded PDF into a structured shape-textbook.

Pipeline:
1. Extract text from the PDF with PyMuPDF.
2. Send the text to Claude with a strict JSON schema describing the
   shape of CHAPTERS used in `frontend/src/components/Textbook.tsx`.
3. Validate / shape the response so the frontend can splice it straight
   into its rendering loop without fixup.

The output schema mirrors the in-app structure:

    {
      "chapters": [
        {
          "number": 1,
          "title": "...",
          "blurb": "...",
          "sections": [
            {
              "heading": "1.1 ...",
              "formal":  { "kind": "Definition" | "Theorem" | ..., "name": "...", "body": "..." },
              "intro":   "...",
              "theorem": { "id": "...", "title": "...", "statement": "...", "context": "..." }
            }
          ]
        }
      ]
    }

Math should be in $...$ / $$...$$ form so MathText renders it correctly.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any


SYSTEM = """You convert raw textbook PDF text into a JSON outline that a structured viewer will render.

Reply with ONLY a JSON object matching this schema (no preamble, no markdown, no quoted code fence):

{
  "chapters": [
    {
      "number": 1,                         // sequential int starting at 1
      "title": "Short chapter title (3-6 words)",
      "blurb": "1-2 sentence chapter intro that motivates the material — warm tutoring register.",
      "sections": [
        {
          "heading": "1.1 Title of the section",
          "formal": {
            "kind": "Definition" | "Theorem" | "Proposition" | "Corollary" | "Lemma",
            "name": "Optional name in parentheses, e.g. 'Chain Rule'",   // omit if unnamed
            "body": "Verbatim formal statement copied from the textbook. Use $...$ for inline math and $$...$$ for display math."
          },
          "intro": "1-2 sentence friendly explanation of what this means in plain language — relocated INTO the tappable simpler-explanation box. Use $...$ for any math.",
          "theorem": {
            "id": "lowercase-hyphen-id-derived-from-title",
            "title": "The same theorem, restated in plain English suitable for a teenager",
            "statement": "The core LaTeX formula(s) for this result, NO surrounding $-delimiters — this goes through KaTeX BlockMath",
            "context": "1-2 sentence intuition for what's going on geometrically or computationally"
          }
        }
      ]
    }
  ]
}

Rules:
- Identify every distinct definition / theorem / lemma in the input. Group them into chapters that match the source's natural structure (chapters, sections, units).
- Do NOT invent material that isn't in the source. If a section has no formal statement, skip it.
- Section ids must be unique across the whole document.
- Math expressions must stay in LaTeX. Inline math uses single $...$; display math uses $$...$$.
- DO NOT use LaTeX document-layout macros — no \\begin{itemize}, no \\end{itemize}, no \\begin{enumerate}, no \\item, no \\section, no \\par. The frontend renders math via KaTeX, which does NOT understand these. If you have a list, write it as: "(a) first thing; (b) second thing; (c) third thing." Plain prose only.
- DO NOT use math-spacing commands (\\,, \\;, \\!, \\:) OUTSIDE of $...$ delimiters. Outside math, use a regular space.
- Keep `body`, `intro`, `title`, `context` to a single line each — no newlines inside the JSON string.
- Keep blurbs warm and approachable. Avoid stiff phrases like "this section will".
- If the document is short or only contains one definition, return one chapter with one section.
- Output VALID JSON only. No trailing commas, no comments, no extra prose.
"""


# ── Defensive sanitiser ────────────────────────────────────────────────────
# Even with explicit "do not emit" rules in the prompt, Claude occasionally
# leaves behind LaTeX environments / item directives — especially when the
# source PDF was a LaTeX-style textbook. Strip them post-hoc so KaTeX never
# sees `\begin{itemize}` etc.
_LIST_ENV_RE = re.compile(r"\\(?:begin|end)\{(?:itemize|enumerate|description|list)\}")
_ITEM_RE = re.compile(r"\\item\b\s*")
# Math-spacing commands outside math delimiters cause KaTeX-rendered blank
# boxes when the renderer tries to compose them as text.
_OUTSIDE_MATH_GLUE_RE = re.compile(r"\\[,;!:](?![A-Za-z])")
# Section/paragraph layout macros that have no place in our short prose.
_LAYOUT_RE = re.compile(r"\\(?:par|noindent|smallskip|medskip|bigskip|vspace\{[^}]*\}|hspace\{[^}]*\})\b\s*")


def _split_math_chunks(text: str) -> list[tuple[str, bool]]:
    """Walk through text returning (chunk, is_math) pairs.

    Math regions ($..$, $$..$$, \\(..\\), \\[..\\]) are passed through
    untouched so we can scrub the prose in between without damaging the
    formulas KaTeX will render.
    """
    pattern = re.compile(
        r"(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]*?\\\))"
    )
    out: list[tuple[str, bool]] = []
    last = 0
    for m in pattern.finditer(text):
        if m.start() > last:
            out.append((text[last : m.start()], False))
        out.append((m.group(0), True))
        last = m.end()
    if last < len(text):
        out.append((text[last:], False))
    return out


def _scrub_prose(prose: str) -> str:
    """Remove LaTeX layout macros from non-math text."""
    s = _LIST_ENV_RE.sub(" ", prose)
    s = _ITEM_RE.sub(" • ", s)
    s = _LAYOUT_RE.sub(" ", s)
    s = _OUTSIDE_MATH_GLUE_RE.sub(" ", s)
    # Collapse runs of whitespace that the substitutions left behind.
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\s+([,.;:])", r"\1", s)
    return s.strip()


def sanitize(text: str) -> str:
    """Public entry point: strip layout LaTeX from the prose between math."""
    if not text:
        return text
    parts = _split_math_chunks(text)
    cleaned: list[str] = []
    for chunk, is_math in parts:
        if is_math:
            cleaned.append(chunk)
        else:
            cleaned.append(_scrub_prose(chunk))
    out = "".join(cleaned)
    # If the cleanup left a leading bullet or stray separator, trim it.
    out = re.sub(r"^\s*•\s*", "", out).strip()
    return out


def extract_pdf_text(pdf_bytes: bytes, max_pages: int = 60) -> str:
    """Pull plaintext from a PDF, one page per chunk, capped at `max_pages`."""
    import fitz  # pymupdf

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages: list[str] = []
    for page in doc[:max_pages]:
        text = page.get_text("text")
        if text and text.strip():
            pages.append(text)
    doc.close()
    return "\n\n--- PAGE BREAK ---\n\n".join(pages)


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _slugify(value: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return s or "item"


def parse_pdf_to_chapters(pdf_text: str, timeout: float = 120.0) -> dict[str, Any]:
    """Send the extracted text to Claude and parse the structured response."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set; cannot structure the PDF."
        )

    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)
    # Trim to a sane length — Claude has a long context but we don't need
    # the entire textbook, just enough that the structure is recoverable.
    truncated = pdf_text[:80_000]

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=SYSTEM,
        messages=[{"role": "user", "content": truncated}],
        timeout=timeout,
    )
    raw = "".join(
        b.text for b in resp.content if getattr(b, "type", None) == "text"
    ).strip()
    raw = _strip_code_fence(raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Claude returned invalid JSON: {e}; raw={raw[:500]}")

    chapters = data.get("chapters")
    if not isinstance(chapters, list) or not chapters:
        raise RuntimeError("response did not contain a non-empty `chapters` array")

    seen_ids: set[str] = set()
    cleaned: list[dict[str, Any]] = []
    for ci, ch in enumerate(chapters):
        if not isinstance(ch, dict):
            continue
        sections = ch.get("sections") or []
        if not isinstance(sections, list):
            continue
        out_sections: list[dict[str, Any]] = []
        for s in sections:
            if not isinstance(s, dict):
                continue
            formal = s.get("formal") or {}
            theorem = s.get("theorem") or {}
            if not isinstance(formal, dict) or not isinstance(theorem, dict):
                continue
            kind = formal.get("kind")
            if kind not in (
                "Definition",
                "Theorem",
                "Proposition",
                "Corollary",
                "Lemma",
            ):
                kind = "Theorem"
            tid = (theorem.get("id") or _slugify(str(theorem.get("title", "")))).strip()
            tid = _slugify(tid) or _slugify(str(s.get("heading", "item")))
            # Make sure ids are unique
            base = tid
            n = 2
            while tid in seen_ids:
                tid = f"{base}-{n}"
                n += 1
            seen_ids.add(tid)
            out_sections.append({
                "heading": sanitize(str(s.get("heading", "")).strip()),
                "formal": {
                    "kind": kind,
                    "name": (formal.get("name") or None),
                    "body": sanitize(str(formal.get("body", "")).strip()),
                },
                "intro": sanitize(str(s.get("intro", "")).strip()),
                "theorem": {
                    "id": tid,
                    "title": sanitize(str(theorem.get("title", "")).strip()),
                    "statement": str(theorem.get("statement", "")).strip(),
                    "context": sanitize(str(theorem.get("context", "")).strip()),
                },
            })
        if not out_sections:
            continue
        cleaned.append({
            "number": int(ch.get("number") or (ci + 1)),
            "title": sanitize(str(ch.get("title", "")).strip()),
            "blurb": sanitize(str(ch.get("blurb", "")).strip()),
            "sections": out_sections,
        })

    if not cleaned:
        raise RuntimeError("no usable sections were extracted from the PDF")

    return {"chapters": cleaned}
