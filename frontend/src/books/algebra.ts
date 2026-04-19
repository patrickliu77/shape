// Middle-school Algebra textbook. Each theorem points to a Manim cinematic
// rendered into cache/videos/alg_*.mp4 by scripts/build_cache.py.

import type { Theorem } from "../types";
import type { BuiltinBook, ChapterDef } from "./types";

export const ALGEBRA_THEOREMS: Theorem[] = [
  {
    id: "alg-distributive",
    title: "The distributive property",
    statement: "a(b + c) = a b + a c",
    context:
      "Multiplying by a sum is the same as multiplying by each piece and adding the results. Picture a rectangle of width $a$ split into two strips.",
    cinematic: { video: "/cache/videos/alg_01_distributive.mp4" },
    transcript: {
      en: "Imagine a rectangle of width a and height b plus c. Its area is the width times the total height — that's a times b plus c. Now slice the rectangle horizontally into two strips: one of height b, one of height c. The top strip has area a times b. The bottom strip has area a times c. The total area didn't change — we just split it. So a times b plus c equals a b plus a c. That is the distributive property, and it is the engine that drives almost every algebra step you'll ever take.",
    },
  },
  {
    id: "alg-difference-of-squares",
    title: "Difference of squares",
    statement: "a^2 - b^2 = (a - b)(a + b)",
    context:
      "Cut a small square out of a big square. The leftover shape can be rearranged into a single rectangle whose sides are the sum and the difference of the originals.",
    cinematic: { video: "/cache/videos/alg_02_diff_squares.mp4" },
    transcript: {
      en: "Take a square of side a, and remove a smaller square of side b from one corner. The leftover area is a squared minus b squared. Now grab the L-shape that's left, cut along its corner, and rearrange the two pieces side by side. You get a single rectangle. Its long side is a plus b, its short side is a minus b. So a squared minus b squared equals a minus b times a plus b. This identity is everywhere in algebra — once you see it, you'll factor faster than you ever thought possible.",
    },
  },
  {
    id: "alg-linear-equation",
    title: "Solving a linear equation",
    statement: "ax + b = c \\;\\Longrightarrow\\; x = \\frac{c - b}{a}",
    context:
      "An equation is a balance scale. Whatever you do to one side, you must do to the other. Strip away the constants, then divide by the coefficient.",
    cinematic: { video: "/cache/videos/alg_03_linear_eq.mp4" },
    transcript: {
      en: "Think of an equation as a balance scale. The two sides have to weigh the same. To find x, we strip away everything around it. First, subtract b from both sides — the b on the left disappears, and the right side becomes c minus b. Now the equation says a times x equals c minus b. Divide both sides by a, and we are done: x equals c minus b, all over a. The trick is always the same: keep the scale balanced, isolate x.",
    },
  },
  {
    id: "alg-slope-intercept",
    title: "Slope-intercept form of a line",
    statement: "y = m x + b",
    context:
      "Every straight line on a graph is captured by two numbers: its slope $m$ (how steep it tilts) and its $y$-intercept $b$ (where it crosses the vertical axis).",
    cinematic: { video: "/cache/videos/alg_04_slope_intercept.mp4" },
    transcript: {
      en: "Every straight line you can draw on a graph is described by just two numbers. The slope, m, tells you how steep the line is — how much y changes for every step you take to the right. The y-intercept, b, tells you where the line crosses the vertical axis. Put them together and you get y equals m x plus b. Change m and the line tilts. Change b and the line slides up or down. Two numbers, infinite lines.",
    },
  },
  {
    id: "alg-quadratic",
    title: "The quadratic formula",
    statement: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    context:
      "A parabola crosses the x-axis at the roots of $ax^2 + bx + c = 0$. The quadratic formula gives both roots in one stroke — the discriminant inside the square root tells you whether they're real, repeated, or complex.",
    cinematic: { video: "/cache/videos/alg_05_quadratic.mp4" },
    transcript: {
      en: "A quadratic equation is a x squared plus b x plus c equals zero. Its graph is a parabola — a U-shaped curve. The places where the parabola crosses the x-axis are the solutions to the equation. The quadratic formula gives both of them at once: x equals minus b plus or minus the square root of b squared minus four a c, all over two a. The piece under the square root is called the discriminant. If it's positive, you get two real solutions. If it's zero, the parabola just kisses the axis — one solution. If it's negative, the parabola misses the axis and the solutions live in the complex numbers.",
    },
  },
];

export const ALGEBRA_CHAPTERS: ChapterDef[] = [
  {
    number: 1,
    title: "Algebraic identities",
    blurb:
      "Algebra runs on a small handful of identities — true equations that hold no matter what numbers you plug in. Master these two and most of school algebra opens up.",
    sections: [
      {
        heading: "1.1 The distributive property",
        formal: {
          kind: "Theorem",
          name: "Distributivity",
          body:
            "For all real numbers $a$, $b$, $c$, $$a(b + c) = a b + a c.$$",
        },
        intro:
          "Multiplying by a sum equals multiplying by each piece and adding the results. The visualization decomposes a rectangle into two strips so the identity is literally an area equation.",
        theoremIndex: 0,
      },
      {
        heading: "1.2 Difference of squares",
        formal: {
          kind: "Theorem",
          body:
            "For all real numbers $a$ and $b$, $$a^{2} - b^{2} = (a - b)(a + b).$$",
        },
        intro:
          "Cut a small square out of a big square; the L-shaped leftover can be rearranged into a rectangle. Once you see this picture, you'll factor any difference of squares on sight.",
        theoremIndex: 1,
      },
    ],
  },
  {
    number: 2,
    title: "Equations",
    blurb:
      "Solving an equation is finding the value(s) of the unknown that make both sides equal. The recipes are different for linear and quadratic equations, but the spirit is the same: keep the balance.",
    sections: [
      {
        heading: "2.1 Linear equations",
        formal: {
          kind: "Theorem",
          body:
            "If $a \\neq 0$, the unique solution of $a x + b = c$ is $$x = \\frac{c - b}{a}.$$",
        },
        intro:
          "Treat the equation as a balance scale. Subtract $b$ from both sides, then divide by $a$ — the unknown $x$ is uncovered.",
        theoremIndex: 2,
      },
      {
        heading: "2.2 The quadratic formula",
        formal: {
          kind: "Theorem",
          body:
            "If $a \\neq 0$, the solutions of $a x^{2} + b x + c = 0$ are $$x = \\frac{-b \\pm \\sqrt{b^{2} - 4 a c}}{2 a}.$$ The expression $b^{2} - 4 a c$ is the *discriminant*: the equation has two real solutions when it is positive, one repeated real solution when it is zero, and a complex-conjugate pair when it is negative.",
        },
        intro:
          "Every quadratic equation can be solved in one stroke with this formula. The piece under the square root — the discriminant — tells you ahead of time how many real solutions to expect.",
        theoremIndex: 4,
      },
    ],
  },
  {
    number: 3,
    title: "Linear functions",
    blurb:
      "Lines on a graph are the simplest functions in the world — and the most useful. Two numbers describe any line: how steep it is, and where it crosses the vertical axis.",
    sections: [
      {
        heading: "3.1 Slope-intercept form",
        formal: {
          kind: "Definition",
          body:
            "A non-vertical line in the plane can be written in *slope-intercept form* as $$y = m x + b,$$ where $m$ is the slope (the change in $y$ per unit change in $x$) and $b$ is the $y$-intercept (the value of $y$ when $x = 0$).",
        },
        intro:
          "Two knobs control every straight line: the slope $m$ tilts it, the intercept $b$ slides it up or down. Watch the visualization sweep through both.",
        theoremIndex: 3,
      },
    ],
  },
];

export const algebraBook: BuiltinBook = {
  id: "algebra",
  name: "Algebra (Middle School)",
  theorems: ALGEBRA_THEOREMS,
  chapters: ALGEBRA_CHAPTERS,
};
