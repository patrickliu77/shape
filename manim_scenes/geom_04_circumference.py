"""Circumference of a circle = 2 pi r. We roll a circle along a line and
mark off the distance it covers in one full turn.

Render:
    uv run manim -ql geom_04_circumference.py Circumference
"""

from manim import *
import numpy as np


class Circumference(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex("C = 2 \\pi r", font_size=44, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        # Ground line
        ground_y = -2.0
        ground = Line([-6, ground_y, 0], [6, ground_y, 0],
                      color=WHITE, stroke_width=2)
        self.play(Create(ground), run_time=0.6)

        radius = 1.0
        # Start position: circle sitting on the ground at x = -4
        start_x = -4.0
        circle = Circle(radius=radius, color=BLUE, stroke_width=3)
        circle.move_to([start_x, ground_y + radius, 0])

        # Mark a point on the circle so the unrolling is visible
        mark = Dot(color=YELLOW, radius=0.07).move_to(
            [start_x, ground_y, 0]  # point of contact at bottom
        )
        # Radius line so we see the rotation
        radius_line = Line(circle.get_center(), mark.get_center(), color=YELLOW, stroke_width=2)

        self.play(Create(circle), FadeIn(mark), Create(radius_line), run_time=0.8)

        # Label r on a static copy
        r_label = MathTex("r", font_size=30, color=YELLOW).move_to(
            circle.get_center() + DOWN * 0.5 + RIGHT * 0.05
        )
        self.play(Write(r_label), run_time=0.5)
        self.wait(0.4)

        # Roll the circle one full turn to the right
        circumference = 2 * PI * radius
        end_x = start_x + circumference

        # Trace path drawn by the marked point (cycloid)
        trace = TracedPath(mark.get_center, stroke_color=YELLOW, stroke_width=3)
        self.add(trace)

        # Animate: circle moves right by circumference and rotates -2*PI
        def update_radius_line(line):
            line.put_start_and_end_on(circle.get_center(), mark.get_center())

        radius_line.add_updater(update_radius_line)

        # Make the mark stick to the rim of the circle as it rolls
        # We'll animate the circle's center linearly and rotate the mark
        # around it correspondingly.
        rolled = ValueTracker(0.0)  # 0 → 1 = one full roll

        def rolled_position():
            t = rolled.get_value()
            cx = start_x + t * circumference
            theta = -t * 2 * PI  # rolling clockwise
            # mark's offset from center: starts pointing down (0, -r), rotates with theta
            ox = radius * np.sin(theta)
            oy = -radius * np.cos(theta)
            return cx + ox, ground_y + radius + oy

        def update_mark(m):
            x, y = rolled_position()
            m.move_to([x, y, 0])

        def update_circle(c):
            t = rolled.get_value()
            cx = start_x + t * circumference
            c.move_to([cx, ground_y + radius, 0])

        mark.add_updater(update_mark)
        circle.add_updater(update_circle)

        self.play(rolled.animate.set_value(1.0), run_time=4.0, rate_func=linear)

        mark.clear_updaters()
        circle.clear_updaters()
        radius_line.clear_updaters()

        # Mark the distance traversed on the ground
        distance_brace = Brace(
            Line([start_x, ground_y - 0.05, 0], [end_x, ground_y - 0.05, 0]),
            DOWN,
            color=BLUE,
        )
        distance_lab = MathTex("2\\pi r", font_size=36, color=BLUE).next_to(
            distance_brace, DOWN, buff=0.1
        )
        self.play(GrowFromCenter(distance_brace), Write(distance_lab), run_time=1.2)
        self.wait(0.6)

        punch = Tex(
            r"One full turn of a circle traces out a length of $2\pi r$.",
            font_size=28, color=WHITE,
        ).to_edge(DOWN, buff=0.2)
        self.play(Write(punch), run_time=1.4)
        self.wait(1.6)
