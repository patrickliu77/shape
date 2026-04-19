"""Trapezium Rule: approximate ∫_a^b f(x) dx by stacking trapezoids
under the curve. We slice [a, b] into n equal strips of width h, then
add up the trapezoid areas.

Render:
    uv run manim -ql calc_trapezium.py TrapeziumRule
"""

from manim import *


class TrapeziumRule(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"\int_a^b f(x)\,dx \approx \frac{h}{2}\bigl[f(x_0) + 2 f(x_1) + \dots + 2 f(x_{n-1}) + f(x_n)\bigr]",
            font_size=28, color=WHITE,
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
        self.play(Create(graph), run_time=1.2)

        a, b = 1.0, 4.0
        n = 6
        h = (b - a) / n

        traps = VGroup()
        for k in range(n):
            x0 = a + k * h
            x1 = x0 + h
            y0, y1 = f(x0), f(x1)
            p_bl = ax.coords_to_point(x0, 0)
            p_br = ax.coords_to_point(x1, 0)
            p_tr = ax.coords_to_point(x1, y1)
            p_tl = ax.coords_to_point(x0, y0)
            traps.add(Polygon(
                p_bl, p_br, p_tr, p_tl,
                color=YELLOW, stroke_width=2,
                fill_color=YELLOW, fill_opacity=0.35,
            ))
        self.play(LaggedStartMap(FadeIn, traps, lag_ratio=0.12), run_time=2.2)

        a_lab = MathTex("a", font_size=26, color=WHITE).next_to(
            ax.coords_to_point(a, 0), DOWN, buff=0.15
        )
        b_lab = MathTex("b", font_size=26, color=WHITE).next_to(
            ax.coords_to_point(b, 0), DOWN, buff=0.15
        )
        h_brace = Brace(
            Line(ax.coords_to_point(a, 0), ax.coords_to_point(a + h, 0)),
            DOWN, color=YELLOW,
        )
        h_lab = MathTex("h", font_size=26, color=YELLOW).next_to(h_brace, DOWN, buff=0.05)
        self.play(Write(a_lab), Write(b_lab), GrowFromCenter(h_brace), Write(h_lab), run_time=0.9)

        punch = Tex(
            r"Add up the trapezoid areas — each is $\tfrac{h}{2}(f(x_k) + f(x_{k+1}))$.",
            font_size=26, color=WHITE,
        ).to_edge(DOWN, buff=0.3)
        self.play(Write(punch), run_time=1.3)
        self.wait(1.6)
