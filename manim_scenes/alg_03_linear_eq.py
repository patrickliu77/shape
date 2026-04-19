"""Solving a linear equation: ax + b = c → x = (c - b)/a.

We picture an equation as a balance scale. Each side gets the same
operation; the unknown x is uncovered by stripping b, then dividing by a.

Render:
    uv run manim -ql alg_03_linear_eq.py LinearEquation
"""

from manim import *


class LinearEquation(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex("Solve $a x + b = c$", font_size=42, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        # Step 0: original equation centred
        eq0 = MathTex("a", "x", "+", "b", "=", "c",
                      font_size=64, color=WHITE)
        eq0.move_to(UP * 0.8)
        self.play(Write(eq0), run_time=1.2)
        self.wait(0.4)

        # Annotation: "subtract b from both sides"
        op1 = Tex(r"$-\,b$ \ \ from both sides", font_size=30, color=YELLOW).next_to(eq0, DOWN, buff=0.5)
        self.play(Write(op1), run_time=0.8)
        self.wait(0.4)

        # Step 1
        eq1 = MathTex("a", "x", "=", "c", "-", "b",
                      font_size=64, color=WHITE).move_to(DOWN * 0.5)
        self.play(Write(eq1), run_time=1.0)
        self.wait(0.6)

        # Operation 2: divide both sides by a
        op2 = Tex(r"$\div\,a$ \ \ both sides", font_size=30, color=YELLOW).next_to(eq1, DOWN, buff=0.5)
        self.play(Write(op2), run_time=0.8)
        self.wait(0.3)

        # Step 2: solution
        eq2 = MathTex(r"x = \frac{c - b}{a}", font_size=72, color=GREEN).to_edge(DOWN, buff=0.6)
        self.play(Write(eq2), run_time=1.4)
        self.wait(1.6)

        # Highlight box around the solution
        box = SurroundingRectangle(eq2, color=GREEN, buff=0.2)
        self.play(Create(box), run_time=0.8)
        self.wait(1.4)
