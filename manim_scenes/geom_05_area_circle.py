"""Area of a circle = pi r^2 via the wedge / rectangle decomposition.

Cut a circle into thin pie wedges, alternate them up and down, and they
straighten into a near-rectangle of width pi*r and height r.

Render:
    uv run manim -ql geom_05_area_circle.py AreaCircle
"""

from manim import *
import numpy as np


class AreaCircle(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex("A = \\pi r^2", font_size=44, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        radius = 1.6
        n = 16  # number of wedges

        # Build the circle decomposed into n wedges around the origin
        wedges = VGroup()
        colors = [BLUE, BLUE_E]
        for k in range(n):
            theta = 2 * PI * k / n
            wedge = Sector(
                radius=radius,
                start_angle=theta,
                angle=2 * PI / n,
                color=colors[k % 2],
                fill_color=colors[k % 2],
                fill_opacity=0.6,
                stroke_width=1,
            )
            wedges.add(wedge)
        wedges.move_to([0, 0.4, 0])

        radius_line = Line(
            wedges.get_center(),
            wedges.get_center() + RIGHT * radius,
            color=YELLOW, stroke_width=3,
        )
        r_lab = MathTex("r", font_size=28, color=YELLOW).next_to(radius_line, UP, buff=0.05)

        self.play(FadeIn(wedges), Create(radius_line), Write(r_lab), run_time=1.2)
        self.wait(0.4)

        self.play(FadeOut(radius_line), FadeOut(r_lab), run_time=0.4)

        # Now move each wedge to its position in the alternating zipper.
        # Even k → pointing up, odd k → pointing down. They sit side by side
        # along a horizontal line.
        line_y = -1.6
        wedge_width = 2 * radius * np.sin(PI / n) * 0.95  # chord-ish base width
        # Total width ≈ pi * r (ish for finite n)
        total_width = wedge_width * n
        x_start = -total_width / 2

        anims = []
        for k, wedge in enumerate(wedges):
            target_x = x_start + (k + 0.5) * wedge_width
            target = Sector(
                radius=radius,
                start_angle=PI / 2 - PI / n,
                angle=2 * PI / n,
                color=wedge.color,
                fill_color=wedge.color,
                fill_opacity=0.6,
                stroke_width=1,
            )
            if k % 2 == 0:
                # Point up: arc on top, point at bottom
                target.rotate(PI)  # flip so point is down
                target.move_to([target_x, line_y + radius / 2, 0])
            else:
                # Point down: arc on bottom, point at top
                target.move_to([target_x, line_y + radius / 2, 0])
            anims.append(Transform(wedge, target))

        self.play(*anims, run_time=2.4)
        self.wait(0.4)

        # Show the rectangle envelope: width pi*r, height r
        rect = Rectangle(
            width=PI * radius, height=radius, color=YELLOW, stroke_width=3,
        ).move_to([0, line_y + radius / 2, 0])
        self.play(Create(rect), run_time=1.0)

        w_lab = MathTex("\\pi r", font_size=32, color=YELLOW).next_to(rect, DOWN, buff=0.1)
        h_lab = MathTex("r", font_size=32, color=YELLOW).next_to(rect, RIGHT, buff=0.1)
        self.play(Write(w_lab), Write(h_lab), run_time=0.8)

        product = MathTex(r"\pi r \times r = \pi r^2",
                          font_size=36, color=YELLOW).to_edge(DOWN, buff=0.4)
        self.play(Write(product), run_time=1.4)
        self.wait(1.6)
