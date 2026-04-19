"""Improper Integrals of Type I (infinite limits): ∫_1^∞ 1/x² dx.

We watch the upper bound t slide out toward infinity. The shaded area
under 1/x² fills in but stays bounded — the integral converges to 1.

Render:
    uv run manim -ql calc_improper_inf.py ImproperInfinite
"""

from manim import *


class ImproperInfinite(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"\int_1^\infty \frac{1}{x^2}\,dx \;=\; \lim_{t \to \infty} \int_1^t \frac{1}{x^2}\,dx \;=\; 1",
            font_size=30, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.4)

        ax = Axes(
            x_range=[0, 8, 1], y_range=[0, 1.4, 0.5],
            x_length=9, y_length=3.5,
            axis_config={"stroke_color": "#888", "include_tip": False},
        ).shift(DOWN * 0.4)
        self.play(Create(ax), run_time=0.8)

        graph = ax.plot(
            lambda x: 1 / (x * x), x_range=[0.7, 8], color=BLUE, stroke_width=3,
        )
        self.play(Create(graph), run_time=1.2)

        # x = 1 vertical line marker
        one_line = DashedLine(
            ax.coords_to_point(1, 0), ax.coords_to_point(1, 1.0),
            color=GRAY, stroke_width=1.5,
        )
        one_lab = MathTex("1", font_size=24, color=WHITE).next_to(
            ax.coords_to_point(1, 0), DOWN, buff=0.1
        )
        self.play(Create(one_line), Write(one_lab), run_time=0.6)

        # Animate t from 2 to 8
        t = ValueTracker(2.0)

        area = always_redraw(lambda: ax.get_area(
            ax.plot(lambda x: 1 / (x * x), x_range=[1, t.get_value()]),
            x_range=[1, t.get_value()],
            color=YELLOW, opacity=0.55,
        ))
        self.add(area)

        def fmt():
            tv = t.get_value()
            return MathTex(
                rf"t = {tv:.1f}, \quad \int_1^t \frac{{1}}{{x^2}}\,dx = 1 - \frac{{1}}{{t}} \approx {1 - 1/tv:.3f}",
                font_size=28, color=YELLOW,
            ).to_edge(DOWN, buff=0.4)

        readout = always_redraw(fmt)
        self.add(readout)

        self.play(t.animate.set_value(8.0), run_time=4.5, rate_func=smooth)
        self.wait(0.6)

        readout.clear_updaters()
        area.clear_updaters()

        punch = Tex(
            r"As $t \to \infty$, the area approaches $1$ — the improper integral \emph{converges}.",
            font_size=26, color=WHITE,
        ).to_edge(DOWN, buff=0.4)
        self.play(FadeOut(readout), Write(punch), run_time=1.4)
        self.wait(1.6)
