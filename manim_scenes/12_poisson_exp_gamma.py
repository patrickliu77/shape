"""Poisson process: one timeline, three distributions.

The same Poisson process — events arriving randomly at rate lambda — gives
rise to three classical distributions, depending on what you measure:

  - Poisson(lambda * T): the *count* of events inside a window of length T.
  - Exponential(lambda):  the *gap* between two consecutive events.
  - Gamma(k, lambda):     the *time until the k-th event* (= sum of k Exp gaps).

We draw a single timeline of events and then highlight, in turn, the count,
one gap, and the cumulative wait to the 5th event.

Render:
    uv run manim -ql 12_poisson_exp_gamma.py PoissonExpGamma
"""

from manim import *


class PoissonExpGamma(Scene):
    def construct(self):
        config.background_color = "#111216"

        # ── Persistent header ──────────────────────────────────────────────
        title = Tex(
            r"The Poisson process — one timeline, three distributions",
            font_size=30,
            color=WHITE,
        ).to_edge(UP, buff=0.4)
        rate_label = MathTex(
            r"\lambda = 0.8 \text{ events / unit time}",
            font_size=24,
            color=YELLOW,
        ).next_to(title, DOWN, buff=0.18)
        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(rate_label), run_time=0.5)

        # ── Timeline ───────────────────────────────────────────────────────
        T = 10.0
        events = [1.2, 2.1, 3.4, 4.0, 5.6, 6.4, 8.1, 9.2]  # 8 events in [0, 10]

        timeline = NumberLine(
            x_range=[0, T, 1],
            length=11,
            include_numbers=True,
            include_tip=True,
            color=WHITE,
            stroke_width=2,
            font_size=22,
        )
        time_label = MathTex("t", font_size=28, color=WHITE).next_to(
            timeline, RIGHT, buff=0.2
        )
        self.play(Create(timeline), Write(time_label), run_time=1.0)

        ticks = VGroup()
        ev_labels = VGroup()
        for i, e in enumerate(events):
            pt = timeline.number_to_point(e)
            tick = Line(
                pt + DOWN * 0.20,
                pt + UP * 0.40,
                color=YELLOW,
                stroke_width=4,
            )
            lab = MathTex(f"T_{{{i+1}}}", font_size=20, color=YELLOW).next_to(
                tick, UP, buff=0.05
            )
            ticks.add(tick)
            ev_labels.add(lab)
        for tick, lab in zip(ticks, ev_labels):
            self.play(GrowFromCenter(tick), FadeIn(lab), run_time=0.16)
        self.wait(0.4)

        # ── Scene 1: Poisson — count events inside [0, T] ──────────────────
        section1 = Tex(
            r"\textbf{Poisson}: \emph{count} events inside a window of length $T$",
            font_size=26,
            color=BLUE,
        ).to_edge(DOWN, buff=2.2)

        win_left = timeline.number_to_point(0)
        win_right = timeline.number_to_point(T)
        window = Rectangle(
            width=win_right[0] - win_left[0],
            height=1.20,
            color=BLUE,
            stroke_width=2,
            fill_color=BLUE,
            fill_opacity=0.10,
        ).move_to((win_left + win_right) / 2 + UP * 0.15)
        count_label = MathTex(r"N = 8", font_size=34, color=BLUE).next_to(
            window, UP, buff=0.25
        )
        formula1 = MathTex(
            r"P(N = k) = \frac{(\lambda T)^k\, e^{-\lambda T}}{k!}",
            font_size=30,
            color=BLUE,
        ).to_edge(DOWN, buff=0.7)

        self.play(
            Write(section1),
            Create(window),
            Write(count_label),
            run_time=1.2,
        )
        self.play(Write(formula1), run_time=1.2)
        self.wait(1.6)

        self.play(
            FadeOut(window),
            FadeOut(count_label),
            FadeOut(section1),
            FadeOut(formula1),
            run_time=0.7,
        )

        # ── Scene 2: Exponential — gap between consecutive events ──────────
        section2 = Tex(
            r"\textbf{Exponential}: \emph{gap} between two consecutive events",
            font_size=26,
            color=GREEN,
        ).to_edge(DOWN, buff=2.2)

        e3 = timeline.number_to_point(events[2])  # T_3
        e4 = timeline.number_to_point(events[3])  # T_4
        gap_line = Line(
            e3 + DOWN * 0.40,
            e4 + DOWN * 0.40,
            color=GREEN,
            stroke_width=6,
        )
        gap_brace = Brace(gap_line, DOWN, color=GREEN, buff=0.05)
        gap_lbl = MathTex(
            r"X = T_4 - T_3 \;\sim\; \text{Exp}(\lambda)",
            font_size=24,
            color=GREEN,
        ).next_to(gap_brace, DOWN, buff=0.05)

        formula2 = MathTex(
            r"f_X(x) = \lambda\, e^{-\lambda x}, \quad x \ge 0",
            font_size=30,
            color=GREEN,
        ).to_edge(DOWN, buff=0.7)

        self.play(
            Write(section2),
            Create(gap_line),
            GrowFromCenter(gap_brace),
            Write(gap_lbl),
            run_time=1.4,
        )
        self.play(Write(formula2), run_time=1.2)
        self.wait(1.6)

        self.play(
            FadeOut(gap_line),
            FadeOut(gap_brace),
            FadeOut(gap_lbl),
            FadeOut(section2),
            FadeOut(formula2),
            run_time=0.7,
        )

        # ── Scene 3: Gamma — time until k-th event ─────────────────────────
        section3 = Tex(
            r"\textbf{Gamma}($k, \lambda$): \emph{time until} the $k$-th event "
            r"(here $k = 5$)",
            font_size=26,
            color=RED,
        ).to_edge(DOWN, buff=2.2)

        zero_pt = timeline.number_to_point(0)
        e5 = timeline.number_to_point(events[4])  # T_5
        gam_line = Line(
            zero_pt + DOWN * 0.40,
            e5 + DOWN * 0.40,
            color=RED,
            stroke_width=6,
        )
        gam_brace = Brace(gam_line, DOWN, color=RED, buff=0.05)
        gam_lbl = MathTex(
            r"T_5 = X_1 + X_2 + X_3 + X_4 + X_5",
            font_size=24,
            color=RED,
        ).next_to(gam_brace, DOWN, buff=0.05)

        formula3 = MathTex(
            r"f_{\Gamma}(t \mid k, \lambda) = \frac{\lambda^k\, t^{k-1}\, e^{-\lambda t}}{(k-1)!}",
            font_size=30,
            color=RED,
        ).to_edge(DOWN, buff=0.7)

        self.play(
            Write(section3),
            Create(gam_line),
            GrowFromCenter(gam_brace),
            Write(gam_lbl),
            run_time=1.6,
        )
        self.play(Write(formula3), run_time=1.2)
        self.wait(1.8)

        # ── Summary ────────────────────────────────────────────────────────
        self.play(
            FadeOut(gam_line),
            FadeOut(gam_brace),
            FadeOut(gam_lbl),
            FadeOut(section3),
            FadeOut(formula3),
            run_time=0.7,
        )

        summary = VGroup(
            MathTex(
                r"\text{count of events in } [0,T] \;\sim\; \text{Poisson}(\lambda T)",
                font_size=26,
                color=BLUE,
            ),
            MathTex(
                r"\text{gap between events} \;\sim\; \text{Exp}(\lambda)",
                font_size=26,
                color=GREEN,
            ),
            MathTex(
                r"\text{time until the } k\text{-th event} \;\sim\; \text{Gamma}(k, \lambda)",
                font_size=26,
                color=RED,
            ),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25).to_edge(DOWN, buff=0.6)
        self.play(LaggedStartMap(Write, summary, lag_ratio=0.5), run_time=2.4)
        self.wait(1.8)
