"""Pythagorean theorem: a^2 + b^2 = c^2 visualised by squares on the sides
of a right triangle.

Render:
    uv run manim -ql geom_01_pythagoras.py Pythagoras
"""

from manim import *


class Pythagoras(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex(r"a^2 + b^2 = c^2", font_size=44, color=WHITE).to_edge(
            UP, buff=0.4
        )
        self.play(Write(title), run_time=1.0)

        # Right triangle with legs 3 and 4 (hypotenuse 5) — classic 3-4-5
        a, b = 1.5, 2.0
        # corners (right angle at origin)
        A = ORIGIN
        B = RIGHT * a
        C = UP * b
        triangle = Polygon(A, B, C, color=WHITE, stroke_width=3, fill_color=BLUE_E, fill_opacity=0.25)
        triangle.shift(LEFT * 1.0 + DOWN * 0.5)
        self.play(Create(triangle), run_time=1.0)

        # Side labels
        a_lab = MathTex("a", font_size=32, color=YELLOW).next_to(triangle, DOWN, buff=0.1)
        b_lab = MathTex("b", font_size=32, color=GREEN).next_to(triangle, LEFT, buff=0.1)
        # hypotenuse label aligned with the slanted side
        slant_mid = (triangle.get_vertices()[1] + triangle.get_vertices()[2]) / 2
        c_lab = MathTex("c", font_size=32, color=RED).move_to(slant_mid + UP * 0.2 + RIGHT * 0.25)
        self.play(Write(a_lab), Write(b_lab), Write(c_lab), run_time=1.0)
        self.wait(0.4)

        # Build the three squares on the sides
        verts = triangle.get_vertices()  # A_t, B_t, C_t (after shift)
        At, Bt, Ct = verts[0], verts[1], verts[2]

        # Square on side a (bottom): below side AB
        square_a = Square(side_length=a, color=YELLOW, fill_color=YELLOW, fill_opacity=0.3, stroke_width=2)
        square_a.move_to((At + Bt) / 2 + DOWN * (a / 2))
        a_sq_lab = MathTex("a^2", font_size=36, color=YELLOW).move_to(square_a.get_center())

        # Square on side b (left): left of side AC
        square_b = Square(side_length=b, color=GREEN, fill_color=GREEN, fill_opacity=0.3, stroke_width=2)
        square_b.move_to((At + Ct) / 2 + LEFT * (b / 2))
        b_sq_lab = MathTex("b^2", font_size=36, color=GREEN).move_to(square_b.get_center())

        # Square on hypotenuse (slanted): build from the vector along BC
        c_vec = Ct - Bt
        c_len = float(np.linalg.norm(c_vec))
        c_ang = np.arctan2(c_vec[1], c_vec[0])
        square_c = Square(side_length=c_len, color=RED, fill_color=RED, fill_opacity=0.3, stroke_width=2)
        # Place it on the OUTSIDE of the triangle (rotate around BC midpoint)
        # default Square is centered at origin; orient along BC then translate
        square_c.rotate(c_ang - PI / 2)
        # outward normal: perpendicular to c_vec, pointing away from A
        perp = np.array([c_vec[1], -c_vec[0], 0.0]) / c_len
        # check orientation: should point away from A
        if np.dot(perp, At - (Bt + Ct) / 2) > 0:
            perp = -perp
        square_c.move_to((Bt + Ct) / 2 + perp * (c_len / 2))
        c_sq_lab = MathTex("c^2", font_size=36, color=RED).move_to(square_c.get_center())

        self.play(Create(square_a), Write(a_sq_lab), run_time=1.0)
        self.play(Create(square_b), Write(b_sq_lab), run_time=1.0)
        self.play(Create(square_c), Write(c_sq_lab), run_time=1.2)
        self.wait(0.6)

        # Final equation flashes
        equation = MathTex(
            r"\underbrace{a^2}_{\text{yellow}} + \underbrace{b^2}_{\text{green}} = \underbrace{c^2}_{\text{red}}",
            font_size=34, color=WHITE,
        ).to_edge(DOWN, buff=0.6)
        self.play(Write(equation), run_time=1.6)
        self.wait(1.6)
