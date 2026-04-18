"""Rewrite the cinematic narration transcripts in a friendly-teacher voice
using Claude, aligned with what each Manim video actually shows.

Reads the inline transcripts table below, calls Claude per (theorem, lang),
and writes the output as JSON to frontend/src/polished-transcripts.json.

The frontend imports that JSON and uses it as the authoritative narration
for cinematic theorems (falling back to the original embedded transcript if
the polished version is missing).

Usage:
    python scripts/polish_transcripts.py            # all theorems
    python scripts/polish_transcripts.py limit derivative   # only some
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Dict

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "frontend" / "src" / "polished-transcripts.json"

# (id, scene_summary, original_en, original_ar)
# scene_summary tells Claude what the video actually shows so the narration
# tracks the visuals frame by frame.
THEOREMS: list[dict] = [
    {
        "id": "limit",
        "scene": (
            "A blue parabola y=f(x) is drawn over labelled axes. A point a is "
            "marked on the x-axis and L on the y-axis. A yellow horizontal "
            "epsilon-band of height 2*epsilon appears around y=L, and a green "
            "vertical delta-band of width 2*delta appears around x=a. As "
            "epsilon shrinks (0.6 → 0.3 → 0.12 → 0.04), delta also shrinks; "
            "live ε and δ readouts in the corner update with each step."
        ),
        "en": (
            "Imagine a tiny window of height epsilon around the limit L. No "
            "matter how small you make that window, we can always find a "
            "corresponding narrow strip of width delta around a such that "
            "every x inside that strip lands inside the epsilon window. That "
            "is what it means for the function to approach L."
        ),
        "ar": (
            "تخيّل شباك صغير ارتفاعه إبسيلون حوالين النهاية L. مهما تصغّر "
            "الشباك ده، هنلاقي شريط ضيق عرضه دلتا حوالين النقطة a، أي قيمة x "
            "جوّاه هتقع جوّا الشباك بتاع إبسيلون. ده معنى إن الدالة بتقرّب من L."
        ),
    },
    {
        "id": "derivative",
        "scene": (
            "On axes labelled f(x), a blue parabola f(x)=½x² is drawn. An "
            "orange anchor dot sits at x=1.5; a yellow second dot is placed "
            "h=1.3 to its right. A yellow secant line is drawn through them, "
            "with live readouts of slope and h in the corner. As h is "
            "animated from 1.3 down to 0.05, the second dot slides toward "
            "the first and the secant pivots into the tangent. Final readout "
            "f'(1.5) = 1.50 flashes at the bottom."
        ),
        "en": (
            "The derivative is the slope of the tangent line, which is the "
            "limit of slopes of secant lines. As h shrinks to zero, the "
            "secant pivots into the tangent. This single number — the "
            "derivative at a — is the instantaneous rate at which the "
            "function is changing."
        ),
        "ar": (
            "المشتقة هي ميل خط المماس، اللي هو نهاية ميل الخطوط القاطعة. "
            "لما h بتقرّب من الصفر، الخط القاطع بيلفّ ويبقى مماس. الرقم ده "
            "— المشتقة عند a — هو معدّل التغيّر اللحظي للدالة."
        ),
    },
    {
        "id": "chain-rule",
        "scene": (
            "Three horizontal number lines stacked vertically: x on top "
            "(white), u=g(x)=2x in the middle (blue), y=f(u)=u² at bottom "
            "(green). A yellow segment [0.4, 0.6] on the x-line is highlighted "
            "and braced. A blue arrow shows ×g'(x)=2 mapping it to a yellow "
            "segment of length 0.4 on the u-line. A green arrow shows "
            "×f'(u)=2u≈1.0 mapping it to a yellow segment on the y-line. "
            "Final orange formula appears: (f∘g)'(x) = f'(g(x))·g'(x) = 2u·2 = 4u."
        ),
        "en": (
            "Think of two number lines being stretched. The inner function "
            "stretches the input by its derivative. Then the outer function "
            "stretches that output again. The total stretch is the product — "
            "that is the chain rule."
        ),
        "ar": (
            "تخيّل خطّين أرقام بيتشدّوا. الدالة الجوّانية بتشدّ المدخل "
            "بمشتقتها. بعدين الدالة البرّانية بتشدّ الناتج تاني. الشدّ "
            "الكلّي هو حاصل ضرب الاتنين — ده قانون السلسلة."
        ),
    },
    {
        "id": "de-moivre",
        "scene": (
            "A complex plane with the unit circle. A fixed yellow vector "
            "from origin to e^(iθ) at angle 30° is drawn and labelled. A "
            "green vector to e^(inθ) starts at the same point when n=1, then "
            "swings around as n increases from 1 to 6. A traced path follows "
            "the green tip. Live readouts of n and nθ (in degrees) update on "
            "the right. n then sweeps back down to 1."
        ),
        "en": (
            "De Moivre's theorem says that raising a unit complex number to "
            "the n-th power multiplies its angle by n. Geometrically you spin "
            "n times around the unit circle for every one trip the original "
            "made. The animation shows the green vector at angle n theta "
            "racing ahead of the yellow base vector as n grows."
        ),
        "ar": (
            "نظرية دي موافر بتقول لو رفعت عدد مركّب على الدايرة الواحدة "
            "لقوة n، الزاوية بتتضرب في n. يعني المتجه الأخضر بيدور n مرة "
            "على الدايرة لكل دورة بيعملها المتجه الأصفر الأصلي. الفيديو "
            "بيوريك ده وانت تعد n."
        ),
    },
    {
        "id": "double-integral",
        "scene": (
            "A 3D scene with axes and a dim blue surface z = f(x,y) over "
            "[0,2]². The region is sliced into a grid; a prism stands on each "
            "cell with height equal to f at the cell's centre. Grid refines: "
            "2×2 (4 prisms) → 4×4 (16) → 8×8 (64) → 16×16 (256). Caption in "
            "the corner shows n × n and Δ. Then the prisms vanish, the "
            "surface becomes solid, and a 'n → ∞, Δ → 0' caption appears as "
            "the camera glides to a new angle. Closing line: 'The Riemann sum "
            "has become the exact volume.'"
        ),
        "en": (
            "The double integral of f over a region R is the volume trapped "
            "between the surface z equals f of x y and the region itself. To "
            "compute it, slice R into a grid of tiny squares. Above each "
            "square stand a prism whose height is f at that point. Add all "
            "the boxes together and you have an approximation. As the squares "
            "get smaller and smaller, the approximation tightens onto the "
            "exact volume. That limit of sums is the definition of the "
            "double integral."
        ),
        "ar": (
            "التكامل المزدوج لـ f على منطقة R هو الحجم اللي بين السطح z = "
            "f(x, y) والمنطقة نفسها. عشان نحسبه، بنقطّع R لشبكة مربعات "
            "صغيرة. فوق كل مربع بنبني مَنشور ارتفاعه f عند النقطة دي — يبقى "
            "عندنا صندوق صغير ليه حجم. نجمع كل الصناديق، يطلع تقريب للحجم. "
            "وكل ما المربعات تصغّر، التقريب يقرب أكتر من الحجم الحقيقي. "
            "النهاية دي بتاعة المجموع هي تعريف التكامل المزدوج."
        ),
    },
    {
        "id": "determinant",
        "scene": (
            "A coordinate plane with a unit square (blue, det=1) and its two "
            "column-vector arrows drawn. The matrix is morphed through: "
            "shear [[1,1],[0,1]] (still blue, det=1, parallelogram), "
            "stretch [[1.5,0],[0,2]] (det=3, larger blue parallelogram), "
            "flip [[1,0],[1,-1]] (det=-1, red parallelogram, orientation "
            "reversed), and collapse [[1,1],[1,1]] (det=0, grey degenerate "
            "line). The det readout in the corner updates each time. Closing: "
            "'Negative det = orientation flipped. Zero det = squashed to a line.'"
        ),
        "en": (
            "The determinant of a 2 by 2 matrix is just a d minus b c. "
            "Geometrically it is the signed area of the parallelogram whose "
            "sides are the matrix's columns. The animation morphs a unit "
            "square through several matrices. A shear keeps the area at one. "
            "A stretch triples it. A flip makes the determinant negative — "
            "the matrix has reversed orientation. And a singular matrix "
            "collapses the square to a line, so the determinant drops to zero."
        ),
        "ar": (
            "محدد المصفوفة 2 في 2 هو ببساطة ad - bc. الفكرة الهندسية: ده "
            "مساحة متوازي الأضلاع اللي أعمدته أضلاع المصفوفة. الفيديو "
            "بيمشّي مربع الوحدة في كذا تحويل: قَصّ بيخلّي المساحة 1، تمدّد "
            "بيضاعفها 3 مرات، انعكاس بيخلّي المحدد سالب يعني المصفوفة قلبت "
            "الاتجاه، وأخيرًا مصفوفة شاذة بتفلطح المربع لخط — المحدد يبقى صفر."
        ),
    },
    {
        "id": "saddle",
        "scene": (
            "A 3D scene with axes. The surface z = a x² + b y² is shown as "
            "a translucent coloured mesh. Three regimes are demonstrated in "
            "sequence with slow camera spins between each: (a=1, b=1) blue "
            "paraboloid bowl labelled 'minimum (bowl)'; morph to (a=1, b=-1) "
            "yellow saddle labelled 'saddle point'; morph to (a=-1, b=-1) "
            "red upside-down dome labelled 'maximum (dome)'. The (a,b) values "
            "are shown in the upper-left. Closing: 'ab > 0: bowl or dome.  "
            "ab < 0: saddle.'"
        ),
        "en": (
            "The function z equals a x squared plus b y squared has its "
            "gradient vanishing exactly at the origin. So the origin is "
            "always a critical point. If both a and b are positive, the "
            "surface curves up in every direction and the origin is a local "
            "minimum, a paraboloid bowl. If both are negative, every direction "
            "curves down and the origin is a maximum. If a and b have "
            "opposite signs the surface goes up one way and down the other "
            "— that's a saddle point."
        ),
        "ar": (
            "الدالة z = a x² + b y² انحدارها بيساوي صفر عند نقطة الأصل "
            "بالظبط. يعني الأصل دايمًا نقطة حرجة. لو a و b الاتنين موجبين، "
            "السطح بيتقوّس لفوق في كل اتجاه، فالأصل قاع وعاء. لو الاتنين "
            "سالبين، السطح بيتقوّس لتحت، فالأصل قمّة قبّة. ولو إشارتهم "
            "مختلفة، السطح بيطلع في اتجاه وينزل في التاني — دي نقطة السرج."
        ),
    },
]

PROMPT_EN = """You are rewriting a voice-over narration that plays under a Manim math animation. The narrator is a friendly, patient male teacher (think a relaxed older brother explaining homework over coffee). The student is a K-12 learner who has just tapped a theorem in their textbook.

VIDEO BEING NARRATED:
{scene}

CURRENT NARRATION (rewrite this):
{original}

Rewrite it so:
- It tracks what the visual is actually doing on screen — call out the moments the viewer is seeing ("watch the band shrink", "see how the secant pivots", etc.)
- Sounds like a real teacher talking, not a textbook reading itself aloud
- Uses short, breathable sentences a TTS engine can pace naturally
- Keeps the SAME mathematical meaning (no new content, no changed claims)
- Stays within ±15% of the original word count so the audio length still matches the video
- No openers like "Great question", "Let me explain", "In essence"
- No bullet points, no markdown, no headings — pure narration paragraph

Output only the rewritten narration. Nothing else."""

PROMPT_AR = """إنت بتعيد كتابة شرح صوتي بيتشغل تحت أنيميشن رياضيات. المعلّق راجل مدرّس صبور وودود (زي أخوك الكبير اللي بيشرح لك الواجب وانت قاعدين على القهوة). الطالب طفل أو مراهق فتح النظرية من الكتاب لأول مرة.

الفيديو اللي بنشرحه:
{scene}

الشرح الحالي (أعد كتابته):
{original}

أعد كتابته بحيث:
- يتتبع اللي بيحصل فعلاً على الشاشة — قول للمشاهد إيه اللي يبصّ عليه دلوقتي ("شوف الشريط بيصغّر"، "بصّ ازاي الخط القاطع بيلفّ")
- يبقى زي مدرّس بيتكلم، مش زي كتاب بيقرا نفسه
- جمل قصيرة وعلى الراحة، عشان الـ TTS يقدر يقولها طبيعي
- نفس المعنى الرياضي بالظبط — متضيفش حاجة جديدة ولا تغير معنى
- نفس طول الكلام تقريبًا (±15%)
- بالعامية المصرية، مش الفصحى
- متبدأش بـ"سؤال جميل"، "خلّيني أشرحلك"، أو أي كلام رسمي
- بدون نقاط أو عناوين — فقرة شرح نقية

اطلع الشرح المعاد كتابته بس. مفيش حاجة تانية."""


def polish(client, scene: str, original: str, lang: str) -> str:
    prompt = (PROMPT_EN if lang == "en" else PROMPT_AR).format(
        scene=scene, original=original
    )
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
    return "".join(parts).strip()


def main() -> int:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[error] ANTHROPIC_API_KEY missing in backend/.env")
        return 1

    from anthropic import Anthropic

    client = Anthropic(api_key=api_key)

    only = set(sys.argv[1:])  # restrict to specific theorem ids if given

    output: Dict[str, Dict[str, str]] = {}
    if OUT_PATH.exists():
        try:
            output = json.loads(OUT_PATH.read_text(encoding="utf-8"))
        except Exception:
            output = {}

    for entry in THEOREMS:
        tid = entry["id"]
        if only and tid not in only:
            continue
        print(f"\n=== {tid} ===")
        for lang in ("en", "ar"):
            original = entry[lang]
            polished = polish(client, entry["scene"], original, lang)
            output.setdefault(tid, {})[lang] = polished
            print(f"  [{lang}] {polished[:120]}{'…' if len(polished) > 120 else ''}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n[ok] wrote {OUT_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
