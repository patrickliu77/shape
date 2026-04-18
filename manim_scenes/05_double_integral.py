"""Double integral as a Riemann limit of prism volumes.

We slice the region [0, 2] × [0, 2] into a grid, stand a prism of height
f(x, y) on each cell, and refine the grid: 2×2 → 4×4 → 8×8 → 16×16 → 32×32.
At the end the prisms melt into the surface itself — visualising n → ∞.

Render:
    uv run manim -ql 05_double_integral.py DoubleIntegral
"""

from manim import *
import numpy as np


def f(x, y):
    """A friendly positive bump on [0, 2]²."""
    return 0.7 * (np.sin(np.pi * x / 2) + np.cos(np.pi * y / 2) + 1.0)


class DoubleIntegral(ThreeDScene):
    def construct(self):
        config.background_color = "#111216"

        # Title — pinned to the camera frame so it doesn't rotate with the 3D
        title = Tex(
            r"$\iint_R f\,dA \;=\; \lim_{n \to \infty} \sum_{i,j} f(x_i, y_j)\,\Delta x\,\Delta y$",
            font_size=36, color=WHITE,
        )
        title.to_edge(UP)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title), run_time=1.2)

        # 3D axes
        axes = ThreeDAxes(
            x_range=[0, 2.2, 1],
            y_range=[0, 2.2, 1],
            z_range=[0, 3, 1],
            x_length=5,
            y_length=5,
            z_length=3.2,
            axis_config={"stroke_color": "#888888", "include_numbers": False, "include_tip": False},
        ).shift(DOWN * 0.4)
        # Lower phi → more top-down view → each prism shows mostly one face,
        # so the visible block count matches n × n.
        self.set_camera_orientation(phi=52 * DEGREES, theta=-50 * DEGREES, zoom=0.9)

        self.play(Create(axes), run_time=1.2)

        # Surface z = f(x, y) — kept very dim with INVISIBLE mesh lines so it
        # doesn't visually compete with the prism count. The mesh edges
        # would otherwise read as extra little blocks.
        surface = Surface(
            lambda u, v: axes.c2p(u, v, f(u, v)),
            u_range=[0, 2],
            v_range=[0, 2],
            resolution=(28, 28),
            stroke_width=0,
            stroke_opacity=0,
            fill_color=BLUE,
            fill_opacity=0.18,
        )
        self.play(Create(surface), run_time=1.6)

        # ----- Prism builder ----------------------------------------------
        unit_x = axes.c2p(1, 0, 0)[0] - axes.c2p(0, 0, 0)[0]
        unit_y = axes.c2p(0, 1, 0)[1] - axes.c2p(0, 0, 0)[1]
        unit_z = axes.c2p(0, 0, 1)[2] - axes.c2p(0, 0, 0)[2]

        def build_prisms(n: int, opacity: float = 0.55, stroke_width: float = 0.6) -> VGroup:
            prisms = VGroup()
            dx = 2.0 / n
            # Higher resolution → thinner edges so the mass reads cleanly.
            for i in range(n):
                for j in range(n):
                    xc = (i + 0.5) * dx
                    yc = (j + 0.5) * dx
                    h = f(xc, yc)
                    p = Prism(
                        dimensions=[dx * unit_x, dx * unit_y, h * unit_z],
                        fill_color=YELLOW,
                        fill_opacity=opacity,
                        stroke_color=ORANGE,
                        stroke_width=stroke_width,
                    )
                    p.move_to(axes.c2p(xc, yc, h / 2.0))
                    prisms.add(p)
            return prisms

        # Caption (in screen space, updates per refinement)
        caption = MathTex(r"n = 2 \times 2,\ \ \Delta = 1.00", font_size=34, color=YELLOW)
        caption.to_corner(DR).shift(LEFT * 0.4 + UP * 0.4)
        self.add_fixed_in_frame_mobjects(caption)

        # Resolution sweep — opacity & stroke shrink as n grows so dense grids
        # don't turn into a wall of orange edges. Capped at 16x16 (256 prisms)
        # because n=32 (1024 prisms) blows up Manim's FadeOut animation time.
        steps = [
            (2,  "1.00", 0.62, 0.6),
            (4,  "0.50", 0.55, 0.5),
            (8,  "0.25", 0.45, 0.35),
            (16, "0.13", 0.35, 0.20),
        ]

        prev = None
        for n, delta_str, op, sw in steps:
            new_prisms = build_prisms(n, opacity=op, stroke_width=sw)
            new_caption = MathTex(
                rf"n = {n} \times {n},\ \ \Delta = {delta_str}",
                font_size=34, color=YELLOW,
            ).move_to(caption)

            if prev is None:
                self.play(FadeIn(new_prisms, lag_ratio=0.02), run_time=1.2)
            else:
                # Cross-fade old → new prisms (fast lag at high n so we don't
                # spend forever animating each individual box)
                lag = max(0.001, 0.02 / n)
                self.play(
                    FadeOut(prev, lag_ratio=lag),
                    FadeIn(new_prisms, lag_ratio=lag),
                    run_time=1.4,
                )
            self.remove(caption)
            self.add_fixed_in_frame_mobjects(new_caption)
            caption = new_caption
            prev = new_prisms
            self.wait(0.5)

        # ----- The limit: n → ∞ -------------------------------------------
        # Prisms dissolve as the surface itself becomes solid — visually,
        # the discrete sum *becomes* the integral.
        infinity_caption = MathTex(
            r"n \to \infty,\quad \Delta \to 0",
            font_size=46, color=YELLOW,
        ).move_to(caption)

        self.remove(caption)
        self.add_fixed_in_frame_mobjects(infinity_caption)

        # Don't remove the prisms — they ARE the volume. Drop their stroke
        # so the 256 individual boxes read as one continuous solid mass,
        # and tint them blue so they visually fuse with the surface above.
        # The surface itself fades back a touch so the *volume* is the
        # focus, not the shell on top.
        self.play(
            prev.animate.set_stroke(opacity=0).set_fill(BLUE, opacity=0.85),
            surface.animate.set_fill_opacity(0.45).set_stroke(opacity=0.35, width=0.4),
            Write(infinity_caption),
            run_time=1.8,
        )
        self.wait(0.6)

        # Slow camera glide to admire the smooth volume — slightly more
        # tilted at the end so the volume reads in 3D
        self.move_camera(phi=62 * DEGREES, theta=-95 * DEGREES, zoom=0.95, run_time=2.4)
        self.wait(0.4)

        # Closing line
        closing = Tex(
            r"The Riemann sum has become the exact volume — that's the double integral.",
            font_size=28, color=YELLOW,
        ).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(closing)
        self.play(Write(closing), run_time=1.4)
        self.wait(1.6)
