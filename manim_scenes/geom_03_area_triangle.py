"""Area of a triangle = 1/2 base * height. We show the triangle inside a
rectangle of the same base and height, then prove visually that the
triangle takes up exactly half.

Render:
    uv run manim -ql geom_03_area_triangle.py AreaTriangle
"""

from manim import *


class AreaTriangle(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(r"A = \tfrac{1}{2}\, b \, h",
                        font_size=44, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        base = 4.5
        height = 2.5
        # Triangle vertices
        A = LEFT * (base / 2) + DOWN * (height / 2)
        B = RIGHT * (base / 2) + DOWN * (height / 2)
        # apex placed somewhere over the base
        C = LEFT * (base / 6) + UP * (height / 2)

        triangle = Polygon(A, B, C, color=WHITE, stroke_width=3,
                           fill_color=BLUE, fill_opacity=0.45)
        self.play(Create(triangle), run_time=1.0)

        # Base label
        base_brace = Brace(Line(A, B), DOWN, color=YELLOW)
        base_lab = MathTex("b", font_size=32, color=YELLOW).next_to(base_brace, DOWN, buff=0.05)
        # Height: vertical dashed line from apex to base
        foot = np.array([C[0], A[1], 0])
        h_line = DashedLine(C, foot, color=GREEN, stroke_width=3)
        h_brace = Brace(Line(foot, C), LEFT, color=GREEN, buff=0.05)
        h_lab = MathTex("h", font_size=32, color=GREEN).next_to(h_brace, LEFT, buff=0.05)

        self.play(GrowFromCenter(base_brace), Write(base_lab), run_time=0.8)
        self.play(Create(h_line), GrowFromCenter(h_brace), Write(h_lab), run_time=1.0)
        self.wait(0.5)

        # Now reveal the bounding rectangle
        rect = Rectangle(width=base, height=height, color=WHITE, stroke_width=2,
                         fill_color=YELLOW, fill_opacity=0.10)
        rect.move_to(ORIGIN)
        rect_lab = MathTex(r"b \times h", font_size=32, color=YELLOW).next_to(
            rect, UP, buff=0.15
        )
        self.play(Create(rect), Write(rect_lab), run_time=1.2)
        self.wait(0.4)

        # Highlight the two leftover triangles that, together, equal the
        # original — proving the triangle is half the rectangle.
        # Left leftover: vertices A, C, top-left of rect
        TL = LEFT * (base / 2) + UP * (height / 2)
        TR = RIGHT * (base / 2) + UP * (height / 2)
        leftover_left = Polygon(A, TL, C, color=RED, stroke_width=2,
                                fill_color=RED, fill_opacity=0.35)
        leftover_right = Polygon(C, TR, B, color=RED, stroke_width=2,
                                 fill_color=RED, fill_opacity=0.35)
        self.play(Create(leftover_left), Create(leftover_right), run_time=1.0)
        self.wait(0.6)

        punch = Tex(
            r"The two red pieces together equal the blue triangle — \\"
            r"so the triangle is exactly \emph{half} the rectangle.",
            font_size=28, color=WHITE,
        ).to_edge(DOWN, buff=0.4)
        self.play(Write(punch), run_time=1.6)
        self.wait(1.8)
