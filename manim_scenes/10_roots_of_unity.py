"""n-th roots of unity: solutions of z^n = 1 are evenly spaced on the unit
circle. We sweep n through 2, 3, 4, 5, 6, 8 — each time placing the n
points at angles 2πk/n.

Tightened to ~5 seconds total. The setup is brisk and the n-sweep is the
star: each transition is a smooth Transform with no pause between, so the
polygon visibly grows new vertices without choppy stops.

Render:
    uv run manim -ql 10_roots_of_unity.py RootsOfUnity
"""

from manim import *
import numpy as np


def angle(k, n):
    return 2 * PI * k / n


class RootsOfUnity(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex(
            r"$z^{n} = 1$ \ \ \ has $n$ solutions, evenly spaced on the unit circle.",
            font_size=34, color=WHITE,
        ).to_edge(UP)
        self.play(Write(title), run_time=0.4)

        plane = NumberPlane(
            x_range=[-1.6, 1.6, 1],
            y_range=[-1.6, 1.6, 1],
            x_length=6,
            y_length=6,
            background_line_style={"stroke_color": "#404040", "stroke_width": 1, "stroke_opacity": 0.6},
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).to_edge(LEFT, buff=0.5).shift(DOWN * 0.3)
        circle = Circle(radius=plane.x_axis.unit_size, color=BLUE, stroke_width=2).move_to(plane.c2p(0, 0))

        re_lab = MathTex(r"\Re", color=WHITE, font_size=22).next_to(plane.c2p(1.55, 0), RIGHT, buff=0.05)
        im_lab = MathTex(r"\Im", color=WHITE, font_size=22).next_to(plane.c2p(0, 1.55), UP, buff=0.05)

        self.play(Create(plane), Create(circle), FadeIn(re_lab), FadeIn(im_lab), run_time=0.4)

        # Right side: equation showing the formula for the k-th root
        formula = MathTex(
            r"z_k = \cos\!\left(\tfrac{2\pi k}{n}\right) + i\,\sin\!\left(\tfrac{2\pi k}{n}\right)",
            font_size=30, color=YELLOW,
        ).next_to(plane, RIGHT, buff=0.7).shift(UP * 1.6)

        n_label = MathTex(r"n = 2", font_size=46, color=YELLOW).next_to(formula, DOWN, buff=0.6)
        self.play(FadeIn(formula), FadeIn(n_label), run_time=0.4)

        def roots_for(n):
            dots = VGroup()
            spokes = VGroup()
            for k in range(n):
                ang = angle(k, n)
                pt = plane.c2p(np.cos(ang), np.sin(ang))
                dots.add(Dot(pt, color=YELLOW, radius=0.09))
                spokes.add(Line(plane.c2p(0, 0), pt, color=YELLOW, stroke_width=2.5, stroke_opacity=0.8))
            return spokes, dots

        # Sweep n: brisk smooth transforms, no waits between, so the
        # polygon visibly morphs through 2 → 3 → 4 → 5 → 6 → 8 in one
        # continuous gesture.
        ns = [2, 3, 4, 5, 6, 8]
        prev_spokes = None
        prev_dots = None
        prev_label = n_label

        for i, n in enumerate(ns):
            new_spokes, new_dots = roots_for(n)
            new_label = MathTex(rf"n = {n}", font_size=46, color=YELLOW).move_to(prev_label)

            if prev_spokes is None:
                self.play(
                    Create(new_spokes),
                    FadeIn(new_dots),
                    Transform(prev_label, new_label),
                    run_time=0.45, rate_func=smooth,
                )
                prev_spokes = new_spokes
                prev_dots = new_dots
            else:
                self.play(
                    Transform(prev_spokes, new_spokes),
                    Transform(prev_dots, new_dots),
                    Transform(prev_label, new_label),
                    run_time=0.45, rate_func=smooth,
                )

        closing = Tex(
            r"For any $n$, the roots form a regular $n$-gon inscribed in the unit circle.",
            font_size=28, color=YELLOW,
        ).to_edge(DOWN)
        self.play(Write(closing), run_time=0.5)
        self.wait(0.4)
