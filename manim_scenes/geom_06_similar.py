"""Similar triangles: corresponding sides are proportional, corresponding
angles are equal. We start with a small triangle and scale it to a bigger
one, showing the side ratios match.

Render:
    uv run manim -ql geom_06_similar.py SimilarTriangles
"""

from manim import *


class SimilarTriangles(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(
            r"\frac{a}{a'} = \frac{b}{b'} = \frac{c}{c'}",
            font_size=44, color=WHITE,
        ).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        # Small triangle on the left
        scale_small = 1.0
        A1 = LEFT * 4.0 + DOWN * 0.6
        B1 = A1 + RIGHT * 1.4 * scale_small
        C1 = A1 + RIGHT * 0.4 * scale_small + UP * 1.0 * scale_small
        small = Polygon(A1, B1, C1, color=BLUE, stroke_width=3,
                        fill_color=BLUE, fill_opacity=0.4)
        a_lab = MathTex("a", font_size=26, color=YELLOW).move_to((B1 + C1) / 2 + RIGHT * 0.18)
        b_lab = MathTex("b", font_size=26, color=GREEN).move_to((A1 + C1) / 2 + LEFT * 0.18)
        c_lab = MathTex("c", font_size=26, color=RED).move_to((A1 + B1) / 2 + DOWN * 0.18)
        self.play(Create(small), Write(a_lab), Write(b_lab), Write(c_lab), run_time=1.2)
        self.wait(0.4)

        # Larger triangle: same shape, scaled by k = 2 to the right
        k = 2.0
        A2 = RIGHT * 1.0 + DOWN * 1.4
        B2 = A2 + RIGHT * 1.4 * k
        C2 = A2 + RIGHT * 0.4 * k + UP * 1.0 * k
        large = Polygon(A2, B2, C2, color=ORANGE, stroke_width=3,
                        fill_color=ORANGE, fill_opacity=0.35)
        ap_lab = MathTex("a'", font_size=30, color=YELLOW).move_to((B2 + C2) / 2 + RIGHT * 0.25)
        bp_lab = MathTex("b'", font_size=30, color=GREEN).move_to((A2 + C2) / 2 + LEFT * 0.25)
        cp_lab = MathTex("c'", font_size=30, color=RED).move_to((A2 + B2) / 2 + DOWN * 0.25)
        self.play(Create(large), Write(ap_lab), Write(bp_lab), Write(cp_lab), run_time=1.2)
        self.wait(0.4)

        # Ratio readout
        ratios = MathTex(
            r"\frac{a}{a'} \;=\; \frac{b}{b'} \;=\; \frac{c}{c'} \;=\; k",
            font_size=36, color=WHITE,
        ).to_edge(DOWN, buff=1.0)
        k_label = MathTex(r"k = 2", font_size=32, color=YELLOW).next_to(ratios, DOWN, buff=0.2)
        self.play(Write(ratios), Write(k_label), run_time=1.4)
        self.wait(0.6)

        punch = Tex(
            r"Same shape, scaled by $k$. Every matching side has the same ratio.",
            font_size=26, color=WHITE,
        ).to_edge(DOWN, buff=0.2)
        self.play(Write(punch), run_time=1.4)
        self.wait(1.6)
