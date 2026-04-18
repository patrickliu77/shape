"""Determinant of a 2x2 matrix = signed area of the parallelogram its columns span.

We start with the unit square (det=1), then morph through three matrices:
  shear   [[1,1],[0,1]]    det = 1   (area unchanged, shape changes)
  scale   [[1.5,0],[0,2]]  det = 3   (area triples)
  flip    [[1,0],[1,-1]]   det = -1  (orientation reverses)

Render:
    uv run manim -ql 06_determinant.py Determinant
"""

from manim import *
import numpy as np


def make_parallelogram(plane, M, color):
    """Square [0,1]² mapped through M, returned as a Polygon on `plane`."""
    cols = np.array(M)  # 2x2
    p00 = np.zeros(2)
    p10 = cols @ np.array([1, 0])
    p11 = cols @ np.array([1, 1])
    p01 = cols @ np.array([0, 1])
    return Polygon(
        plane.c2p(*p00), plane.c2p(*p10), plane.c2p(*p11), plane.c2p(*p01),
        color=color, fill_color=color, fill_opacity=0.35, stroke_width=3,
    )


class Determinant(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex(r"Determinant $=$ signed area of $A$'s parallelogram",
                    font_size=32, color=WHITE).to_edge(UP)
        self.play(Write(title))

        plane = NumberPlane(
            x_range=[-1.5, 3.5, 1],
            y_range=[-1.5, 3, 1],
            x_length=8,
            y_length=5,
            background_line_style={"stroke_color": "#404040", "stroke_width": 1, "stroke_opacity": 0.6},
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).shift(DOWN * 0.3)

        self.play(Create(plane), run_time=1.2)

        # Start: identity (unit square)
        I = [[1, 0], [0, 1]]
        square = make_parallelogram(plane, I, color=BLUE)

        # Column vector arrows
        def col_arrows(M, c1=ORANGE, c2=GREEN):
            cols = np.array(M)
            v1 = cols @ np.array([1, 0])
            v2 = cols @ np.array([0, 1])
            a1 = Arrow(plane.c2p(0, 0), plane.c2p(*v1), buff=0,
                       color=c1, max_tip_length_to_length_ratio=0.18, stroke_width=4)
            a2 = Arrow(plane.c2p(0, 0), plane.c2p(*v2), buff=0,
                       color=c2, max_tip_length_to_length_ratio=0.18, stroke_width=4)
            return a1, a2

        a1, a2 = col_arrows(I)
        det_label = MathTex("\\det = 1.00", color=YELLOW, font_size=40).to_corner(UR).shift(LEFT * 0.3 + DOWN * 0.4)

        self.play(FadeIn(square), Create(a1), Create(a2), Write(det_label), run_time=1.2)
        self.wait(0.5)

        # Morph through a sequence of matrices, updating square + arrows + det readout
        matrices = [
            ("shear",    [[1, 1], [0, 1]]),     # det = 1 (area unchanged)
            ("scale",    [[1.5, 0], [0, 2]]),   # det = 3 (area triples)
            ("flip",     [[1, 0], [1, -1]]),    # det = -1
            ("collapse", [[1, 1], [1, 1]]),     # det = 0
        ]

        for name, M in matrices:
            d = float(np.linalg.det(M))
            new_square = make_parallelogram(plane, M, color=BLUE if d > 0 else (RED if d < 0 else GREY))
            new_a1, new_a2 = col_arrows(M)
            new_det = MathTex(f"\\det = {d:.2f}", color=YELLOW, font_size=40).move_to(det_label)

            self.play(
                Transform(square, new_square),
                Transform(a1, new_a1),
                Transform(a2, new_a2),
                Transform(det_label, new_det),
                run_time=1.6,
            )
            tag = Tex(name, font_size=26, color=WHITE).next_to(new_det, DOWN, aligned_edge=RIGHT, buff=0.15)
            self.play(FadeIn(tag), run_time=0.4)
            self.wait(0.6)
            self.play(FadeOut(tag), run_time=0.3)

        closing = Tex(r"Negative det = orientation flipped. Zero det = squashed to a line.",
                      font_size=26, color=YELLOW).to_edge(DOWN)
        self.play(Write(closing))
        self.wait(1.5)
