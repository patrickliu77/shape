import type { Theorem } from "./types";

export const theorems: Theorem[] = [
  {
    id: "limit",
    title: "The ε–δ definition of a limit",
    statement:
      "\\lim_{x \\to a} f(x) = L \\iff \\forall \\varepsilon > 0,\\ \\exists \\delta > 0 : 0 < |x - a| < \\delta \\implies |f(x) - L| < \\varepsilon",
    context:
      "The limit captures what value a function approaches as its input approaches a point. We can make f(x) as close to L as we like by choosing x close enough to a.",
    cinematic: {
      video: "/cache/videos/01_limit.mp4",
      audio: { en: "/cache/audio/01_limit.en.mp3" },
    },
    transcript: {
      en: "Imagine a tiny window of height epsilon around the limit L. No matter how small you make that window, we can always find a corresponding narrow strip of width delta around a such that every x inside that strip lands inside the epsilon window. That is what it means for the function to approach L.",
      ar: "تخيّل شباك صغير ارتفاعه إبسيلون حوالين النهاية L. مهما تصغّر الشباك ده، هنلاقي شريط ضيق عرضه دلتا حوالين النقطة a، أي قيمة x جوّاه هتقع جوّا الشباك بتاع إبسيلون. ده معنى إن الدالة بتقرّب من L.",
    },
  },
  {
    id: "derivative",
    title: "The derivative as the slope of the tangent line",
    statement:
      "f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}",
    context:
      "Take a secant line through two points on a curve. Now slide one point toward the other. The secant rotates until — at the instant the two points collide — it becomes the tangent. Its slope is the derivative.",
    cinematic: {
      video: "/cache/videos/02_derivative.mp4",
      audio: { en: "/cache/audio/02_derivative.en.mp3" },
    },
    transcript: {
      en: "The derivative is the slope of the tangent line, which is the limit of slopes of secant lines. As h shrinks to zero, the secant pivots into the tangent. This single number — the derivative at a — is the instantaneous rate at which the function is changing.",
      ar: "المشتقة هي ميل خط المماس، اللي هو نهاية ميل الخطوط القاطعة. لما h بتقرّب من الصفر، الخط القاطع بيلفّ ويبقى مماس. الرقم ده — المشتقة عند a — هو معدّل التغيّر اللحظي للدالة.",
    },
  },
  {
    id: "chain-rule",
    title: "The chain rule",
    statement: "(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)",
    context:
      "When two functions are composed, the rate of change of the whole is the rate of change of the outer function — evaluated at the inner — times the rate of change of the inner.",
    cinematic: {
      video: "/cache/videos/03_chain_rule.mp4",
      audio: { en: "/cache/audio/03_chain_rule.en.mp3" },
    },
    transcript: {
      en: "Think of two number lines being stretched. The inner function stretches the input by its derivative. Then the outer function stretches that output again. The total stretch is the product — that is the chain rule.",
      ar: "تخيّل خطّين أرقام بيتشدّوا. الدالة الجوّانية بتشدّ المدخل بمشتقتها. بعدين الدالة البرّانية بتشدّ الناتج تاني. الشدّ الكلّي هو حاصل ضرب الاتنين — ده قانون السلسلة.",
    },
  },
  {
    id: "exponential",
    title: "The exponential family $y = e^{at}$",
    statement: "y(t) = e^{a t},\\qquad \\frac{dy}{dt} = a\\, y",
    context:
      "The function e^{at} is the simplest solution of a first-order linear ODE. The sign and size of a control whether the system grows, decays, or stays flat. Drag the slider to feel it.",
    interactive: {
      fn: (t, { a }) => Math.exp(a * t),
      params: [
        { name: "a", label: "rate a", min: -1.5, max: 1.5, step: 0.01, default: 0.4 },
      ],
      xRange: [-3, 3],
      yRange: [-0.2, 8],
      xLabel: "t",
      yLabel: "y",
      narrate: ({ a }, lang) => {
        const v = a.toFixed(2);
        if (lang === "ar") {
          if (a > 0.05) return `لمّا a يساوي ${v}، الحل بيكبر بسرعة.`;
          if (a < -0.05) return `لمّا a يساوي ${v}، الحل بيقلّ ويقرّب من الصفر.`;
          return `a قريب من الصفر، فالحل بيفضل تقريبًا ثابت عند واحد.`;
        }
        if (a > 0.05) return `With a = ${v}, the solution shoots up exponentially.`;
        if (a < -0.05) return `With a = ${v}, the solution decays toward zero.`;
        return `a's near zero, so the solution just hovers around one.`;
      },
    },
    transcript: {
      en: "This curve is the solution of y prime equals a y, with y of zero equal to one. When a is positive, the function grows — faster the larger a is. When a is negative, it decays toward zero. When a is zero, the function stays at one. Drag the slider and watch the entire family of solutions.",
      ar: "المنحنى ده هو حل المعادلة y′ = a·y مع y(0) = 1. لما a يبقى موجب، الدالة بتكبر — وكل ما a يكبر، الكبر بيزيد. لما a يبقى سالب، الدالة بتقلّ وتقرّب من الصفر. لما a يساوي صفر، الدالة بتفضل ثابتة عند واحد. حرّك الشريط وشوف عيلة الحلول كلها.",
    },
  },
  {
    id: "damped-oscillator",
    title: "Damped oscillation $y = e^{-\\gamma t} \\cos(\\omega t)$",
    statement:
      "\\ddot{y} + 2\\gamma \\dot{y} + (\\gamma^2 + \\omega^2) y = 0",
    context:
      "A mass on a spring with friction. The damping γ controls how fast the oscillation dies out; the angular frequency ω controls how fast it wiggles. Try both sliders.",
    interactive: {
      fn: (t, { gamma, omega }) => Math.exp(-gamma * t) * Math.cos(omega * t),
      params: [
        { name: "gamma", label: "damping γ", min: 0, max: 1.5, step: 0.01, default: 0.3 },
        { name: "omega", label: "frequency ω", min: 0.2, max: 6, step: 0.05, default: 2.5 },
      ],
      xRange: [0, 12],
      yRange: [-1.1, 1.1],
      xLabel: "t",
      yLabel: "y",
      narrate: ({ gamma, omega }, lang) => {
        const g = gamma.toFixed(2);
        const w = omega.toFixed(2);
        if (lang === "ar") {
          const tail =
            gamma < 0.05
              ? "من غير تخميد، الذبذبة بتفضل ماشية وقت طويل."
              : gamma > 1
              ? "بتخميد قوي، الحركة بتموت بسرعة."
              : "الغلاف بيصغر بالتدريج والذبذبة بتهدا.";
          return `γ = ${g}، ω = ${w}. ${tail}`;
        }
        const tail =
          gamma < 0.05
            ? "With almost no damping, the oscillation barely decays."
            : gamma > 1
            ? "With heavy damping, motion dies out quickly."
            : "The envelope shrinks steadily as the oscillation rings down.";
        return `Gamma is ${g}, omega is ${w}. ${tail}`;
      },
    },
    transcript: {
      en: "This is a classic damped oscillator. The envelope e to the minus gamma t sets how quickly the oscillation fades. Inside the envelope, cosine of omega t does the wiggling. Increase gamma and the motion dies faster. Increase omega and it oscillates more times before settling.",
      ar: "ده مذبذب مُخمَّد كلاسيكي. الغلاف e^{-γt} بيحدّد الذبذبة بتموت بسرعة قد إيه. وجوه الغلاف، cos(ωt) هو اللي بيعمل الترجيح. زوّد γ تلاقي الحركة بتموت أسرع. زوّد ω تلاقيها بتذبذب أكتر قبل ما تهدا.",
    },
  },

  // ─────────────────────── Chapter 4 ───────────────────────

  {
    id: "de-moivre",
    title: "De Moivre's theorem $(\\cos\\theta + i\\sin\\theta)^n$",
    statement:
      "(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)",
    context:
      "Multiplying complex numbers on the unit circle adds their angles. Raising $\\cos\\theta + i\\sin\\theta$ to the $n$-th power multiplies the angle by $n$ — so the tip of the vector spins $n$ times faster around the unit circle.",
    cinematic: {
      video: "/cache/videos/04_de_moivre.mp4",
    },
    transcript: {
      en: "De Moivre's theorem says that raising a unit complex number to the n-th power multiplies its angle by n. Geometrically you spin n times around the unit circle for every one trip the original made. The animation shows the green vector at angle n theta racing ahead of the yellow base vector as n grows.",
      ar: "نظرية دي موافر بتقول لو رفعت عدد مركّب على الدايرة الواحدة لقوة n، الزاوية بتتضرب في n. يعني المتجه الأخضر بيدور n مرة على الدايرة لكل دورة بيعملها المتجه الأصفر الأصلي. الفيديو بيوريك ده وانت تعد n.",
    },
  },

  {
    id: "double-integral",
    title: "The double integral $\\iint_R f\\,dA$ as a sum of prisms",
    statement:
      "\\iint_R f(x,y)\\,dA \\;=\\; \\lim_{\\Delta \\to 0} \\sum_{i,j} f(x_i,\\,y_j)\\,\\Delta x\\,\\Delta y",
    context:
      "Slice the region $R$ into a fine grid. Above each tiny square build a prism whose height is the value of $f$ there. The total volume of all the prisms approximates $\\iint_R f\\,dA$. Take the grid finer and finer — in the limit, the sum becomes the exact volume under the surface.",
    cinematic: {
      video: "/cache/videos/05_double_integral.mp4",
    },
    transcript: {
      en: "The double integral of f over a region R is the volume trapped between the surface z equals f of x y and the region itself. To compute it, slice R into a grid of tiny squares. Above each square stand a prism whose height is f at that point — that gives one little box of volume. Add all the boxes together and you have an approximation. As the squares get smaller and smaller, the approximation tightens onto the exact volume. That limit of sums is the definition of the double integral.",
      ar: "التكامل المزدوج لـ f على منطقة R هو الحجم اللي بين السطح z = f(x, y) والمنطقة نفسها. عشان نحسبه، بنقطّع R لشبكة مربعات صغيرة. فوق كل مربع بنبني مَنشور ارتفاعه f عند النقطة دي — يبقى عندنا صندوق صغير ليه حجم. نجمع كل الصناديق، يطلع تقريب للحجم. وكل ما المربعات تصغّر، التقريب يقرب أكتر من الحجم الحقيقي. النهاية دي بتاعة المجموع هي تعريف التكامل المزدوج.",
    },
  },

  {
    id: "determinant",
    title: "Determinant of a $2\\times 2$ matrix",
    statement:
      "\\det\\!\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc",
    context:
      "The determinant equals the signed area of the parallelogram spanned by the matrix's columns. The animation morphs the unit square through a shear (det 1), a stretch (det 3), a flip (det −1), and a collapse (det 0).",
    cinematic: {
      video: "/cache/videos/06_determinant.mp4",
    },
    transcript: {
      en: "The determinant of a 2 by 2 matrix is just a d minus b c. Geometrically it is the signed area of the parallelogram whose sides are the matrix's columns. The animation morphs a unit square through several matrices. A shear keeps the area at one. A stretch triples it. A flip makes the determinant negative — the matrix has reversed orientation. And a singular matrix collapses the square to a line, so the determinant drops to zero.",
      ar: "محدد المصفوفة 2 في 2 هو ببساطة ad - bc. الفكرة الهندسية: ده مساحة متوازي الأضلاع اللي أعمدته أضلاع المصفوفة. الفيديو بيمشّي مربع الوحدة في كذا تحويل: قَصّ بيخلّي المساحة 1، تمدّد بيضاعفها 3 مرات، انعكاس بيخلّي المحدد سالب يعني المصفوفة قلبت الاتجاه، وأخيرًا مصفوفة شاذة بتفلطح المربع لخط — المحدد يبقى صفر.",
    },
  },

  {
    id: "saddle",
    title: "Critical points of $z = ax^2 + by^2$",
    statement:
      "z = a x^2 + b y^2,\\qquad \\nabla z = (2ax,\\ 2by),\\qquad H = \\begin{pmatrix} 2a & 0 \\\\ 0 & 2b \\end{pmatrix}",
    context:
      "The origin is always a critical point of $z = ax^2 + by^2$. Whether it's a minimum, a maximum, or a saddle is decided by the signs of $a$ and $b$. The 3D playground below lets you spin the surface and morph through every case with the sliders.",
    cinematic: {
      video: "/cache/videos/07_saddle.mp4",
    },
    interactive3d: {
      fn: (x, y, { a, b }) => a * x * x + b * y * y,
      params: [
        { name: "a", label: "a", min: -2, max: 2, step: 0.05, default: 1 },
        { name: "b", label: "b", min: -2, max: 2, step: 0.05, default: -1 },
      ],
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-4, 4],
      resolution: 56,
      xLabel: "x",
      yLabel: "y",
      zLabel: "z",
      narrate: ({ a, b }, lang) => {
        const av = a.toFixed(2);
        const bv = b.toFixed(2);
        const both_pos = a > 0.05 && b > 0.05;
        const both_neg = a < -0.05 && b < -0.05;
        const opposite = a * b < -0.0025;
        if (lang === "ar") {
          if (both_pos)
            return `a = ${av}, b = ${bv}: الاتنين موجبين — يبقى وعاء، الأصل نقطة صغرى.`;
          if (both_neg)
            return `a = ${av}, b = ${bv}: الاتنين سالبين — يبقى قبّة، الأصل نقطة عظمى.`;
          if (opposite)
            return `a = ${av}, b = ${bv}: إشارتين متعاكستين — يبقى سرج، الأصل نقطة سرجية.`;
          return `a = ${av}, b = ${bv}: واحد منهم تقريبًا صفر — السطح بيتحوّل لقناة.`;
        }
        if (both_pos)
          return `a = ${av}, b = ${bv}: both positive — paraboloid bowl, origin is a minimum.`;
        if (both_neg)
          return `a = ${av}, b = ${bv}: both negative — upside-down dome, origin is a maximum.`;
        if (opposite)
          return `a = ${av}, b = ${bv}: opposite signs — saddle, origin is a saddle point.`;
        return `a = ${av}, b = ${bv}: one of them is near zero — surface flattens to a trough.`;
      },
    },
    transcript: {
      en: "The function z equals a x squared plus b y squared has its gradient vanishing exactly at the origin. So the origin is always a critical point — but what kind? The Hessian matrix tells us. If both a and b are positive, the surface curves up in every direction and the origin is a local minimum, a paraboloid bowl. If both are negative, every direction curves down and the origin is a maximum. If a and b have opposite signs the surface goes up one way and down the other — that's a saddle point. The cinematic shows the morph; the 3D playground below lets you grab the surface, rotate it, and slide a and b through every regime yourself.",
      ar: "الدالة z = a x² + b y² انحدارها بيساوي صفر عند نقطة الأصل بالظبط. يعني الأصل دايمًا نقطة حرجة — بس نوعها بيتحدد إزاي؟ من ماتريكس الـ Hessian. لو a و b الاتنين موجبين، السطح بيتقوّس لفوق في كل اتجاه، فالأصل قاع وعاء. لو الاتنين سالبين، السطح بيتقوّس لتحت، فالأصل قمّة قبّة. ولو إشارتهم مختلفة، السطح بيطلع في اتجاه وينزل في التاني — دي نقطة السرج. الفيديو بيوريك التحوّل، والنافذة الثلاثية الأبعاد تحتيها بتسمحلك تلفّ السطح بنفسك وتجرّب كل الحالات.",
    },
  },

  {
    id: "gaussian-integral",
    title: "The Gaussian integral $\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$",
    statement:
      "I \\;=\\; \\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx \\;=\\; \\sqrt{\\pi}",
    context:
      "The bell curve $e^{-x^2}$ has no elementary antiderivative, so you can't just integrate it. The trick: square the integral, turn it into a *double* integral over the plane, and switch to polar coordinates. The Jacobian gives you an extra $r$ that makes the polar integral elementary — and out pops $\\pi$, so the original integral is $\\sqrt{\\pi}$.",
    cinematic: {
      video: "/cache/videos/08_gaussian.mp4",
    },
    interactive3d: {
      fn: (x, y, { a }) => Math.exp(-a * (x * x + y * y)),
      params: [
        { name: "a", label: "spread a", min: 0.1, max: 2.5, step: 0.05, default: 1.0 },
      ],
      xRange: [-2.5, 2.5],
      yRange: [-2.5, 2.5],
      zRange: [0, 1.05],
      resolution: 60,
      xLabel: "x",
      yLabel: "y",
      zLabel: "z",
      narrate: ({ a }, lang) => {
        const v = a.toFixed(2);
        if (lang === "ar")
          return `a = ${v}: السطح e^{-a(x²+y²)} — كل ما a كبر، التل ضاق وعلى. التكامل المزدوج بيساوي π/a.`;
        return `a = ${v}: the surface e^{-a(x²+y²)} — bigger a, sharper peak. The double integral over R² equals π/a.`;
      },
    },
    transcript: {
      en: "We want the area under the bell curve e to the minus x squared, integrated from minus infinity to infinity. The function has no elementary antiderivative, so the usual tricks fail. Here's the move: call that integral I. Square it. Squaring turns it into a product of two single integrals — one in x, one in y — which is a double integral of e to the minus x squared minus y squared over the whole plane. Now switch to polar coordinates. The area element dA becomes r dr dtheta, and that extra r makes the inner integral suddenly elementary. The angular integral gives 2 pi, the radial integral gives one half, and the product is pi. So I squared equals pi, which means I equals the square root of pi.",
      ar: "عايزين نحسب المساحة تحت منحنى الجرس e^{-x²} من ناقص ما لا نهاية لـ ما لا نهاية. الدالة دي معندهاش مشتقة عكسية بالشكل المعتاد، فالطرق العادية مش هتشتغل. الحيلة: سمّي التكامل ده I. ربّعه. التربيع بيخلّي عندك تكامل لـ x مضروب في تكامل لـ y، يعني تكامل مزدوج لـ e^{-x²-y²} على المستوي كله. حوّل للإحداثيات القطبية: عنصر المساحة dA بيبقى r dr dθ، والـ r الإضافي ده بيخلّي التكامل الجوّاني سهل. التكامل في الزاوية بيدّيك 2π، التكامل في r بيدّيك نص، فالحاصل π. يبقى I² = π، ومنها I = √π.",
    },
  },

  {
    id: "normal-distribution",
    title: "The normal distribution $\\mathcal{N}(\\mu, \\sigma^2)$",
    statement:
      "f(x \\mid \\mu, \\sigma) \\;=\\; \\frac{1}{\\sigma\\sqrt{2\\pi}}\\, e^{-(x - \\mu)^2 / (2\\sigma^2)}",
    context:
      "Take the Gaussian integral, normalise it to area 1, then shift it by $\\mu$ and scale it by $\\sigma$. That's the normal distribution. The mean $\\mu$ slides the bell left or right; the standard deviation $\\sigma$ stretches it wide or pulls it narrow. The area always stays 1 — that's the $\\sqrt{\\pi}$ from the previous theorem doing its job.",
    cinematic: {
      video: "/cache/videos/09_normal.mp4",
    },
    interactive: {
      fn: (x, { mu, sigma }) =>
        Math.exp(-Math.pow(x - mu, 2) / (2 * sigma * sigma)) /
        (sigma * Math.sqrt(2 * Math.PI)),
      params: [
        { name: "mu", label: "mean μ", min: -3, max: 3, step: 0.05, default: 0 },
        { name: "sigma", label: "std σ", min: 0.3, max: 3, step: 0.05, default: 1 },
      ],
      xRange: [-6, 6],
      yRange: [0, 1.4],
      xLabel: "x",
      yLabel: "f(x)",
      narrate: ({ mu, sigma }, lang) => {
        const m = mu.toFixed(2);
        const s = sigma.toFixed(2);
        if (lang === "ar")
          return `μ = ${m}, σ = ${s}: المنحنى مركزه عند ${m} وعرضه ${s}. المساحة تحته دايمًا = 1.`;
        return `μ = ${m}, σ = ${s}: bell centered at ${m}, width ${s}. Area under the curve is always 1.`;
      },
    },
    transcript: {
      en: "The normal distribution is what you get when you take the Gaussian bell curve, normalise its area to one, then let yourself shift and stretch it. The mean mu controls where the peak sits — slide mu and the whole bell glides left or right. The standard deviation sigma controls how spread out the bell is — small sigma gives a sharp tall spike, large sigma gives a wide gentle hill. The crucial property: no matter what mu and sigma you pick, the total area under the curve is exactly one. That's why this is a probability distribution.",
      ar: "التوزيع الطبيعي هو لما تاخد منحنى جاوس وتظبّط مساحته على واحد، وبعدين تخلّي نفسك تزحلقه وتمدّه. المتوسط μ بيتحكّم في مكان قمة المنحنى — حرّك μ والمنحنى كله يزحف يمين أو شمال. الانحراف المعياري σ بيتحكّم في عرضه — σ صغيّر يدّيك قمّة رفيعة عالية، σ كبير يدّيك تلّ واسع. أهم حاجة: مهما اخترت μ و σ، المساحة تحت المنحنى دايمًا تساوي واحد. ده اللي بيخلّيه توزيع احتمالي.",
    },
  },

  {
    id: "poisson-exp-gamma",
    title: "Poisson, exponential, and gamma — one process, three distributions",
    statement:
      "N \\sim \\text{Poisson}(\\lambda T),\\quad X \\sim \\text{Exp}(\\lambda),\\quad T_k \\sim \\text{Gamma}(k, \\lambda)",
    context:
      "All three live on the same Poisson process — a timeline of random events arriving at rate $\\lambda$. Count the events in a window of length $T$ and you get $\\text{Poisson}(\\lambda T)$. Measure the gap between two consecutive events and you get $\\text{Exp}(\\lambda)$. Sum $k$ such gaps — equivalently, wait for the $k$-th event — and you get $\\text{Gamma}(k, \\lambda)$.",
    cinematic: {
      video: "/cache/videos/12_poisson_exp_gamma.mp4",
    },
    transcript: {
      en: "Imagine a timeline of random events — phone calls arriving at a switchboard, raindrops hitting a window, customers entering a store — all governed by a single rate lambda. The Poisson process is what we call this picture. Now from that one timeline we can read off three completely different-looking distributions. First: count how many events fall inside a window of length T. The number is random, and it follows the Poisson distribution with parameter lambda T. Second: instead of counting events, measure the gap between two consecutive ones. That waiting time follows the exponential distribution with parameter lambda. Third: don't stop at the next event — wait for the k-th event. The time you've waited is the sum of k independent exponential gaps, and that sum follows the gamma distribution. So Poisson counts, exponential measures one gap, gamma measures the sum of k gaps. One process, three distributions, all tied together by the same lambda.",
      ar: "تخيّل خط زمني عليه أحداث عشوائية — مكالمات تليفون داخلة على سنترال، نقط مطر بتوقع على شباك، عملاء داخلين محل — كلها بتحصل بمعدّل واحد اسمه لامدا. ده اسمه عملية بواسون. من نفس الصورة دي ممكن نطلّع تلات توزيعات مختلفة خالص. الأول: عدّ كم حدث وقع جوّه نافذة طولها T. العدد ده عشوائي، وبيتبع توزيع بواسون بمعامل لامدا في T. التاني: بدل ما نعد، قيس الفرق الزمني بين حدثين ورا بعض. الفرق ده بيتبع التوزيع الأسّي بمعامل لامدا. التالت: مش هنوقف عند الحدث اللي بعده — انتظر لحد الحدث رقم k. الوقت اللي استنّيته هو مجموع k فروق أسّية مستقلة، والمجموع ده بيتبع توزيع جاما. يعني بواسون بيعدّ، الأسّي بيقيس فرق واحد، وجاما بتقيس مجموع k فرق. عملية واحدة، تلات توزيعات، كلهم مربوطين بنفس لامدا.",
    },
  },
];

export const theoremById = (id: string) => theorems.find((t) => t.id === id);
