"""Chain rule as composition of stretches on three number lines.

Render:
    uv run manim -ql 03_chain_rule.py ChainRule

Pattern reference: BraceAnnotation (for the |..| length brackets), LaggedStart
(for staggered Create), Write/TransformMatchingTex (for the formula reveal).
"""

from manim import *


class ChainRule(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = Tex("Chain rule: stretches compose", font_size=36, color=WHITE).to_edge(UP)
        self.play(Write(title))

        # Three stacked number lines. Lines shortened from 10 → 7 so the
        # MathTex labels on the right have room within the 14.222-unit frame.
        line_x = NumberLine(x_range=[-2, 2, 1], length=7, include_numbers=True, include_tip=False)
        line_u = NumberLine(x_range=[-4, 4, 1], length=7, include_numbers=True, include_tip=False)
        line_y = NumberLine(x_range=[-16, 16, 4], length=7, include_numbers=True, include_tip=False)

        # Shift the whole stack slightly left so the right-side labels fit
        for ln in (line_x, line_u, line_y):
            ln.shift(LEFT * 1.2)
        line_x.shift(UP * 2)
        line_y.shift(DOWN * 2)

        label_x = MathTex("x", color=WHITE, font_size=28).next_to(line_x, RIGHT, buff=0.2)
        label_u = MathTex(r"u = g(x) = 2x", color=BLUE, font_size=26).next_to(line_u, RIGHT, buff=0.2)
        label_y = MathTex(r"y = f(u) = u^2", color=GREEN, font_size=26).next_to(line_y, RIGHT, buff=0.2)

        self.play(LaggedStart(Create(line_x), Create(line_u), Create(line_y), lag_ratio=0.3))
        self.play(LaggedStart(Write(label_x), Write(label_u), Write(label_y), lag_ratio=0.3))

        # Yellow segments highlighting how a small interval on x maps to u then y
        x_start, x_end = 0.4, 0.6
        u_start, u_end = 2 * x_start, 2 * x_end
        y_start, y_end = u_start ** 2, u_end ** 2

        seg_x = Line(line_x.n2p(x_start), line_x.n2p(x_end), color=YELLOW, stroke_width=8)
        seg_u = Line(line_u.n2p(u_start), line_u.n2p(u_end), color=YELLOW, stroke_width=8)
        seg_y = Line(line_y.n2p(y_start), line_y.n2p(y_end), color=YELLOW, stroke_width=8)

        # Brace + length text under each segment
        brace_x = Brace(seg_x, UP, buff=0.05)
        len_x_text = brace_x.get_tex("0.2").set_color(YELLOW)

        self.play(Create(seg_x), GrowFromCenter(brace_x), FadeIn(len_x_text, shift=UP * 0.1))
        self.wait(0.4)

        # Stretch by g'(x) = 2 → arrow from x line to u line, segment lights up on u
        stretch1 = MathTex(r"\times g'(x) = 2", color=BLUE, font_size=30).move_to(
            (line_x.get_center() + line_u.get_center()) / 2 + RIGHT * 3
        )
        arrow1 = Arrow(line_x.n2p((x_start + x_end) / 2), line_u.n2p((u_start + u_end) / 2),
                       color=BLUE, buff=0.1, max_tip_length_to_length_ratio=0.15)
        brace_u = Brace(seg_u, DOWN, buff=0.05)
        len_u_text = brace_u.get_tex("0.4").set_color(YELLOW)

        self.play(Write(stretch1), Create(arrow1))
        self.play(TransformFromCopy(seg_x, seg_u), GrowFromCenter(brace_u), FadeIn(len_u_text, shift=DOWN * 0.1))
        self.wait(0.4)

        # Stretch by f'(u) = 2u = 1.0 (at u≈0.5) → arrow from u to y, segment on y
        stretch2 = MathTex(r"\times f'(u) = 2u \approx 1.0", color=GREEN, font_size=30).move_to(
            (line_u.get_center() + line_y.get_center()) / 2 + RIGHT * 3
        )
        arrow2 = Arrow(line_u.n2p((u_start + u_end) / 2), line_y.n2p((y_start + y_end) / 2),
                       color=GREEN, buff=0.1, max_tip_length_to_length_ratio=0.15)
        brace_y = Brace(seg_y, DOWN, buff=0.05)
        len_y_text = brace_y.get_tex(f"{y_end - y_start:.2f}").set_color(YELLOW)

        self.play(Write(stretch2), Create(arrow2))
        self.play(TransformFromCopy(seg_u, seg_y), GrowFromCenter(brace_y), FadeIn(len_y_text, shift=DOWN * 0.1))
        self.wait(0.6)

        # Reveal the chain rule formula
        self.play(FadeOut(title))
        formula = MathTex(
            r"(f \circ g)'(x) \;=\; f'(g(x)) \cdot g'(x) \;=\; 2u \cdot 2 \;=\; 4u",
            color=ORANGE, font_size=40,
        ).to_edge(UP)
        self.play(Write(formula), run_time=2.0)
        self.play(Indicate(formula, color=ORANGE, scale_factor=1.05))
        self.wait(1.8)
