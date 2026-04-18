// Loading-screen content shown while the fake "generation" progress bar is
// running. Mix of:
//   • inspirational quotes (Greek, Chinese, Japanese, science traditions)
//   • rapid-fire mental-math problems suitable for ~10 seconds
//
// Math problems include $...$ delimiters so the host component can render
// them via MathText (KaTeX). Plain quotes pass through unchanged.

export type Quote = { text: string; attr: string };

const QUOTES: Quote[] = [
  // Greek
  { text: "All men by nature desire to know.", attr: "Aristotle" },
  { text: "The unexamined life is not worth living.", attr: "Socrates" },
  { text: "Wonder is the beginning of wisdom.", attr: "Socrates" },
  { text: "Give me a lever long enough and a place to stand, and I shall move the world.", attr: "Archimedes" },
  { text: "There is no royal road to geometry.", attr: "Euclid" },
  { text: "Geometry is knowledge of the eternally existent.", attr: "Plato" },
  { text: "Number rules the universe.", attr: "Pythagoras" },

  // Chinese
  { text: "Learning without thought is labor lost; thought without learning is perilous.", attr: "Confucius" },
  { text: "It does not matter how slowly you go, as long as you do not stop.", attr: "Confucius" },
  { text: "Real knowledge is to know the extent of one's ignorance.", attr: "Confucius" },
  { text: "The journey of a thousand miles begins with a single step.", attr: "Lao Tzu" },
  { text: "Tell me and I forget, show me and I may remember, involve me and I understand.", attr: "Xunzi (attributed)" },

  // Japanese
  { text: "Fall seven times, stand up eight.", attr: "Japanese proverb" },
  { text: "Vision without action is a daydream. Action without vision is a nightmare.", attr: "Japanese proverb" },
  { text: "If you understand everything, you must be misinformed.", attr: "Japanese proverb" },

  // Science & Math
  { text: "Mathematics is the queen of the sciences.", attr: "Carl Friedrich Gauss" },
  { text: "If I have seen further, it is by standing on the shoulders of giants.", attr: "Isaac Newton" },
  { text: "Imagination is more important than knowledge.", attr: "Albert Einstein" },
  { text: "Pure mathematics is, in its way, the poetry of logical ideas.", attr: "Albert Einstein" },
  { text: "What I cannot create, I do not understand.", attr: "Richard Feynman" },
  { text: "Read Euler, read Euler — he is the master of us all.", attr: "Pierre-Simon Laplace" },
  { text: "Be less curious about people and more curious about ideas.", attr: "Marie Curie" },
  { text: "Mathematics is the language in which God has written the universe.", attr: "Galileo Galilei" },
  { text: "An expert is one who has made all the mistakes that can be made in a very narrow field.", attr: "Niels Bohr" },
  { text: "Everything should be made as simple as possible, but not simpler.", attr: "Albert Einstein" },
  { text: "The only way to learn mathematics is to do mathematics.", attr: "Paul Halmos" },
];

// ─────────────────────────── Math problems ────────────────────────────────

const RAPID = "Rapid fire — try it before the bar fills";
const SQUARES_LABEL = "Perfect square — go!";
const DERIV_LABEL = "Derivative drill — name it";
const INT_LABEL = "Integration drill — solve in your head";

function randInt(lo: number, hi: number) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

// ── Two-digit arithmetic ──────────────────────────────────────────────────
function arithmeticProblem(): Quote {
  const op = pick(["+", "-", "×", "÷"] as const);
  let prompt: string;
  if (op === "+") {
    prompt = `${randInt(10, 99)} + ${randInt(10, 99)}`;
  } else if (op === "-") {
    const a = randInt(40, 99);
    const b = randInt(10, a - 1);
    prompt = `${a} - ${b}`;
  } else if (op === "×") {
    // Mix easier and harder: 2-digit × small, or two low-2-digit
    if (Math.random() < 0.55) {
      prompt = `${randInt(11, 99)} \\times ${randInt(2, 9)}`;
    } else {
      prompt = `${randInt(11, 25)} \\times ${randInt(11, 25)}`;
    }
  } else {
    const divisor = randInt(2, 12);
    const quotient = randInt(5, 30);
    prompt = `${divisor * quotient} \\div ${divisor}`;
  }
  return { text: `$${prompt} = \\;?$`, attr: RAPID };
}

// ── Square roots of perfect squares from 2 to 30 ──────────────────────────
function squareRootProblem(): Quote {
  const n = randInt(2, 30);
  const sq = n * n;
  // Half the time ask the square, half the time ask the square root
  if (Math.random() < 0.5) {
    return { text: `$\\sqrt{${sq}} = \\;?$`, attr: SQUARES_LABEL };
  }
  return { text: `$${n}^2 = \\;?$`, attr: SQUARES_LABEL };
}

// ── Derivative one-liners ────────────────────────────────────────────────
const DERIVATIVES: string[] = [
  "\\frac{d}{dx}\\bigl(e^x\\bigr)",
  "\\frac{d}{dx}\\bigl(e^{2x}\\bigr)",
  "\\frac{d}{dx}\\bigl(\\ln x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\sin x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\cos x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\tan x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\sec x\\bigr)",
  "\\frac{d}{dx}\\bigl(x^7\\bigr)",
  "\\frac{d}{dx}\\bigl(x^{-2}\\bigr)",
  "\\frac{d}{dx}\\bigl(\\sqrt{x}\\bigr)",
  "\\frac{d}{dx}\\bigl(\\arcsin x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\arctan x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\sinh x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\cosh x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\tanh x\\bigr)",
  "\\frac{d}{dx}\\bigl(a^x\\bigr)",
  "\\frac{d}{dx}\\bigl(\\log_{10} x\\bigr)",
];
function derivativeProblem(): Quote {
  return { text: `$${pick(DERIVATIVES)} = \\;?$`, attr: DERIV_LABEL };
}

// ── Integration one-liners (indefinite + simple definite) ────────────────
const INDEFINITE: string[] = [
  "\\int x^3 \\, dx",
  "\\int x^{-2} \\, dx",
  "\\int e^x \\, dx",
  "\\int e^{2x} \\, dx",
  "\\int \\frac{1}{x} \\, dx",
  "\\int \\cos x \\, dx",
  "\\int \\sin x \\, dx",
  "\\int \\sec^2 x \\, dx",
  "\\int \\sinh x \\, dx",
  "\\int \\frac{1}{1+x^2} \\, dx",
  "\\int \\frac{1}{\\sqrt{1-x^2}} \\, dx",
];
const DEFINITE: string[] = [
  "\\int_0^1 x \\, dx",
  "\\int_0^1 x^2 \\, dx",
  "\\int_0^1 e^x \\, dx",
  "\\int_0^\\pi \\sin x \\, dx",
  "\\int_0^{\\pi/2} \\cos x \\, dx",
  "\\int_1^e \\frac{1}{x} \\, dx",
  "\\int_{-1}^{1} x^2 \\, dx",
];
function integralProblem(): Quote {
  const expr = Math.random() < 0.5 ? pick(INDEFINITE) : pick(DEFINITE);
  return { text: `$${expr} = \\;?$`, attr: INT_LABEL };
}

// ── Mixer: weighted random pull from quotes + every math category ───────
type Generator = () => Quote;
const GENERATORS: { weight: number; gen: Generator }[] = [
  { weight: 3, gen: () => pick(QUOTES) },
  { weight: 2, gen: arithmeticProblem },
  { weight: 1, gen: squareRootProblem },
  { weight: 2, gen: derivativeProblem },
  { weight: 2, gen: integralProblem },
];
const TOTAL_WEIGHT = GENERATORS.reduce((s, g) => s + g.weight, 0);

function pickFromMix(): Quote {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const g of GENERATORS) {
    r -= g.weight;
    if (r <= 0) return g.gen();
  }
  return GENERATORS[0].gen();
}

export function randomQuote(prev?: Quote): Quote {
  let q = pickFromMix();
  let tries = 0;
  while (prev && q.text === prev.text && tries < 5) {
    q = pickFromMix();
    tries++;
  }
  return q;
}
