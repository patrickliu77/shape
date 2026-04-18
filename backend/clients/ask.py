"""Free-form math chat — produces a structured answer with step-by-step
and a pointer to the most relevant textbook theorem.

The student types any math question into the global chat bar. We call Claude
with the catalog of textbook theorems and ask for JSON containing:
    answer:               1-3 sentence direct reply
    steps:                2-5 numbered steps (title + body, both with $...$ math)
    suggested_theorem_id: one of the 10 theorem ids, or null

The frontend renders the answer + steps and offers a "Open visualization"
button that opens the suggested theorem's panel.
"""

import json
import os
import re
from typing import List, Dict, Optional, Any

# Single source of truth for the textbook catalog. Order = display order.
THEOREMS: list[tuple[str, str]] = [
    ("limit",            "ε-δ definition of a limit"),
    ("derivative",       "derivative as slope of the tangent line"),
    ("chain-rule",       "chain rule for composed functions"),
    ("exponential",      "exponential family y = e^{at}, dy/dt = ay"),
    ("damped-oscillator","damped oscillation y = e^{-γt}cos(ωt)"),
    ("de-moivre",        "De Moivre's theorem (cosθ + i sinθ)^n"),
    ("double-integral",  "double integral as a Riemann limit of prism volumes"),
    ("determinant",      "determinant of a 2×2 matrix as signed parallelogram area"),
    ("saddle",           "critical points of z = ax² + by² (bowl, saddle, dome)"),
    ("gaussian-integral","Gaussian integral ∫e^{-x²}dx = √π via the squaring + polar trick"),
    ("normal-distribution", "normal distribution N(μ, σ²) — bell curve with mean μ and standard deviation σ"),
]

THEOREM_IDS = {tid for tid, _ in THEOREMS}


def _catalog_block() -> str:
    return "\n".join(f"  - {tid}: {desc}" for tid, desc in THEOREMS)


# Pre-cooked question→video mappings. When the student's question lines up
# with one of these themes, Claude embeds the video at a specific step in
# the solution. The video itself is one of our pre-rendered Manim scenes.
PRECOOKED_VIDEOS: list[tuple[str, str, str]] = [
    # (topic_description, video_url, why_useful)
    (
        "normal distribution, Gaussian distribution, bell curve, the formula "
        "N(μ, σ²), what mean and standard deviation do to the bell curve, "
        "z-scores, why the normal pdf integrates to 1, statistics intro",
        "/cache/videos/09_normal.mp4",
        "Animates μ shifting the bell curve left/right and σ stretching it "
        "wide/narrow while the area under it stays exactly 1.",
    ),
    (
        "n-th roots of unity, complex solutions of z^n = 1, why roots are "
        "evenly spaced on the unit circle, points at angles 2πk/n, "
        "geometric meaning of complex roots",
        "/cache/videos/10_roots_of_unity.mp4",
        "Shows n equally-spaced points appear on the unit circle as n "
        "increases from 2 to 8, with their angles labeled.",
    ),
    (
        "Euler's identity, e^(iπ) + 1 = 0, why this is the most beautiful "
        "equation, complex exponential as rotation, e^(iθ) traces the unit "
        "circle, polar form of complex numbers",
        "/cache/videos/11_euler.mp4",
        "Animates e^(iθ) rotating around the unit circle as θ sweeps from 0 "
        "to π, landing exactly at -1 — visualising e^(iπ) = -1 directly.",
    ),
]


def _videos_block() -> str:
    lines = []
    for topic, url, why in PRECOOKED_VIDEOS:
        lines.append(f'  - video_url: "{url}"')
        lines.append(f"      matches questions about: {topic}")
        lines.append(f"      why useful: {why}")
    return "\n".join(lines)


VIDEO_URLS = {url for _, url, _ in PRECOOKED_VIDEOS}


SYSTEM_EN = f"""You are a friendly, patient math tutor — think a cool older sibling explaining over coffee. You're inside *shape*, an AI-native calculus textbook.

A student just typed a question into the chat. Reply with a JSON object exactly matching this schema:

{{
  "answer": "1-3 sentences, plain English, $...$ for inline math. Direct, warm, no preamble like 'Great question!'",
  "steps": [
    {{"title": "4-8 word step title", "body": "1-3 sentences walking through this step. Use $...$ for math."}},
    ...up to 5 steps total
  ],
  "suggested_theorem_id": "one of the textbook theorem ids below, or null if none fits",
  "video_url": "one of the video URLs below if the question matches a video topic, else null",
  "video_at_step": "0-based step index where embedding the video would make pedagogical sense, or null"
}}

Catalog of textbook theorems the student can dive into (use these for suggested_theorem_id):
{_catalog_block()}

Catalog of pre-rendered videos (use these for video_url — exact strings only):
{_videos_block()}

Rules:
- Reply with ONLY the JSON object — no markdown fence, no preamble
- 2-5 steps, each focused and short
- Pick the theorem id that's most relevant, or null. Do not invent ids.
- For video_url: pick the video that BEST illustrates the question's core idea, or null if no video fits well. Use the EXACT URL string from the video catalog.
- For video_at_step: choose the step index (0-based) where seeing the visual would unlock the rest of the explanation. Usually NOT step 0 — the student needs some setup first. Often the second or third step works best.
- If video_url is null, video_at_step must also be null.
- If the question is off-topic (not math), set steps to [] and all other fields to null."""

SYSTEM_AR = f"""إنت مدرّس رياضيات صبور وودود — زي أخوك الكبير اللي بيشرحلك على القهوة. إنت جوّه *shape*، كتاب رياضيات تفاعلي بالذكاء الاصطناعي.

طالب لسه كاتب سؤال في الشات. ردّ بكائن JSON بالشكل ده بالظبط:

{{
  "answer": "جملة لـ ٣ جمل، بالعامية المصرية، $...$ للرياضيات. مباشر، حلو، من غير مقدمات زي 'سؤال جميل'",
  "steps": [
    {{"title": "عنوان الخطوة من ٤ لـ ٨ كلمات", "body": "جملة لـ ٣ جمل بتشرح الخطوة دي. استخدم $...$ للرياضيات."}},
    ...لحد ٥ خطوات
  ],
  "suggested_theorem_id": "ID واحد من قائمة النظريات، أو null",
  "video_url": "URL من قائمة الفيديوهات لو السؤال مناسب، أو null",
  "video_at_step": "رقم الخطوة (يبدأ من ٠) اللي الفيديو يتشاف فيها، أو null"
}}

قائمة نظريات الكتاب:
{_catalog_block()}

قائمة الفيديوهات الجاهزة (استخدم الـ URL بالظبط):
{_videos_block()}

قواعد:
- ردّ بكائن الـ JSON بس — مفيش markdown، مفيش مقدمات
- من ٢ لـ ٥ خطوات، كل خطوة قصيرة ومركّزة
- اختار الـ ID الأنسب، أو null. متخترعش IDs جديدة.
- video_url: اختار الفيديو اللي بيشرح فكرة السؤال أحسن، أو null لو مفيش حاجة مناسبة. استخدم الـ URL بالظبط من القائمة.
- video_at_step: اختار الخطوة (تبدأ من 0) اللي الفيديو هيتشاف فيها. عادةً مش الخطوة 0 — الطالب محتاج تمهيد الأول. الخطوة التانية أو التالتة بتنفع كويس.
- لو video_url = null، video_at_step كمان لازم يبقى null.
- لو السؤال مش رياضيات، steps = []، وكل الحاجات التانية null. بالعامية المصرية برضه."""


def _strip_code_fence(text: str) -> str:
    """Claude sometimes wraps JSON in ```json ... ```. Strip it."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def ask(
    text: str,
    lang: str,
    history: Optional[List[Dict[str, str]]],
    timeout: float = 60.0,
) -> Dict[str, Any]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "answer": "(Stub — set ANTHROPIC_API_KEY in backend/.env for real answers.)",
            "steps": [],
            "suggested_theorem_id": None,
            "model": "stub",
        }

    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)
    system = SYSTEM_AR if lang == "ar" else SYSTEM_EN

    messages: List[Dict[str, str]] = []
    for m in (history or [])[:-1]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": text})

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1200,
        system=system,
        messages=messages,
        timeout=timeout,
    )
    raw = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip()
    raw = _strip_code_fence(raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {
            "answer": raw,
            "steps": [],
            "suggested_theorem_id": None,
            "model": "claude",
        }

    answer = str(data.get("answer", "")).strip()
    steps_raw = data.get("steps") or []
    steps: List[Dict[str, str]] = []
    for s in steps_raw[:5]:
        if isinstance(s, dict):
            steps.append({
                "title": str(s.get("title", "")).strip(),
                "body": str(s.get("body", "")).strip(),
            })
    suggested = data.get("suggested_theorem_id")
    if suggested not in THEOREM_IDS:
        suggested = None

    video_url = data.get("video_url")
    if video_url not in VIDEO_URLS:
        video_url = None

    raw_step = data.get("video_at_step")
    video_at_step: Optional[int] = None
    if video_url and isinstance(raw_step, int) and 0 <= raw_step < len(steps):
        video_at_step = raw_step

    return {
        "answer": answer or "(empty answer)",
        "steps": steps,
        "suggested_theorem_id": suggested,
        "video_url": video_url,
        "video_at_step": video_at_step,
        "model": "claude",
    }
