"""Improper Integrals of Type II (vertical asymptotes): ∫_0^1 1/√x dx.

The integrand blows up at x = 0. We approach the asymptote from the
right by sliding t from 0.5 toward 0; even though the function shoots
to infinity, the area under the curve stays finite — it converges to 2.

Render:
    uv run manim -ql calc_improper_vert.py ImproperVertical
"""

from manim import *


class ImproperVertical(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"\int_0^1 \frac{1}{\sqrt{x}}\,dx \;=\; \lim_{t \to 0^+} \int_t^1 \frac{1}{\sqrt{x}}\,dx \;=\; 2",
            font_size=30, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.4)

        ax = Axes(
            x_range=[0, 1.2, 0.2], y_range=[0, 8, 2],
            x_length=8, y_length=4,
            axis_config={"stroke_color": "#888", "include_tip": False},
        ).shift(DOWN * 0.4)
        self.play(Create(ax), run_time=0.8)

        graph = ax.plot(
            lambda x: 1 / (x ** 0.5), x_range=[0.02, 1.0],
            color=BLUE, stroke_width=3,
        )
        self.play(Create(graph), run_time=1.2)

        # t marker line
        t = ValueTracker(0.5)

        t_line = always_redraw(lambda: DashedLine(
            ax.coords_to_point(t.get_value(), 0),
            ax.coords_to_point(t.get_value(), min(8.0, 1 / max(t.get_value(), 0.02) ** 0.5)),
            color=GRAY, stroke_width=1.5,
        ))
        self.add(t_line)

        area = always_redraw(lambda: ax.get_area(
            ax.plot(lambda x: 1 / (x ** 0.5), x_range=[max(0.02, t.get_value()), 1]),
            x_range=[max(0.02, t.get_value()), 1],
            color=YELLOW, opacity=0.55,
        ))
        self.add(area)

        def fmt():
            tv = t.get_value()
            val = 2 - 2 * (tv ** 0.5)
            return MathTex(
                rf"t = {tv:.3f}, \quad \int_t^1 \frac{{1}}{{\sqrt{{x}}}}\,dx = 2 - 2\sqrt{{t}} \approx {val:.3f}",
                font_size=26, color=YELLOW,
            ).to_edge(DOWN, buff=0.4)

        readout = always_redraw(fmt)
        self.add(readout)

        self.play(t.animate.set_value(0.02), run_time=4.5, rate_func=smooth)
        self.wait(0.5)

        readout.clear_updaters()
        area.clear_updaters()
        t_line.clear_updaters()

        punch = Tex(
            r"Even though $1/\sqrt{x} \to \infty$ at $0$, the area converges to $2$.",
            font_size=26, color=WHITE,
        ).to_edge(DOWN, buff=0.4)
        self.play(FadeOut(readout), Write(punch), run_time=1.4)
        self.wait(1.6)
