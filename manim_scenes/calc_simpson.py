"""Simpson's Rule: approximate ∫_a^b f(x) dx by fitting a parabola
through every triple of consecutive sample points and summing the
exact areas under those parabolas.

Render:
    uv run manim -ql calc_simpson.py SimpsonRule
"""

from manim import *


class SimpsonRule(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"\int_a^b f(x)\,dx \approx \frac{h}{3}\bigl[f(x_0) + 4 f(x_1) + 2 f(x_2) + 4 f(x_3) + \dots + f(x_n)\bigr]",
            font_size=24, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.4)

        ax = Axes(
            x_range=[0, 5, 1], y_range=[0, 6, 1],
            x_length=8.5, y_length=4,
            axis_config={"stroke_color": "#888", "include_tip": False},
        ).shift(DOWN * 0.4)
        self.play(Create(ax), run_time=0.8)

        def f(x):
            return 0.3 * x * x + 1

        graph = ax.plot(f, x_range=[0.5, 4.5], color=BLUE, stroke_width=3)
        self.play(Create(graph), run_time=1.0)

        a, b = 1.0, 4.0
        n = 6  # must be even
        h = (b - a) / n

        # For each pair of intervals, fit a Lagrange parabola through the
        # three sample points and shade the area underneath it.
        def lagrange(x0, x1, x2, y0, y1, y2):
            def p(x):
                L0 = ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2))
                L1 = ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2))
                L2 = ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1))
                return y0 * L0 + y1 * L1 + y2 * L2
            return p

        regions = VGroup()
        sample_dots = VGroup()
        colors = [GREEN, ORANGE, PURPLE]
        for j, k in enumerate(range(0, n, 2)):
            x0 = a + k * h
            x1 = a + (k + 1) * h
            x2 = a + (k + 2) * h
            p = lagrange(x0, x1, x2, f(x0), f(x1), f(x2))
            par = ax.plot(p, x_range=[x0, x2], color=colors[j % 3], stroke_width=3)
            area = ax.get_area(par, x_range=[x0, x2], color=colors[j % 3], opacity=0.45)
            regions.add(area, par)
            for x in (x0, x1, x2):
                sample_dots.add(Dot(ax.coords_to_point(x, f(x)), color=YELLOW, radius=0.06))

        self.play(FadeIn(regions), FadeIn(sample_dots), run_time=2.4)

        punch = Tex(
            r"Each parabola hugs the curve over two strips — much tighter than a straight trapezoid.",
            font_size=24, color=WHITE,
        ).to_edge(DOWN, buff=0.3)
        self.play(Write(punch), run_time=1.5)
        self.wait(1.6)
