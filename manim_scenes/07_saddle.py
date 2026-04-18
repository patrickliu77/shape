"""Critical points of z = a x² + b y² — bowl → saddle → dome.

We morph the surface through several (a, b) regimes while a 2D classification
table on the right highlights which one we're in. A camera glide gives a feel
for the 3D geometry.

Render:
    uv run manim -ql 07_saddle.py Saddle
"""

from manim import *
import numpy as np


def make_surface(axes, a: float, b: float, color):
    return Surface(
        lambda u, v: axes.c2p(u, v, a * u * u + b * v * v),
        u_range=[-1.6, 1.6],
        v_range=[-1.6, 1.6],
        resolution=(28, 28),
        stroke_width=0.5,
        stroke_color=WHITE,
        stroke_opacity=0.25,
        fill_color=color,
        fill_opacity=0.75,
    )


class Saddle(ThreeDScene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex(r"$z = a x^2 + b y^2$ — bowl, saddle, or dome?",
                    font_size=34, color=WHITE).to_edge(UP)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.0)

        axes = ThreeDAxes(
            x_range=[-2, 2, 1],
            y_range=[-2, 2, 1],
            z_range=[-3.5, 3.5, 1],
            x_length=5,
            y_length=5,
            z_length=4,
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).shift(DOWN * 0.3)
        self.set_camera_orientation(phi=66 * DEGREES, theta=-50 * DEGREES, zoom=0.85)
        self.play(Create(axes), run_time=1.2)

        # (a, b, label, color)
        cases = [
            (1.0,  1.0,  "minimum (bowl)",  BLUE),
            (1.0,  -1.0, "saddle point",    YELLOW),
            (-1.0, -1.0, "maximum (dome)",  RED),
        ]

        # First case: animate IN from nothing
        a, b, name, color = cases[0]
        surface = make_surface(axes, a, b, color)

        ab_text = MathTex(rf"a = {a:.1f},\ b = {b:.1f}", font_size=32, color=WHITE)
        ab_text.to_corner(UL).shift(DOWN * 0.6 + RIGHT * 0.3)
        kind_text = Tex(name, font_size=30, color=color).next_to(ab_text, DOWN, aligned_edge=LEFT, buff=0.2)
        self.add_fixed_in_frame_mobjects(ab_text, kind_text)

        self.play(Create(surface), Write(ab_text), Write(kind_text), run_time=2.0)
        self.wait(0.6)

        # Slow camera spin to show the bowl from different sides
        self.begin_ambient_camera_rotation(rate=0.20)
        self.wait(2.0)
        self.stop_ambient_camera_rotation()

        # Morph through the remaining cases
        for a, b, name, color in cases[1:]:
            new_surface = make_surface(axes, a, b, color)
            new_ab = MathTex(rf"a = {a:.1f},\ b = {b:.1f}", font_size=32, color=WHITE).move_to(ab_text)
            new_kind = Tex(name, font_size=30, color=color).move_to(kind_text)

            self.play(
                Transform(surface, new_surface),
                Transform(ab_text, new_ab),
                Transform(kind_text, new_kind),
                run_time=2.2,
            )
            self.wait(0.5)
            self.begin_ambient_camera_rotation(rate=0.20)
            self.wait(2.0)
            self.stop_ambient_camera_rotation()

        # Closing classification rule
        closing = Tex(
            r"$ab > 0$: bowl or dome.\quad $ab < 0$: saddle.",
            font_size=30, color=YELLOW,
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(closing)
        self.play(Write(closing), run_time=1.4)
        self.wait(1.6)
