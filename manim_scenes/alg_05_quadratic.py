"""The quadratic formula visualised on a parabola.

Plot y = ax^2 + bx + c, mark its two roots, then reveal the quadratic
formula. Then sweep the discriminant from positive (two roots) through
zero (touch) to negative (no real roots).

Render:
    uv run manim -ql alg_05_quadratic.py Quadratic
"""

from manim import *
import numpy as np


class Quadratic(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"a x^2 + b x + c = 0",
            font_size=44, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        plane = Axes(
            x_range=[-4, 4, 1], y_range=[-3, 4, 1],
            x_length=7, y_length=4.4,
            axis_config={"stroke_color": "#888", "include_tip": False},
        ).shift(DOWN * 0.4)
        self.play(Create(plane), run_time=1.0)

        a = ValueTracker(1.0)
        b = ValueTracker(0.0)
        c = ValueTracker(-2.0)

        def parabola():
            av, bv, cv = a.get_value(), b.get_value(), c.get_value()
            return plane.plot(
                lambda x: av * x * x + bv * x + cv,
                color=BLUE, stroke_width=3,
                x_range=[-3.5, 3.5],
            )

        graph = always_redraw(parabola)
        self.add(graph)

        # Root markers — use a shrinking discriminant to control them
        def roots():
            av, bv, cv = a.get_value(), b.get_value(), c.get_value()
            disc = bv * bv - 4 * av * cv
            grp = VGroup()
            if disc >= 0:
                sq = np.sqrt(disc)
                r1 = (-bv - sq) / (2 * av)
                r2 = (-bv + sq) / (2 * av)
                grp.add(Dot(plane.coords_to_point(r1, 0), color=YELLOW, radius=0.09))
                if abs(r1 - r2) > 1e-3:
                    grp.add(Dot(plane.coords_to_point(r2, 0), color=YELLOW, radius=0.09))
            return grp

        root_dots = always_redraw(roots)
        self.add(root_dots)

        # Discriminant + formula readout
        formula = MathTex(
            r"x = \frac{-b \pm \sqrt{b^2 - 4 a c}}{2 a}",
            font_size=34, color=YELLOW,
        ).to_edge(DOWN, buff=0.6)
        self.play(Write(formula), run_time=1.4)
        self.wait(0.6)

        # Sweep c so the parabola rises — discriminant goes positive → zero → negative
        # Currently a=1, b=0, c=-2 → disc = 0 - 4*1*(-2) = 8 (two real roots)
        self.wait(0.6)
        # Move to c = 0 → disc = 0 (tangent to x-axis)
        self.play(c.animate.set_value(0.0), run_time=1.6)
        self.wait(0.4)
        # Move to c = 1 → disc = -4 (no real roots)
        self.play(c.animate.set_value(1.0), run_time=1.6)
        self.wait(0.4)
        # Back to c = -2 to end
        self.play(c.animate.set_value(-2.0), run_time=1.4)
        self.wait(0.4)

        punch = Tex(
            r"The discriminant $b^{2}-4 a c$ tells you how many real roots there are.",
            font_size=26, color=WHITE,
        ).next_to(formula, UP, buff=0.2)
        self.play(Write(punch), run_time=1.4)
        self.wait(1.6)
