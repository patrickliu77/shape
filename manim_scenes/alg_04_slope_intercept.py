"""Slope-intercept form: y = mx + b. We sweep m through three slopes,
then sweep b through three intercepts, with a line moving on a coordinate
plane.

Render:
    uv run manim -ql alg_04_slope_intercept.py SlopeIntercept
"""

from manim import *


class SlopeIntercept(Scene):
    def construct(self):
        config.background_color = "#111216"

        title = MathTex("y = m x + b", font_size=44, color=WHITE).to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.0)

        plane = NumberPlane(
            x_range=[-5, 5, 1], y_range=[-3, 3, 1],
            x_length=8, y_length=4.6,
            background_line_style={
                "stroke_color": "#3a3458",
                "stroke_width": 1,
                "stroke_opacity": 0.8,
            },
            axis_config={"stroke_color": "#888", "include_tip": False, "include_numbers": False},
        ).shift(DOWN * 0.4)
        self.play(Create(plane), run_time=1.0)

        m = ValueTracker(1.0)
        b = ValueTracker(0.0)

        def line():
            mv = m.get_value()
            bv = b.get_value()
            x_min, x_max = -4.5, 4.5
            return Line(
                plane.coords_to_point(x_min, mv * x_min + bv),
                plane.coords_to_point(x_max, mv * x_max + bv),
                color=YELLOW, stroke_width=4,
            )

        ln = always_redraw(line)
        self.add(ln)

        readout = MathTex("m = 1.00, \\; b = 0.00",
                          font_size=32, color=YELLOW).to_edge(DOWN, buff=0.4)

        def updater(mob):
            mob.become(MathTex(
                f"m = {m.get_value():.2f}, \\; b = {b.get_value():.2f}",
                font_size=32, color=YELLOW,
            ).to_edge(DOWN, buff=0.4))

        readout.add_updater(updater)
        self.add(readout)
        self.wait(0.4)

        # Sweep m: 1 → -1 → 2
        self.play(m.animate.set_value(-1.0), run_time=1.6)
        self.wait(0.3)
        self.play(m.animate.set_value(2.0), run_time=1.6)
        self.wait(0.3)
        # Reset m to 0.5 then sweep b
        self.play(m.animate.set_value(0.5), run_time=1.0)
        self.play(b.animate.set_value(2.0), run_time=1.4)
        self.wait(0.3)
        self.play(b.animate.set_value(-1.5), run_time=1.4)
        self.wait(0.3)
        self.play(b.animate.set_value(0.0), run_time=0.8)

        readout.clear_updaters()

        punch = Tex(
            r"$m$ tilts the line. $b$ slides it up or down.",
            font_size=30, color=WHITE,
        ).next_to(readout, UP, buff=0.2)
        self.play(Write(punch), run_time=1.4)
        self.wait(1.6)
