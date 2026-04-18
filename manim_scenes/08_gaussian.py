"""The Gaussian integral via the squaring + polar trick.

Beats:
  1. Show the bell curve y = e^{-x²} and label the integral I.
  2. Square the integral → it becomes a double integral over R².
  3. Lift to 3D: the surface z = e^{-(x² + y²)}.
  4. Switch to polar: dA = r dr dθ. The Jacobian's extra r is the magic.
  5. Evaluate: 2π · ½ = π. Therefore I = √π.

Render:
    uv run manim -ql 08_gaussian.py GaussianIntegral
"""

from manim import *
import numpy as np


class GaussianIntegral(ThreeDScene):
    def construct(self):
        config.background_color = "#111216"

        # ─────── Beat 1: 1D bell curve, label I ────────────────────────────
        title = Tex(r"How does $\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}$?",
                    font_size=36, color=WHITE).to_edge(UP)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.2)

        axes2d = Axes(
            x_range=[-3, 3, 1],
            y_range=[0, 1.2, 0.5],
            x_length=8,
            y_length=3.2,
            tips=False,
            axis_config={"stroke_color": "#888888", "include_numbers": False},
        ).shift(DOWN * 0.4)

        self.play(Create(axes2d), run_time=1.0)

        bell = axes2d.plot(lambda x: np.exp(-x * x), x_range=[-3, 3], color=BLUE, stroke_width=4)
        area = axes2d.get_area(bell, x_range=[-3, 3], color=BLUE, opacity=0.35)

        I_label = MathTex(r"I = \int_{-\infty}^{\infty} e^{-x^2}\,dx",
                          font_size=36, color=YELLOW).to_corner(UR).shift(LEFT * 0.4 + DOWN * 0.6)
        self.add_fixed_in_frame_mobjects(I_label)

        self.play(Create(bell), run_time=1.2)
        self.play(FadeIn(area), Write(I_label), run_time=1.2)
        self.wait(0.6)

        # ─────── Beat 2: square it ─────────────────────────────────────────
        sq_caption = Tex(
            r"Try squaring it: \ \ $I^{2} \;=\; \displaystyle\iint_{\mathbb{R}^2} e^{-(x^{2}+y^{2})}\,dA$",
            font_size=32, color=YELLOW,
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(sq_caption)
        self.play(Write(sq_caption), run_time=1.6)
        self.wait(0.7)

        # ─────── Beat 3: lift to 3D, show the bell surface ─────────────────
        self.play(FadeOut(axes2d), FadeOut(bell), FadeOut(area),
                  FadeOut(sq_caption), run_time=0.8)
        self.remove(sq_caption)

        axes3d = ThreeDAxes(
            x_range=[-2.5, 2.5, 1],
            y_range=[-2.5, 2.5, 1],
            z_range=[0, 1.2, 0.5],
            x_length=5.5,
            y_length=5.5,
            z_length=3.0,
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).shift(DOWN * 0.3)

        surface = Surface(
            lambda u, v: axes3d.c2p(u, v, np.exp(-(u * u + v * v))),
            u_range=[-2.5, 2.5],
            v_range=[-2.5, 2.5],
            resolution=(36, 36),
            stroke_width=0,
            fill_color=BLUE,
            fill_opacity=0.6,
        )
        self.set_camera_orientation(phi=68 * DEGREES, theta=-55 * DEGREES, zoom=0.85)
        self.play(Create(axes3d), run_time=1.0)
        self.play(Create(surface), run_time=2.0)
        self.begin_ambient_camera_rotation(rate=0.20)
        self.wait(2.0)
        self.stop_ambient_camera_rotation()

        # ─────── Beat 4: polar transformation overlay ──────────────────────
        # Concentric circles at z = 0 to suggest polar slicing
        circles = VGroup()
        for r in np.linspace(0.4, 2.2, 6):
            c = ParametricFunction(
                lambda t, rr=r: axes3d.c2p(rr * np.cos(t), rr * np.sin(t), 0.001),
                t_range=[0, 2 * PI],
                color=YELLOW, stroke_width=2.5, stroke_opacity=0.9,
            )
            circles.add(c)
        self.play(Create(circles, lag_ratio=0.15), run_time=1.6)

        polar_caption = Tex(
            r"Switch to polar: \ $dA = r\,dr\,d\theta$ \ (the Jacobian gives an extra $r$\,!)",
            font_size=28, color=YELLOW,
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(polar_caption)
        self.play(Write(polar_caption), run_time=1.6)
        self.wait(1.0)

        # ─────── Beat 5: evaluate ──────────────────────────────────────────
        self.play(FadeOut(polar_caption), run_time=0.4)
        self.remove(polar_caption)

        eval_lines = VGroup(
            MathTex(r"I^{2} = \int_{0}^{2\pi}\!\!\int_{0}^{\infty} e^{-r^{2}}\,r\,dr\,d\theta",
                    font_size=36, color=WHITE),
            MathTex(r"= \;2\pi \cdot \tfrac{1}{2} \;=\; \pi",
                    font_size=40, color=YELLOW),
            MathTex(r"\boxed{\;I \;=\; \sqrt{\pi}\;}",
                    font_size=52, color=GREEN),
        ).arrange(DOWN, buff=0.4).to_edge(DOWN, buff=0.4)
        self.add_fixed_in_frame_mobjects(eval_lines)

        for line in eval_lines:
            self.play(Write(line), run_time=1.2)
            self.wait(0.4)

        self.wait(1.6)
