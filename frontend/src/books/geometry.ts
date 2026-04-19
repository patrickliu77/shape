// Middle-school Geometry textbook. Each theorem points to a Manim cinematic
// rendered into cache/videos/geom_*.mp4 by scripts/build_cache.py.

import type { Theorem } from "../types";
import type { BuiltinBook, ChapterDef } from "./types";

export const GEOMETRY_THEOREMS: Theorem[] = [
  {
    id: "geom-pythagoras",
    title: "The Pythagorean theorem",
    statement: "a^2 + b^2 = c^2",
    context:
      "In any right triangle, the square built on the longest side equals the two squares built on the shorter sides — added together.",
    cinematic: { video: "/cache/videos/geom_01_pythagoras.mp4" },
    transcript: {
      en: "Look at any right triangle — one with a perfectly square corner. Build a square on each of its three sides. The two smaller squares, the ones on the legs, always have a combined area exactly equal to the big square on the hypotenuse. That is the Pythagorean theorem: a squared plus b squared equals c squared. It is the single most useful relationship in geometry — it tells you a distance whenever you know the two perpendicular pieces of it.",
    },
  },
  {
    id: "geom-angle-sum",
    title: "Angles in a triangle sum to $180^\\circ$",
    statement: "\\alpha + \\beta + \\gamma = 180^\\circ",
    context:
      "Tear off the three corners of any triangle and line them up edge to edge. Together they always make a straight line — half a turn, or 180 degrees.",
    cinematic: { video: "/cache/videos/geom_02_angle_sum.mp4" },
    transcript: {
      en: "Pick any triangle you like — pointy, flat, lopsided. Mark its three interior angles. If you slide them together, corner to corner, they always fit perfectly along a straight line. A straight line is one hundred and eighty degrees. So the three angles of a triangle, no matter what triangle, always add up to one hundred and eighty degrees. This single fact is the foundation of almost every angle proof in geometry.",
    },
  },
  {
    id: "geom-area-triangle",
    title: "Area of a triangle",
    statement: "A = \\tfrac{1}{2} \\, b \\, h",
    context:
      "A triangle is half of a rectangle — a rectangle with the same base and the same height. So its area is one-half base times height.",
    cinematic: { video: "/cache/videos/geom_03_area_triangle.mp4" },
    transcript: {
      en: "Take any triangle and stand it up on one of its sides — call that the base. Measure straight up from the base to the highest point of the triangle — that distance is the height. Now imagine reflecting the triangle to make a parallelogram of the same base and the same height. Slide a piece across, and that parallelogram becomes a rectangle. The triangle is exactly half of that rectangle. So the area of any triangle is one-half base times height.",
    },
  },
  {
    id: "geom-circumference",
    title: "Circumference of a circle",
    statement: "C = 2 \\pi r",
    context:
      "Roll any circle one full turn along a straight line. The distance it covers is exactly two times pi times the radius — that's where pi comes from.",
    cinematic: { video: "/cache/videos/geom_04_circumference.mp4" },
    transcript: {
      en: "Take a circle of any size and roll it once along a straight line, from one mark to the next mark in the same place. The line you trace out is the circumference. Measure it carefully and divide by the diameter — the distance straight across the circle through the centre — and you always get the same number, no matter how big or small the circle is. That number is pi: about three point one four. So the circumference is pi times the diameter, which is the same as two times pi times the radius.",
    },
  },
  {
    id: "geom-area-circle",
    title: "Area of a circle",
    statement: "A = \\pi r^2",
    context:
      "Cut a circle into many thin pie wedges and rearrange them. They straighten out into a rectangle whose long side is half the circumference and whose short side is the radius.",
    cinematic: { video: "/cache/videos/geom_05_area_circle.mp4" },
    transcript: {
      en: "Here is the trick for the area of a circle. Cut the circle into a lot of thin pie wedges. Now flip every other wedge upside down and line them up like teeth in a zipper. The shape you get looks more and more like a rectangle as the wedges get thinner. Its long side is half of the circumference, which is pi times the radius. Its short side is just the radius. Multiply: pi times the radius times the radius. That is pi r squared — the area of the circle.",
    },
  },
  {
    id: "geom-similar",
    title: "Similar triangles",
    statement: "\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'}",
    context:
      "Two triangles are similar when one is a scaled-up version of the other. All their corresponding sides have the same ratio, and all their corresponding angles are equal.",
    cinematic: { video: "/cache/videos/geom_06_similar.mp4" },
    transcript: {
      en: "Two triangles are similar if one is just a scaled-up copy of the other. Same shape, different size. When that happens, every pair of matching sides has the exact same ratio. If the bigger triangle is twice as tall, every side is twice as long. And every matching angle is exactly equal. That single idea — same shape, scaled by a constant — is what lets us measure distances we can't reach. Stand a stick in the sun, measure its shadow and the shadow of a tree, and the two triangles are similar.",
    },
  },
];

export const GEOMETRY_CHAPTERS: ChapterDef[] = [
  {
    number: 1,
    title: "Triangles",
    blurb:
      "Every shape in geometry can be broken down into triangles. Start with the three facts every triangle obeys: how its sides relate, how its angles add up, and how to find its area.",
    sections: [
      {
        heading: "1.1 The Pythagorean theorem",
        formal: {
          kind: "Theorem",
          name: "Pythagoras",
          body:
            "In a right triangle with legs of length $a$ and $b$ and hypotenuse of length $c$, $$a^{2} + b^{2} = c^{2}.$$",
        },
        intro:
          "The square on the hypotenuse equals the sum of the squares on the other two sides. Tap to see the squares glide into place.",
        theoremIndex: 0,
      },
      {
        heading: "1.2 Angles in a triangle",
        formal: {
          kind: "Theorem",
          body:
            "The three interior angles of any triangle satisfy $$\\alpha + \\beta + \\gamma = 180^\\circ.$$",
        },
        intro:
          "No matter what triangle you draw, its three angles always add up to 180°. The visualization shows the angles sliding together to form a straight line.",
        theoremIndex: 1,
      },
      {
        heading: "1.3 Area of a triangle",
        formal: {
          kind: "Theorem",
          body:
            "The area of a triangle with base $b$ and corresponding height $h$ is $$A = \\tfrac{1}{2}\\, b \\, h.$$",
        },
        intro:
          "A triangle fits inside a rectangle that has the same base and height — and it takes up exactly half of it. That's where the $\\tfrac{1}{2}$ comes from.",
        theoremIndex: 2,
      },
      {
        heading: "1.4 Similar triangles",
        formal: {
          kind: "Definition",
          body:
            "Two triangles $\\triangle ABC$ and $\\triangle A'B'C'$ are similar if their corresponding angles are equal and their corresponding sides are proportional: $$\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'}.$$",
        },
        intro:
          "When two triangles have the same shape but different sizes, they are similar. Every pair of matching sides has the same ratio — that's what lets you measure something tall just by measuring a stick and a shadow.",
        theoremIndex: 5,
      },
    ],
  },
  {
    number: 2,
    title: "Circles",
    blurb:
      "Circles are everywhere in nature and design. Both formulas you'll ever need — circumference and area — come from the same constant: $\\pi$.",
    sections: [
      {
        heading: "2.1 Circumference",
        formal: {
          kind: "Theorem",
          body:
            "The circumference of a circle of radius $r$ is $$C = 2 \\pi r.$$",
        },
        intro:
          "Roll any circle one full turn along a straight line. The distance you trace is exactly $2\\pi$ times the radius — that's where the constant $\\pi$ comes from in the first place.",
        theoremIndex: 3,
      },
      {
        heading: "2.2 Area of a circle",
        formal: {
          kind: "Theorem",
          body:
            "The area enclosed by a circle of radius $r$ is $$A = \\pi r^{2}.$$",
        },
        intro:
          "Slice the circle into thin wedges and rearrange them into a near-rectangle of width $\\pi r$ and height $r$. Multiply: $\\pi r^{2}$.",
        theoremIndex: 4,
      },
    ],
  },
];

export const geometryBook: BuiltinBook = {
  id: "geometry",
  name: "Geometry (Middle School)",
  theorems: GEOMETRY_THEOREMS,
  chapters: GEOMETRY_CHAPTERS,
};
