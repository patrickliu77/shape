"""Distributive property: a(b + c) = ab + ac.

We picture an a-by-(b+c) rectangle, then split it horizontally into the
sum of an a-by-b rectangle and an a-by-c rectangle.

Render:
    uv run manim -ql alg_01_distributive.py Distributive
"""

from manim import *


class Distributive(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex("a(b + c) = a b + a c",
                        font_size=44, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        a = 1.6
        b = 2.4
        c = 1.6

        # Big rectangle: width a, height (b + c)
        big = Rectangle(width=a, height=b + c, color=BLUE, stroke_width=3,
                        fill_color=BLUE, fill_opacity=0.35)
        big.move_to([-2.5, 0, 0])
        big_w = MathTex("a", font_size=30, color=YELLOW).next_to(big, DOWN, buff=0.1)
        big_h_brace = Brace(big, RIGHT, color=GREEN)
        big_h = MathTex("b + c", font_size=30, color=GREEN).next_to(big_h_brace, RIGHT, buff=0.1)
        big_area = MathTex(r"a(b + c)", font_size=32, color=WHITE).move_to(big.get_center())

        self.play(Create(big), Write(big_w), GrowFromCenter(big_h_brace), Write(big_h), run_time=1.2)
        self.play(Write(big_area), run_time=0.6)
        self.wait(0.8)

        # Split it: top part of height b is the "ab" rectangle, bottom of
        # height c is the "ac" rectangle. Slide them apart to the right.
        top_rect = Rectangle(width=a, height=b, color=YELLOW, stroke_width=3,
                             fill_color=YELLOW, fill_opacity=0.35)
        top_rect.move_to([2.0, b / 2 + 0.3, 0])
        top_label = MathTex("a b", font_size=30, color=YELLOW).move_to(top_rect.get_center())
        top_b_brace = Brace(top_rect, RIGHT, color=GREEN)
        top_b_lab = MathTex("b", font_size=26, color=GREEN).next_to(top_b_brace, RIGHT, buff=0.05)

        bot_rect = Rectangle(width=a, height=c, color=RED, stroke_width=3,
                             fill_color=RED, fill_opacity=0.35)
        bot_rect.move_to([2.0, -c / 2 - 0.3, 0])
        bot_label = MathTex("a c", font_size=30, color=RED).move_to(bot_rect.get_center())
        bot_c_brace = Brace(bot_rect, RIGHT, color=GREEN)
        bot_c_lab = MathTex("c", font_size=26, color=GREEN).next_to(bot_c_brace, RIGHT, buff=0.05)

        # Make the split visible inside the big rectangle first
        split_line = Line(
            big.get_corner(UR) + DOWN * c,
            big.get_corner(UL) + DOWN * c,
            color=WHITE, stroke_width=2, stroke_opacity=0.6,
        )
        self.play(Create(split_line), run_time=0.6)
        self.play(FadeOut(big_area), run_time=0.3)
        self.play(
            Create(top_rect), Write(top_label),
            GrowFromCenter(top_b_brace), Write(top_b_lab),
            Create(bot_rect), Write(bot_label),
            GrowFromCenter(bot_c_brace), Write(bot_c_lab),
            run_time=1.6,
        )
        self.wait(0.6)

        # Equation reveal at the bottom
        equation = MathTex(
            r"a(b + c) \;=\; a b + a c",
            font_size=44, color=WHITE,
        ).to_edge(DOWN, buff=0.6)
        self.play(Write(equation), run_time=1.4)
        self.wait(1.6)
