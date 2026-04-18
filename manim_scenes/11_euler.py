"""Euler's identity: e^(iπ) + 1 = 0.

We trace e^(iθ) around the unit circle as θ sweeps from 0 to π. The vector
starts at 1 (the point (1, 0)) and lands at -1 (the point (-1, 0)) when
θ = π. So e^(iπ) = -1, which means e^(iπ) + 1 = 0.

Render:
    uv run manim -ql 11_euler.py EulerIdentity
"""

from manim import *
import numpy as np


class EulerIdentity(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(r"e^{i\pi} + 1 = 0",
                        font_size=46, color=WHITE).to_edge(UP)
        subtitle = Tex(r"Why? Because $e^{i\theta}$ rotates around the unit circle.",
                       font_size=26, color=WHITE).next_to(title, DOWN, buff=0.2)
        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(subtitle, shift=UP * 0.1), run_time=0.8)

        plane = NumberPlane(
            x_range=[-1.6, 1.6, 1],
            y_range=[-1.6, 1.6, 1],
            x_length=6,
            y_length=6,
            background_line_style={"stroke_color": "#404040", "stroke_width": 1, "stroke_opacity": 0.6},
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).shift(DOWN * 0.3).to_edge(LEFT, buff=0.7)
        circle = Circle(radius=plane.x_axis.unit_size, color=BLUE, stroke_width=2).move_to(plane.c2p(0, 0))

        re_lab = MathTex(r"\Re", color=WHITE, font_size=22).next_to(plane.c2p(1.55, 0), RIGHT, buff=0.05)
        im_lab = MathTex(r"\Im", color=WHITE, font_size=22).next_to(plane.c2p(0, 1.55), UP, buff=0.05)
        one_dot = Dot(plane.c2p(1, 0), color=GREEN, radius=0.07)
        one_lab = MathTex("1", color=GREEN, font_size=28).next_to(one_dot, DOWN, buff=0.1)
        m1_dot = Dot(plane.c2p(-1, 0), color=RED, radius=0.07)
        m1_lab = MathTex("-1", color=RED, font_size=28).next_to(m1_dot, DOWN, buff=0.1)

        self.play(Create(plane), Create(circle), Write(re_lab), Write(im_lab),
                  FadeIn(one_dot), Write(one_lab), FadeIn(m1_dot), Write(m1_lab),
                  run_time=1.4)

        theta = ValueTracker(0.0)

        arrow = always_redraw(
            lambda: Arrow(
                plane.c2p(0, 0),
                plane.c2p(np.cos(theta.get_value()), np.sin(theta.get_value())),
                buff=0,
                color=YELLOW,
                stroke_width=5,
                max_tip_length_to_length_ratio=0.18,
            )
        )
        tip = always_redraw(
            lambda: Dot(
                plane.c2p(np.cos(theta.get_value()), np.sin(theta.get_value())),
                color=YELLOW, radius=0.08,
            )
        )

        trace = TracedPath(tip.get_center, stroke_color=YELLOW, stroke_width=3, stroke_opacity=0.6)
        self.add(trace, arrow, tip)

        theta_value = DecimalNumber(0.0, num_decimal_places=2, color=YELLOW, font_size=34)
        theta_value.add_updater(lambda m: m.set_value(theta.get_value()))
        theta_row = VGroup(MathTex(r"\theta = ", color=YELLOW, font_size=34), theta_value).arrange(RIGHT, buff=0.1)

        cos_value = DecimalNumber(1.0, num_decimal_places=2, color=WHITE, font_size=30)
        cos_value.add_updater(lambda m: m.set_value(np.cos(theta.get_value())))
        cos_row = VGroup(MathTex(r"\cos\theta = ", color=WHITE, font_size=30), cos_value).arrange(RIGHT, buff=0.1)

        sin_value = DecimalNumber(0.0, num_decimal_places=2, color=WHITE, font_size=30)
        sin_value.add_updater(lambda m: m.set_value(np.sin(theta.get_value())))
        sin_row = VGroup(MathTex(r"\sin\theta = ", color=WHITE, font_size=30), sin_value).arrange(RIGHT, buff=0.1)

        formula = MathTex(r"e^{i\theta} = \cos\theta + i\sin\theta",
                          font_size=30, color=YELLOW)

        readout = VGroup(formula, theta_row, cos_row, sin_row).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        readout.next_to(plane, RIGHT, buff=0.7).shift(UP * 0.3)
        self.play(Write(readout), run_time=1.0)

        # Sweep θ from 0 to π — the vector swings from (1,0) up around to (-1,0)
        self.play(theta.animate.set_value(PI), run_time=4.5, rate_func=smooth)
        self.wait(0.6)

        theta_value.clear_updaters()
        cos_value.clear_updaters()
        sin_value.clear_updaters()

        punch = MathTex(
            r"e^{i\pi} = -1 \quad\Longrightarrow\quad e^{i\pi} + 1 = 0",
            font_size=40, color=GREEN,
        ).to_edge(DOWN, buff=0.6)
        self.play(Write(punch), run_time=1.6)
        self.wait(1.6)
