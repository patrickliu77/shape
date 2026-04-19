import type { Theorem } from "../types";
import { TheoremBlock } from "./TheoremBlock";
import { FormalDefinition } from "./FormalDefinition";
import { useT } from "../lib/translate";
import { useTextbookLibrary } from "../lib/library";

type Props = {
  theorems: Theorem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

type FormalKind =
  | "Definition"
  | "Theorem"
  | "Proposition"
  | "Corollary"
  | "Lemma";

type Section = {
  heading: string;
  // Formal textbook-style statement — the kind a student would actually
  // encounter in the printed page. Dense, formal, hard to parse on first read.
  formal: { kind: FormalKind; name?: string; body: string };
  // Friendly prose intro that lives *inside* the tappable box, above the
  // simplified statement. Stored as a plain string with $...$ math markup
  // so it can be auto-translated by Claude when the student picks a
  // non-English language.
  intro: string;
  theoremIndex: number;
};

type ChapterDef = {
  number: number;
  title: string;
  blurb: string;
  sections: Section[];
};

const CHAPTERS: ChapterDef[] = [
  {
    number: 1,
    title: "Limits",
    blurb:
      "Calculus begins with a single question: what does it mean for a quantity to approach a value? The ε–δ definition makes that question precise and gives every later idea a foundation.",
    sections: [
      {
        heading: "1.1 The ε–δ definition",
        formal: {
          kind: "Definition",
          body:
            "Let $f$ be a real-valued function defined on an open interval containing $a$, except possibly at $a$ itself. We say that $\\lim_{x \\to a} f(x) = L$ if for every $\\varepsilon > 0$ there exists $\\delta > 0$ such that, for all $x$ in the domain of $f$, $$0 < |x - a| < \\delta \\;\\implies\\; |f(x) - L| < \\varepsilon.$$",
        },
        intro:
          "Before we can speak of derivatives, we need to say precisely what it means for a function to approach a value. Tap to see the ε–δ definition unpacked visually.",
        theoremIndex: 0,
      },
    ],
  },
  {
    number: 2,
    title: "Derivatives",
    blurb:
      "The derivative turns the limit into a tool: an instantaneous rate of change. We build it from a secant line, learn how it composes through the chain rule, and meet the differential equations whose solutions it generates.",
    sections: [
      {
        heading: "2.1 The derivative",
        formal: {
          kind: "Definition",
          body:
            "Let $f$ be defined on an open interval containing $a$. The derivative of $f$ at $a$ is $$f'(a) \\;=\\; \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h},$$ provided this limit exists. If it does, $f$ is said to be differentiable at $a$.",
        },
        intro:
          "The derivative of a function at a point measures the instantaneous rate of change. Geometrically, it is the slope of the tangent line, obtained as a limit of slopes of secant lines.",
        theoremIndex: 1,
      },
      {
        heading: "2.2 The chain rule",
        formal: {
          kind: "Theorem",
          name: "Chain Rule",
          body:
            "Let $g$ be differentiable at $a$ and let $f$ be differentiable at $g(a)$. Then the composite $f \\circ g$ is differentiable at $a$, and $$(f \\circ g)'(a) \\;=\\; f'\\!\\bigl(g(a)\\bigr)\\, g'(a).$$",
        },
        intro:
          "Most useful functions are built by composing simpler ones. The chain rule tells us exactly how the derivative of a composition decomposes.",
        theoremIndex: 2,
      },
      {
        heading: "2.3 Differential equations — a first taste",
        formal: {
          kind: "Theorem",
          body:
            "For any constant $a \\in \\mathbb{R}$, the unique solution of the initial value problem $$y'(t) = a\\, y(t), \\qquad y(0) = 1$$ on $\\mathbb{R}$ is $y(t) = e^{a t}$. More generally, the general solution of $y' = a y$ is $y(t) = C e^{a t}$ for an arbitrary constant $C \\in \\mathbb{R}$.",
        },
        intro:
          "A differential equation relates a function to its own derivative. The simplest and most important is $y' = a\\,y$, whose solution is the exponential. Try the slider below to feel how a single parameter governs an entire family of behaviours.",
        theoremIndex: 3,
      },
      {
        heading: "2.4 Damped oscillation",
        formal: {
          kind: "Theorem",
          body:
            "For constants $\\gamma > 0$ and $\\omega > 0$, every real-valued solution of $$\\ddot{y}(t) + 2\\gamma\\, \\dot{y}(t) + (\\gamma^2 + \\omega^2)\\, y(t) = 0$$ on $\\mathbb{R}$ is of the form $y(t) = e^{-\\gamma t}\\bigl(A \\cos \\omega t + B \\sin \\omega t\\bigr)$ for some constants $A, B \\in \\mathbb{R}$.",
        },
        intro:
          "Add a restoring force and a little friction, and the same ideas produce a damped oscillator — the mathematics of a pendulum, a loudspeaker, or an electrical circuit.",
        theoremIndex: 4,
      },
    ],
  },
  {
    number: 3,
    title: "Complex numbers",
    blurb:
      "Step off the real line and onto the complex plane. Multiplication becomes rotation, powers become repeated spins, and a single identity ties it all together.",
    sections: [
      {
        heading: "3.1 De Moivre's theorem",
        formal: {
          kind: "Theorem",
          name: "De Moivre",
          body:
            "For every $\\theta \\in \\mathbb{R}$ and every integer $n \\in \\mathbb{Z}$, $$(\\cos\\theta + i\\sin\\theta)^{n} \\;=\\; \\cos(n\\theta) + i\\sin(n\\theta).$$",
        },
        intro:
          "A complex number on the unit circle, $\\cos\\theta + i\\sin\\theta$, is really just an angle. Multiplying two of them adds their angles, so raising one to the $n$-th power multiplies the angle by $n$. That is De Moivre's theorem.",
        theoremIndex: 5,
      },
    ],
  },
  {
    number: 4,
    title: "Double integration",
    blurb:
      "Single integrals add up area under a curve. Double integrals add up volume under a surface. The construction is the same — a Riemann sum that tightens to a limit — but in two dimensions the geometry comes alive.",
    sections: [
      {
        heading: "4.1 The double integral",
        formal: {
          kind: "Definition",
          body:
            "Let $f : R \\to \\mathbb{R}$ be a bounded function on a bounded region $R \\subset \\mathbb{R}^{2}$. Partition $R$ by an axis-aligned grid of width $\\Delta x$ and height $\\Delta y$, and select a sample point $(x_{i}^{*}, y_{j}^{*})$ in each cell. The double integral of $f$ over $R$ is $$\\iint_{R} f(x, y)\\,dA \\;=\\; \\lim_{\\Delta x,\\, \\Delta y \\to 0} \\sum_{i, j} f(x_{i}^{*},\\, y_{j}^{*})\\,\\Delta x\\,\\Delta y,$$ provided this limit exists and is independent of the choice of partition and sample points.",
        },
        intro:
          "A double integral measures volume the same way a single integral measures area. The cleanest definition slices the region into a grid, stacks a prism on each tiny square, and sends the grid size to zero — the limit of those sums is the integral itself.",
        theoremIndex: 6,
      },
    ],
  },
  {
    number: 5,
    title: "Linear algebra",
    blurb:
      "Linear maps act on geometry. A matrix takes one shape to another, and a single number — the determinant — captures how much area, volume, and orientation it has rearranged.",
    sections: [
      {
        heading: "5.1 Determinants",
        formal: {
          kind: "Definition",
          body:
            "The determinant of a $2 \\times 2$ matrix $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ is the scalar $$\\det A \\;=\\; ad - bc.$$ The map $A : \\mathbb{R}^{2} \\to \\mathbb{R}^{2}$ scales every area by $|\\det A|$, and reverses orientation if and only if $\\det A < 0$. The map is invertible iff $\\det A \\neq 0$.",
        },
        intro:
          "A linear map sends squares to parallelograms. The determinant tells you exactly how much the area changes — and whether orientation flips along the way.",
        theoremIndex: 7,
      },
    ],
  },
  {
    number: 6,
    title: "Multivariable optimization",
    blurb:
      "With more than one input variable, a flat gradient is no longer enough — the second derivative becomes a matrix, and the geometry of bowls, domes, and saddles takes over.",
    sections: [
      {
        heading: "6.1 Critical points in 3D",
        formal: {
          kind: "Theorem",
          name: "Second Derivative Test",
          body:
            "Let $f \\in C^{2}(\\mathbb{R}^{2})$ have a critical point at $(x_{0}, y_{0})$, i.e.\\ $\\nabla f(x_{0}, y_{0}) = 0$, and let $H = \\begin{pmatrix} f_{xx} & f_{xy} \\\\ f_{xy} & f_{yy} \\end{pmatrix}$ denote its Hessian at that point. Then $(x_{0}, y_{0})$ is a local minimum if $\\det H > 0$ and $f_{xx} > 0$; a local maximum if $\\det H > 0$ and $f_{xx} < 0$; and a saddle point if $\\det H < 0$.",
        },
        intro:
          "With two input variables the picture really needs three dimensions. The surface $z = ax^2 + by^2$ is the cleanest place to meet the trio of multivariable critical points: minimum, maximum, and saddle. Open the panel — there's a real 3D mesh you can rotate.",
        theoremIndex: 8,
      },
    ],
  },
  {
    number: 7,
    title: "Probability theory",
    blurb:
      "The bell curve is everywhere — heights, errors, IQ scores, stock returns. To understand why, we first compute its total area with a beautiful trick, then turn it into the most important distribution in statistics.",
    sections: [
      {
        heading: "7.1 The Gaussian integral",
        formal: {
          kind: "Theorem",
          body:
            "The improper integral of $e^{-x^{2}}$ over the whole real line converges, with $$\\int_{-\\infty}^{\\infty} e^{-x^{2}}\\, dx \\;=\\; \\sqrt{\\pi}.$$",
        },
        intro:
          "The bell curve $e^{-x^2}$ refuses to be integrated by the usual tricks — it has no elementary antiderivative. But you can still find its area, by a beautiful sleight of hand: square the integral, turn it into a double integral on the plane, and switch to polar coordinates. The answer is $\\sqrt{\\pi}$.",
        theoremIndex: 9,
      },
      {
        heading: "7.2 The normal distribution",
        formal: {
          kind: "Definition",
          body:
            "A real-valued random variable $X$ is said to have the normal distribution with mean $\\mu \\in \\mathbb{R}$ and variance $\\sigma^{2} > 0$, written $X \\sim \\mathcal{N}(\\mu, \\sigma^{2})$, if its probability density function is $$f(x) \\;=\\; \\frac{1}{\\sigma \\sqrt{2\\pi}}\\, \\exp\\!\\left(-\\frac{(x - \\mu)^{2}}{2\\sigma^{2}}\\right), \\qquad x \\in \\mathbb{R}.$$",
        },
        intro:
          "Take the Gaussian integral, normalise it to area $1$, and shift/scale it: that's the normal distribution. The mean $\\mu$ slides the bell, the standard deviation $\\sigma$ stretches it. The $\\sqrt{\\pi}$ from the previous section is exactly what makes the area come out to one.",
        theoremIndex: 10,
      },
      {
        heading: "7.3 Poisson, exponential, and gamma",
        formal: {
          kind: "Definition",
          body:
            "A counting process $\\{N(t) : t \\ge 0\\}$ is a Poisson process with rate $\\lambda > 0$ if $N(0) = 0$, it has stationary independent increments, and for every $s, t \\ge 0$ and $k = 0, 1, 2, \\ldots$, $$P\\bigl(N(s + t) - N(s) = k\\bigr) \\;=\\; \\frac{(\\lambda t)^{k}\\, e^{-\\lambda t}}{k!}.$$ Its inter-arrival times $X_{1}, X_{2}, \\ldots$ are i.i.d.\\ with $X_{i} \\sim \\mathrm{Exp}(\\lambda)$, and the arrival time of the $k$-th event $T_{k} = X_{1} + \\cdots + X_{k}$ satisfies $T_{k} \\sim \\mathrm{Gamma}(k, \\lambda)$.",
        },
        intro:
          "All three distributions live on the same picture: a single timeline of randomly occurring events with rate $\\lambda$. Count the events in a window — that's $\\text{Poisson}(\\lambda T)$. Measure the gap between two consecutive events — that's $\\text{Exp}(\\lambda)$. Wait for the $k$-th event — that's $\\text{Gamma}(k, \\lambda)$. One process, three distributions, all tied together.",
        theoremIndex: 11,
      },
    ],
  },
];

function ChapterView({
  ch,
  firstChapter,
  theorems,
  activeId,
  onSelect,
}: {
  ch: ChapterDef;
  firstChapter: boolean;
  theorems: Theorem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  // In `popup` scope these calls return the English original; in `full`
  // scope they fetch translations from the language filter.
  const tTitle = useT(ch.title);
  const tBlurb = useT(ch.blurb);
  const tChapterWord = useT("Chapter");
  return (
    <div>
      <header
        className={
          firstChapter
            ? "mb-10 border-b border-stone-300 dark:border-stone-700 pb-6"
            : "mt-16 mb-10 border-b border-stone-300 dark:border-stone-700 pb-6"
        }
      >
        <div className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-2">
          {tChapterWord} {ch.number}
        </div>
        <h1 className="text-4xl font-semibold text-ink dark:text-stone-100 mb-2">
          {tTitle}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 italic">{tBlurb}</p>
      </header>

      <section className="space-y-2">
        {ch.sections.map((s, si) => {
          const th = theorems[s.theoremIndex];
          return (
            <SectionView
              key={s.heading}
              section={s}
              firstSection={si === 0}
              theorem={th}
              active={activeId === th.id}
              onSelect={onSelect}
            />
          );
        })}
      </section>
    </div>
  );
}

function SectionView({
  section,
  firstSection,
  theorem,
  active,
  onSelect,
}: {
  section: Section;
  firstSection: boolean;
  theorem: Theorem;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const tHeading = useT(section.heading);
  return (
    <div>
      <h2
        className={
          firstSection
            ? "text-2xl font-semibold mt-8 mb-3"
            : "text-2xl font-semibold mt-10 mb-3"
        }
      >
        {tHeading}
      </h2>
      <FormalDefinition
        kind={section.formal.kind}
        name={section.formal.name}
        body={section.formal.body}
      />
      <TheoremBlock
        theorem={theorem}
        introText={section.intro}
        onTap={() => onSelect(theorem.id)}
        active={active}
      />
    </div>
  );
}

export function Textbook({ theorems, activeId, onSelect }: Props) {
  // When the active library entry is an imported PDF, we stitch its
  // chapters into the same {chapters → sections → theoremIndex} shape and
  // render through the same ChapterView/SectionView code.
  const { activeImported: imported, importedTheorems, active } = useTextbookLibrary();

  if (imported) {
    // Build a Theorem[] indexed by the section's theorem id so the existing
    // SectionView code (which looks up by theoremIndex) keeps working.
    const usedTheorems = importedTheorems;
    const idToIndex = new Map(usedTheorems.map((t, i) => [t.id, i]));

    const importedChapters: ChapterDef[] = imported.chapters.map((ch) => ({
      number: ch.number,
      title: ch.title,
      blurb: ch.blurb,
      sections: ch.sections.map((s) => ({
        heading: s.heading,
        formal: {
          kind: s.formal.kind,
          name: s.formal.name ?? undefined,
          body: s.formal.body,
        },
        intro: s.intro,
        theoremIndex: idToIndex.get(s.theorem.id) ?? 0,
      })),
    }));

    const sourceName = active?.name ?? imported.source;
    return (
      <article className="textbook max-w-2xl mx-auto px-10 py-12 bg-paper dark:bg-[#1a1726] dark:text-stone-200 shadow-sm rounded-md my-6 transition-colors">
        {sourceName && (
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-6 font-sans">
            Imported from <span className="text-accent dark:text-violet-300">{sourceName}</span>
          </div>
        )}
        {importedChapters.map((ch, ci) => (
          <ChapterView
            key={ch.number}
            ch={ch}
            firstChapter={ci === 0}
            theorems={usedTheorems}
            activeId={activeId}
            onSelect={onSelect}
          />
        ))}
      </article>
    );
  }

  return (
    <article className="textbook max-w-2xl mx-auto px-10 py-12 bg-paper dark:bg-[#1a1726] dark:text-stone-200 shadow-sm rounded-md my-6 transition-colors">
      {CHAPTERS.map((ch, ci) => (
        <ChapterView
          key={ch.number}
          ch={ch}
          firstChapter={ci === 0}
          theorems={theorems}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </article>
  );
}
