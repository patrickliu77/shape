"""Difference of squares: a^2 - b^2 = (a - b)(a + b).

Cut a small b-by-b square out of a big a-by-a square. The L-shaped
leftover rearranges into a single (a+b) by (a-b) rectangle.

Render:
    uv run manim -ql alg_02_diff_squares.py DiffSquares
"""

from manim import *


class DiffSquares(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex("a^2 - b^2 = (a - b)(a + b)",
                        font_size=42, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        a = 2.6
        b = 1.0

        # Big square (a x a) with the small square (b x b) cut out
        # We'll first show the big square, then highlight the b-square.
        big = Square(side_length=a, color=BLUE, stroke_width=3,
                     fill_color=BLUE, fill_opacity=0.35)
        big.move_to([-3.0, -0.2, 0])

        small = Square(side_length=b, color=RED, stroke_width=2,
                       fill_color=RED, fill_opacity=0.55)
        small.align_to(big, UP).align_to(big, RIGHT)

        a_lab = MathTex("a", font_size=28, color=YELLOW).next_to(big, DOWN, buff=0.1)
        a_lab2 = MathTex("a", font_size=28, color=YELLOW).next_to(big, LEFT, buff=0.1)
        b_lab = MathTex("b", font_size=22, color=YELLOW).next_to(small, UP, buff=0.05)

        self.play(Create(big), Write(a_lab), Write(a_lab2), run_time=1.2)
        self.play(Create(small), Write(b_lab), run_time=0.8)
        self.wait(0.4)

        big_area = MathTex("a^2 - b^2", font_size=30, color=WHITE).move_to(
            big.get_center() + DOWN * 0.4
        )
        self.play(Write(big_area), run_time=0.7)
        self.wait(0.6)

        # The L-shape decomposes into two rectangles:
        # - top strip: width (a - b), height b, sitting at the top-left
        # - bottom rect: width a, height (a - b), at the bottom
        # Highlight them.
        top_strip = Rectangle(width=a - b, height=b, color=GREEN,
                              fill_color=GREEN, fill_opacity=0.45, stroke_width=2)
        top_strip.align_to(big, UP).align_to(big, LEFT)
        bot_rect = Rectangle(width=a, height=a - b, color=ORANGE,
                             fill_color=ORANGE, fill_opacity=0.45, stroke_width=2)
        bot_rect.align_to(big, DOWN).align_to(big, LEFT)
        self.play(FadeOut(small), FadeOut(big_area),
                  FadeIn(top_strip), FadeIn(bot_rect), run_time=1.0)
        self.wait(0.4)

        # Now slide them apart and rearrange into one rectangle on the right
        # of dimensions (a + b) by (a - b).
        target_rect = Rectangle(width=a + b, height=a - b,
                                color=WHITE, stroke_width=3)
        target_rect.move_to([2.5, -0.6, 0])

        # Build target sub-rectangles whose union is target_rect:
        # Left part = bot_rect (a × (a-b)) flush left
        bot_target = Rectangle(width=a, height=a - b, color=ORANGE,
                               fill_color=ORANGE, fill_opacity=0.45, stroke_width=2)
        bot_target.align_to(target_rect, LEFT).align_to(target_rect, UP)

        # Right part = top_strip rotated/oriented as ((a-b) × b) but we need
        # ((a+b) - a) × (a-b) = b × (a-b). The top_strip is currently
        # (a-b) × b, so rotate 90°.
        top_target = Rectangle(width=b, height=a - b, color=GREEN,
                               fill_color=GREEN, fill_opacity=0.45, stroke_width=2)
        top_target.next_to(bot_target, RIGHT, buff=0)

        self.play(Transform(bot_rect, bot_target),
                  Transform(top_strip, top_target), run_time=1.6)
        self.play(Create(target_rect), run_time=0.8)

        # Side labels
        ab_brace = Brace(target_rect, DOWN, color=YELLOW)
        ab_lab = MathTex("a + b", font_size=28, color=YELLOW).next_to(ab_brace, DOWN, buff=0.05)
        amb_brace = Brace(target_rect, RIGHT, color=YELLOW)
        amb_lab = MathTex("a - b", font_size=28, color=YELLOW).next_to(amb_brace, RIGHT, buff=0.05)
        self.play(GrowFromCenter(ab_brace), Write(ab_lab),
                  GrowFromCenter(amb_brace), Write(amb_lab), run_time=1.2)
        self.wait(0.6)

        equation = MathTex(
            r"a^2 - b^2 \;=\; (a - b)(a + b)",
            font_size=36, color=WHITE,
        ).to_edge(DOWN, buff=0.4)
        self.play(Write(equation), run_time=1.4)
        self.wait(1.6)
