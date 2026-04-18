"""Secant rotating into tangent as h → 0.

Render:
    uv run manim -ql 02_derivative.py SecantToTangent

Pattern reference: ArgMinExample (ValueTracker + dot updater) and the standard
`axes.get_graph_label` / `axes.input_to_graph_point` plotting idioms.
"""

from manim import *


class SecantToTangent(Scene):
    def construct(self):
        config.background_color = "#111216"

        axes = Axes(
            x_range=[-0.5, 3.5, 1],
            y_range=[-0.5, 5, 1],
            x_length=8,
            y_length=5,
            tips=False,
            axis_config={"stroke_color": "#888888"},
        )
        axis_labels = axes.get_axis_labels(x_label="x", y_label="f(x)").set_color(WHITE)

        f = lambda x: 0.5 * x * x
        fp = lambda x: x

        graph = axes.plot(f, x_range=[-0.3, 3.3], color=BLUE, stroke_width=4)
        graph_label = axes.get_graph_label(
            graph, label=MathTex(r"f(x) = \tfrac{1}{2}x^2", color=BLUE), x_val=2.7, direction=UR
        )

        title = Tex(r"Derivative $=$ slope of tangent", font_size=36, color=WHITE).to_edge(UP)

        self.play(Write(title))
        self.play(Create(axes), Write(axis_labels), run_time=1)
        self.play(Create(graph), Write(graph_label), run_time=1.2)

        a = 1.5
        h = ValueTracker(1.3)

        # Anchor + moving point on the curve
        dot_a = Dot(axes.c2p(a, f(a)), color=ORANGE, radius=0.08)
        dot_b = Dot(
            axes.c2p(a + h.get_value(), f(a + h.get_value())), color=YELLOW, radius=0.08
        )
        dot_b.add_updater(
            lambda m: m.move_to(axes.c2p(a + h.get_value(), f(a + h.get_value())))
        )

        # Secant line, redrawn each frame from the two anchor positions
        def get_secant():
            x1, y1 = a, f(a)
            x2, y2 = a + h.get_value(), f(a + h.get_value())
            dx = x2 - x1 if abs(x2 - x1) > 1e-6 else 1e-6
            slope = (y2 - y1) / dx
            x_left, x_right = -0.4, 3.4
            return Line(
                axes.c2p(x_left, y1 + slope * (x_left - x1)),
                axes.c2p(x_right, y1 + slope * (x_right - x1)),
                color=YELLOW,
                stroke_width=3,
            )

        secant = always_redraw(get_secant)

        # Live readouts via DecimalNumber (compile MathTex once, update value only)
        slope_value = DecimalNumber(
            (f(a + h.get_value()) - f(a)) / h.get_value(),
            num_decimal_places=2, color=YELLOW, font_size=32,
        )
        slope_value.add_updater(
            lambda m: m.set_value(
                (f(a + h.get_value()) - f(a)) / h.get_value()
            )
        )
        slope_readout = VGroup(
            MathTex(r"\text{slope} = ", color=YELLOW, font_size=32), slope_value
        ).arrange(RIGHT, buff=0.1).to_corner(UR).shift(LEFT * 0.3)

        h_value = DecimalNumber(h.get_value(), num_decimal_places=2, color=WHITE, font_size=30)
        h_value.add_updater(lambda m: m.set_value(h.get_value()))
        h_readout = VGroup(
            MathTex("h = ", color=WHITE, font_size=30), h_value
        ).arrange(RIGHT, buff=0.1).next_to(slope_readout, DOWN, aligned_edge=LEFT)

        self.play(FadeIn(dot_a), FadeIn(dot_b), Create(secant))
        self.play(Write(slope_readout), Write(h_readout))
        self.wait(0.4)

        # The "wow" moment: smoothly slide h to ~0 and watch the secant pivot
        self.play(h.animate.set_value(0.05), run_time=4.5, rate_func=smooth)
        self.wait(0.6)

        slope_value.clear_updaters()
        h_value.clear_updaters()

        final = MathTex(
            r"f'(1.5) = 1.50", color=YELLOW, font_size=44
        ).to_edge(DOWN)
        self.play(Write(final))
        self.play(Indicate(final, color=GREEN, scale_factor=1.15))
        self.wait(1.5)
