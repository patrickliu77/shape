"""Triangle angle sum theorem: alpha + beta + gamma = 180 degrees.

We draw a triangle with angle wedges, then slide the wedges together to
reconstruct a straight line.

Render:
    uv run manim -ql geom_02_angle_sum.py AngleSum
"""

from manim import *
import numpy as np


class AngleSum(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(r"\alpha + \beta + \gamma = 180^\circ",
                        font_size=42, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        # Triangle vertices
        A = LEFT * 2.5 + DOWN * 1.0
        B = RIGHT * 2.5 + DOWN * 1.0
        C = UP * 1.6 + LEFT * 0.4

        triangle = Polygon(A, B, C, color=WHITE, stroke_width=3,
                           fill_color=BLUE_E, fill_opacity=0.2)
        self.play(Create(triangle), run_time=1.0)

        # Angle wedges at each vertex
        def angle_arc(p_v, p_a, p_b, color, radius=0.5):
            v1 = p_a - p_v
            v2 = p_b - p_v
            a1 = np.arctan2(v1[1], v1[0])
            a2 = np.arctan2(v2[1], v2[0])
            # ensure we sweep the interior angle (smallest signed)
            d = (a2 - a1) % (2 * PI)
            if d > PI:
                a1, a2 = a2, a1
                d = (a2 - a1) % (2 * PI)
            return Sector(
                radius=radius,
                start_angle=a1,
                angle=d,
                color=color,
                fill_color=color,
                fill_opacity=0.55,
                stroke_width=2,
            ).move_arc_center_to(p_v)

        wedge_A = angle_arc(A, B, C, YELLOW)
        wedge_B = angle_arc(B, C, A, GREEN)
        wedge_C = angle_arc(C, A, B, RED)

        a_lab = MathTex(r"\alpha", font_size=30, color=YELLOW).move_to(A + RIGHT * 0.85 + UP * 0.2)
        b_lab = MathTex(r"\beta", font_size=30, color=GREEN).move_to(B + LEFT * 0.85 + UP * 0.2)
        c_lab = MathTex(r"\gamma", font_size=30, color=RED).move_to(C + DOWN * 0.55)

        self.play(
            FadeIn(wedge_A), FadeIn(wedge_B), FadeIn(wedge_C),
            Write(a_lab), Write(b_lab), Write(c_lab),
            run_time=1.4,
        )
        self.wait(0.6)

        # Now show the wedges sliding down to the bottom and lining up
        # along a horizontal line, totalling 180°.
        line_y = -2.6
        line_x_start = -3.2

        copies = []
        for wedge, color, label in [
            (wedge_A, YELLOW, r"\alpha"),
            (wedge_B, GREEN, r"\beta"),
            (wedge_C, RED, r"\gamma"),
        ]:
            copy = wedge.copy()
            copies.append((copy, color, label))

        baseline = Line([line_x_start - 0.2, line_y, 0],
                        [-line_x_start + 0.2, line_y, 0],
                        color=WHITE, stroke_width=3)
        baseline_label = MathTex(r"180^\circ", font_size=30, color=WHITE).next_to(
            baseline, RIGHT, buff=0.2
        )

        self.play(Create(baseline), Write(baseline_label), run_time=0.8)

        # Approximate angles (in radians) from the actual triangle so the
        # arrangement is geometrically honest.
        def interior_angle(v, p1, p2):
            u = p1 - v
            w = p2 - v
            return float(np.arccos(np.clip(np.dot(u, w) /
                                            (np.linalg.norm(u) * np.linalg.norm(w)),
                                            -1, 1)))
        ang_a = interior_angle(A, B, C)
        ang_b = interior_angle(B, C, A)
        ang_c = interior_angle(C, A, B)

        # Build three wedges that share a single centre on the baseline and
        # sweep CONSECUTIVELY from 0 to π. Together they tile a half-disc,
        # making the "α + β + γ = 180°" identity literally visible.
        flat_radius = 1.4
        center = np.array([0.0, line_y, 0.0])
        cumulative = 0.0
        flat_wedges = []
        for ang, color in [(ang_a, YELLOW), (ang_b, GREEN), (ang_c, RED)]:
            flat = Sector(
                radius=flat_radius,
                start_angle=cumulative,
                angle=ang,
                color=color,
                fill_color=color,
                fill_opacity=0.55,
                stroke_width=2,
            )
            flat.move_arc_center_to(center)
            cumulative += ang
            flat_wedges.append(flat)

        # Animate copies of the original wedges transforming into the flat ones
        anims = []
        for (copy, _, _), flat in zip(copies, flat_wedges):
            self.add(copy)
            anims.append(Transform(copy, flat))
        self.play(*anims, run_time=2.0)
        self.wait(1.0)

        punch = Tex(
            r"Three corners of \emph{any} triangle line up into a straight line.",
            font_size=28, color=WHITE,
        ).to_edge(DOWN, buff=0.2)
        self.play(Write(punch), run_time=1.4)
        self.wait(1.6)
