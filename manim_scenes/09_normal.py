"""Normal distribution N(μ, σ²) — animate μ shift then σ stretch.

Shows the bell curve formula, then animates μ sweeping left↔right while σ
stays at 1, then σ sweeping wide↔narrow while μ stays at 0. The shaded area
under the curve is always exactly 1 — driven home by a live readout.

Render:
    uv run manim -ql 09_normal.py NormalDistribution
"""

from manim import *
import numpy as np


def normal_pdf(x, mu, sigma):
    return np.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * np.sqrt(2 * np.pi))


class NormalDistribution(ThreeDScene):
    def construct(self):
        config.background_color = "#111216"
        # 2D scene, but we extend ThreeDScene only for camera consistency.
        self.set_camera_orientation(phi=0, theta=-90 * DEGREES)

        # Title with the normal-distribution formula
        title = MathTex(
            r"f(x \mid \mu,\sigma) \;=\; \frac{1}{\sigma\sqrt{2\pi}}\, e^{-(x-\mu)^2/(2\sigma^2)}",
            font_size=34, color=WHITE,
        ).to_edge(UP)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.4)

        axes = Axes(
            x_range=[-6, 6, 1],
            y_range=[0, 1.5, 0.5],
            x_length=10,
            y_length=4,
            tips=False,
            axis_config={"stroke_color": "#888888", "include_numbers": False},
        ).shift(DOWN * 0.6)
        self.play(Create(axes), run_time=1.0)

        # Trackers for mean and standard deviation
        mu = ValueTracker(0.0)
        sigma = ValueTracker(1.0)

        bell = always_redraw(
            lambda: axes.plot(
                lambda x: normal_pdf(x, mu.get_value(), sigma.get_value()),
                x_range=[-6, 6],
                color=BLUE, stroke_width=4,
            )
        )
        area = always_redraw(
            lambda: axes.get_area(
                axes.plot(
                    lambda x: normal_pdf(x, mu.get_value(), sigma.get_value()),
                    x_range=[-6, 6], color=BLUE,
                ),
                x_range=[-6, 6], color=BLUE, opacity=0.30,
            )
        )

        # Live readouts of μ and σ in the corner
        mu_value = DecimalNumber(0.0, num_decimal_places=2, color=YELLOW, font_size=30)
        mu_value.add_updater(lambda m: m.set_value(mu.get_value()))
        mu_box = VGroup(MathTex(r"\mu = ", color=YELLOW, font_size=30), mu_value).arrange(RIGHT, buff=0.1)

        sig_value = DecimalNumber(1.0, num_decimal_places=2, color=GREEN, font_size=30)
        sig_value.add_updater(lambda m: m.set_value(sigma.get_value()))
        sig_box = VGroup(MathTex(r"\sigma = ", color=GREEN, font_size=30), sig_value).arrange(RIGHT, buff=0.1)

        readout = VGroup(mu_box, sig_box).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        readout.to_corner(UR).shift(LEFT * 0.4 + DOWN * 0.7)
        self.add_fixed_in_frame_mobjects(readout)

        # The "area = 1" fact, also fixed in frame
        area_label = MathTex(r"\int_{-\infty}^{\infty} f(x)\,dx \;=\; 1",
                             font_size=30, color=YELLOW)
        area_label.to_corner(UL).shift(RIGHT * 0.4 + DOWN * 0.7)
        self.add_fixed_in_frame_mobjects(area_label)

        self.play(Create(bell), FadeIn(area), Write(readout), Write(area_label), run_time=1.4)
        self.wait(0.6)

        # ───────── Beat 1: shift μ left then right ──────────────────────────
        beat1 = Tex("Sliding $\\mu$ moves the bell left and right.",
                    font_size=30, color=YELLOW).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(beat1)
        self.play(Write(beat1), run_time=0.9)
        self.play(mu.animate.set_value(-2.5), run_time=2.0, rate_func=smooth)
        self.play(mu.animate.set_value(2.5),  run_time=2.5, rate_func=smooth)
        self.play(mu.animate.set_value(0.0),  run_time=1.5, rate_func=smooth)
        self.play(FadeOut(beat1), run_time=0.4)
        self.remove(beat1)

        # ───────── Beat 2: pinch σ small first, then stretch wide ──────────
        # Order chosen to match the narration: "small σ gives a sharp tall
        # spike, large σ gives a wide gentle hill." So the curve narrows,
        # then widens, then settles back to σ = 1.
        beat2 = Tex("Sliding $\\sigma$ pinches it tall or stretches it wide.",
                    font_size=30, color=YELLOW).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(beat2)
        self.play(Write(beat2), run_time=0.9)
        self.play(sigma.animate.set_value(0.45), run_time=2.5, rate_func=smooth)
        self.play(sigma.animate.set_value(2.2),  run_time=2.5, rate_func=smooth)
        self.play(sigma.animate.set_value(1.0),  run_time=1.5, rate_func=smooth)
        self.play(FadeOut(beat2), run_time=0.4)
        self.remove(beat2)

        mu_value.clear_updaters()
        sig_value.clear_updaters()

        closing = Tex(
            r"The area under the curve always equals 1 — that's the $\sqrt{\pi}$ from Gauss at work.",
            font_size=28, color=YELLOW,
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(closing)
        self.play(Write(closing), run_time=1.4)
        self.wait(1.6)
