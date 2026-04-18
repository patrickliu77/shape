"""LLM client for theorem explanations.

Primary path: Anthropic Claude (Sonnet 4.6) — great at pedagogy and math.
When ANTHROPIC_API_KEY is not set, falls back to a canned stub so the frontend
still has something useful to render during local dev.
"""

import os
from typing import List, Dict, Optional

SYSTEM_PROMPT = """You're a friendly math tutor — think cool older sibling, not classroom teacher.
The student just tapped a theorem in their textbook and asked you something.

Be warm and conversational. Match the student's energy. Use everyday analogies and
plain language. Skip lecture-tone openers like "Great question!", "Let me explain", or
"In essence". Just dive straight into the answer like you're texting a friend.

Keep it tight — 2 to 4 sentences. Inline LaTeX with $...$ when the math actually helps;
otherwise just talk it out."""

LANG_INSTRUCTION = {
    "en": "Reply in casual everyday English. Avoid stiff or textbook phrasing.",
    "ar": (
        "إنت بتتكلم مع صاحبك أو ابن خالتك في كافيه، مش بتلقي محاضرة. "
        "العامية المصرية بس — لا فصحى، لا ترجمة حرفية من إنجليزي. "
        "استخدم كلمات يومية زي: يعني، بص، تخيّل، هتلاقي، في، علشان، كده، "
        "أهو، بقى، خلاص. \n\n"
        "ممنوع تمامًا: «سؤال جميل»، «بالتالي»، «بالإضافة إلى ذلك»، «في الواقع»، "
        "«من ناحية أخرى»، «بشكل أساسي»، أي كلمة إنجليزية مكتوبة بحروف لاتينية "
        "(زي value، slope، function — قول قيمة، ميل، دالة).\n\n"
        "أمثلة على الأسلوب اللي عايزينه:\n"
        "س: ايه يعني المشتقة؟\n"
        "ج: تخيّل إنك ماشي في عربية وبتبص على عداد السرعة. الرقم اللي شايفه ده هو "
        "السرعة بتاعتك في اللحظة دي بالظبط. المشتقة نفس الفكرة بالظبط — بتقولّك "
        "الدالة بتتغيّر بسرعة قد ايه عند نقطة معيّنة.\n\n"
        "س: ليه الشكل ده مش متماثل؟\n"
        "ج: بص، لو طبقت الشكل على نفسه، هتلاقي الجناح اليمين أطول من الشمال شوية، "
        "علشان كده مش هيبقى متماثل. جرّب تطويه على المنتصف وهتشوف بنفسك."
    ),
}


def _stub_answer(text: str, lang: str) -> str:
    notice = "(Stub — set ANTHROPIC_API_KEY in backend/.env for real answers.)"
    if lang == "ar":
        return f'{notice} سألت: "{text[:120]}". لو السيرفر شغّال، Claude كان هيرد عليك بالعامية.'
    return (
        f'{notice} You asked: "{text[:120]}". With the key set, Claude would actually answer.'
    )


def explain(
    text: str,
    lang: str,
    theorem_id: Optional[str],
    theorem_title: Optional[str],
    theorem_statement: Optional[str],
    history: Optional[List[Dict[str, str]]],
) -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return _stub_answer(text, lang)

    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)
    messages: List[Dict[str, str]] = []
    for m in (history or [])[:-1]:  # all but last (the one just added)
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": text})

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

    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        system=SYSTEM_PROMPT + context_block + lang_note,
        messages=messages,
    )
    parts = [b.text for b in resp.content if getattr(b, "type", None) == "text"]
    return "".join(parts).strip() or "(empty response)"
