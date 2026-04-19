"""Comparison Test for improper integrals (typically section 7.4):
if 0 ≤ f(x) ≤ g(x) on [a, ∞) and ∫g converges, then ∫f also converges.
Conversely, if ∫f diverges, then ∫g must diverge.

We plot a smaller f and a bigger g, shade the area between them, and
show that f is sandwiched under g — so g's finite area caps f's.

Render:
    uv run manim -ql calc_comparison.py ComparisonTest
"""

from manim import *


class ComparisonTest(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex(
            r"\textbf{Comparison Test:} if $0 \le f(x) \le g(x)$ and "
            r"$\displaystyle\int_a^\infty g(x)\,dx$ converges, "
            r"then so does $\displaystyle\int_a^\infty f(x)\,dx$.",
            font_size=24, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.6)

        ax = Axes(
            x_range=[0, 5.5, 1], y_range=[0, 2.4, 0.5],
            x_length=9, y_length=4,
            axis_config={"stroke_color": "#888", "include_tip": False},
        ).shift(DOWN * 0.4)
        self.play(Create(ax), run_time=0.8)

        # g(x) = 2/x^2 (the larger envelope), f(x) = 1/(x^2 + 1) (smaller)
        g_fn = lambda x: 2 / (x * x) if x > 0.7 else 4
        f_fn = lambda x: 1 / (x * x + 1)

        g_graph = ax.plot(g_fn, x_range=[0.85, 5.0], color=ORANGE, stroke_width=3)
        f_graph = ax.plot(f_fn, x_range=[0.5, 5.0], color=BLUE, stroke_width=3)

        g_lab = MathTex("g(x)", font_size=28, color=ORANGE).next_to(
            ax.coords_to_point(2.0, g_fn(2.0)), UP, buff=0.15
        )
        f_lab = MathTex("f(x)", font_size=28, color=BLUE).next_to(
            ax.coords_to_point(3.0, f_fn(3.0)), DOWN, buff=0.15
        )

        self.play(Create(g_graph), Write(g_lab), run_time=1.2)
        self.play(Create(f_graph), Write(f_lab), run_time=1.0)

        # Shaded areas
        g_area = ax.get_area(g_graph, x_range=[1.0, 5.0], color=ORANGE, opacity=0.30)
        f_area = ax.get_area(f_graph, x_range=[1.0, 5.0], color=BLUE, opacity=0.55)
        self.play(FadeIn(g_area), FadeIn(f_area), run_time=1.4)
        self.wait(0.4)

        punch = MathTex(
            r"\int_1^\infty f \;\le\; \int_1^\infty g \;<\; \infty"
            r"\;\;\Longrightarrow\;\; \int_1^\infty f \text{ converges.}",
            font_size=28, color=WHITE,
        ).to_edge(DOWN, buff=0.4)
        self.play(Write(punch), run_time=1.6)
        self.wait(1.6)
