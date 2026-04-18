"""De Moivre: a unit complex number raised to the n-th power multiplies its angle by n.

Render:
    uv run manim -ql 04_de_moivre.py DeMoivre
"""

from manim import *
import numpy as np


class DeMoivre(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex(r"De Moivre: $(\cos\theta + i\sin\theta)^n = \cos(n\theta) + i\sin(n\theta)$",
                    font_size=30, color=WHITE).to_edge(UP)
        self.play(Write(title))

        plane = NumberPlane(
            x_range=[-1.6, 1.6, 1],
            y_range=[-1.6, 1.6, 1],
            x_length=6,
            y_length=6,
            background_line_style={"stroke_color": "#404040", "stroke_width": 1, "stroke_opacity": 0.6},
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).to_edge(LEFT, buff=0.6)

        circle = Circle(radius=plane.x_axis.unit_size, color=BLUE, stroke_width=2).move_to(plane.c2p(0, 0))

        re_label = Tex("Re", color=WHITE, font_size=22).next_to(plane.c2p(1.55, 0), RIGHT, buff=0.05)
        im_label = Tex("Im", color=WHITE, font_size=22).next_to(plane.c2p(0, 1.55), UP, buff=0.05)

        self.play(Create(plane), Create(circle), Write(re_label), Write(im_label), run_time=1.4)

        # Base angle θ — fixed, marked
        theta = PI / 6  # 30°
        base_pt = np.array([np.cos(theta), np.sin(theta)])
        base_dot = Dot(plane.c2p(*base_pt), color=YELLOW, radius=0.07)
        base_arrow = Arrow(plane.c2p(0, 0), plane.c2p(*base_pt), buff=0,
                           color=YELLOW, max_tip_length_to_length_ratio=0.18, stroke_width=4)
        base_label = MathTex(r"e^{i\theta}", color=YELLOW, font_size=30).next_to(base_dot, UR, buff=0.1)

        self.play(Create(base_arrow), FadeIn(base_dot), Write(base_label), run_time=1.2)

        # n tracker drives a second "powered" vector
        n_tracker = ValueTracker(1.0)

        def powered_pt():
            n = n_tracker.get_value()
            return np.array([np.cos(n * theta), np.sin(n * theta)])

        powered_arrow = always_redraw(
            lambda: Arrow(
                plane.c2p(0, 0), plane.c2p(*powered_pt()),
                buff=0, color=GREEN, max_tip_length_to_length_ratio=0.18, stroke_width=4,
            )
        )
        powered_dot = always_redraw(
            lambda: Dot(plane.c2p(*powered_pt()), color=GREEN, radius=0.07)
        )
        powered_label = always_redraw(
            lambda: MathTex(r"e^{in\theta}", color=GREEN, font_size=30)
            .next_to(plane.c2p(*powered_pt()), UR, buff=0.1)
        )

        # Right-side readout panel
        n_value = DecimalNumber(n_tracker.get_value(), num_decimal_places=1, color=GREEN, font_size=42)
        n_value.add_updater(lambda m: m.set_value(n_tracker.get_value()))
        angle_deg = DecimalNumber(np.degrees(theta), num_decimal_places=0, color=GREEN, font_size=36, unit=r"^\circ")
        angle_deg.add_updater(lambda m: m.set_value(np.degrees(n_tracker.get_value() * theta) % 360))

        readout = VGroup(
            VGroup(MathTex("n =", color=GREEN, font_size=42), n_value).arrange(RIGHT, buff=0.18),
            VGroup(MathTex(r"n\theta =", color=GREEN, font_size=36), angle_deg).arrange(RIGHT, buff=0.15),
        ).arrange(DOWN, buff=0.5, aligned_edge=LEFT).next_to(plane, RIGHT, buff=1.0).shift(UP * 0.3)

        # Optional: trace of the powered tip as we sweep n
        path = TracedPath(powered_dot.get_center, stroke_color=GREEN, stroke_width=2, stroke_opacity=0.5)
        self.add(path)

        self.play(Create(powered_arrow), FadeIn(powered_dot), Write(powered_label), Write(readout), run_time=1.0)

        # Sweep n: 1 → 6, then back down
        self.play(n_tracker.animate.set_value(6.0), run_time=4.0, rate_func=smooth)
        self.wait(0.6)
        self.play(n_tracker.animate.set_value(1.0), run_time=2.0, rate_func=smooth)
        self.wait(0.4)

        n_value.clear_updaters()
        angle_deg.clear_updaters()

        closing = Tex(r"Each power of $n$ rotates by another $\theta$.", font_size=30, color=YELLOW).to_edge(DOWN)
        self.play(Write(closing))
        self.wait(1.5)
