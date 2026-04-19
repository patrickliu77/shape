import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/lang";
import { useT } from "../lib/translate";
import { randomQuote, type Quote } from "../lib/quotes";
import { MathText } from "../lib/math-text";
import { videoSpeedFor } from "../lib/video-speed";

type Props = { videoUrl: string };

const STR = {
  visualize: "✨ Show me",
  visualizeHint: "Tap to render the visualization for this step.",
  generating: "Generating visualization…",
};

const GEN_DURATION_MS = 1_000;

type GenState = "idle" | "generating" | "ready";

// Smaller cousin of the gate inside CinematicView. Used inline within the
// global chat's step-by-step solution to embed a Manim video at one step.
// Same UX pattern: button → progress bar + rotating quote/math problem →
// reveal the preloaded video with autoplay.
export function InlineVideoGate({ videoUrl }: Props) {
  const { lang } = useLang();
  void lang;
  const t = {
    visualize: useT(STR.visualize),
    visualizeHint: useT(STR.visualizeHint),
    generating: useT(STR.generating),
  };
  const [genState, setGenState] = useState<GenState>("idle");
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState<Quote>(() => randomQuote());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (genState !== "generating") return;
    const start = performance.now();
    let timer = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= GEN_DURATION_MS) {
        setProgress(100);
        timer = window.setTimeout(() => setGenState("ready"), 350);
        return;
      }
      const linear = (elapsed / GEN_DURATION_MS) * 100;
      const jittered = Math.min(99, linear + (Math.random() - 0.35) * 5);
      setProgress((prev) => Math.max(prev, jittered));
      timer = window.setTimeout(tick, 90 + Math.random() * 240);
    };
    tick();

    const quoteInterval = window.setInterval(() => {
      setQuote((prev) => randomQuote(prev));
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(quoteInterval);
    };
  }, [genState]);

  const start = () => {
    setProgress(0);
    setQuote(randomQuote());
    setGenState("generating");
  };

  if (genState === "idle") {
    return (
      <div className="rounded-lg bg-stone-900 dark:bg-[#0a0814] p-5 flex flex-col items-center justify-center text-stone-400 text-center">
        <div className="text-3xl mb-2 opacity-70">🎬</div>
        <button
          onClick={start}
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-violet-700 transition shadow-md"
        >
          {t.visualize}
        </button>
        <div className="mt-2 text-[11px] text-stone-500 max-w-xs">
          {t.visualizeHint}
        </div>
      </div>
    );
  }

  if (genState === "generating") {
    return (
      <div className="rounded-lg bg-stone-900 dark:bg-[#0a0814] p-5 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-semibold mb-3 animate-pulse">
          {t.generating}
        </div>
        <div className="w-full max-w-sm h-1.5 rounded-full bg-stone-700/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] font-mono text-stone-400 tabular-nums">
          {Math.floor(progress)}%
        </div>
        <blockquote
          key={quote.text}
          className="mt-5 max-w-md text-stone-200 italic text-sm leading-relaxed text-center animate-fade-in"
        >
          <span className="block">
            <MathText>{quote.text}</MathText>
          </span>
          <footer className="mt-1.5 text-[10px] not-italic text-stone-400">
            — {quote.attr}
          </footer>
        </blockquote>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-stone-900">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video object-contain"
        controls
        autoPlay
        playsInline
        // Apply per-URL speed override the moment the metadata is known
        // (and again on every load) so chat-embedded clips honour the
        // same speed registry CinematicView uses.
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          v.playbackRate = videoSpeedFor(videoUrl);
        }}
        onRateChange={(e) => {
          const v = e.currentTarget;
          const want = videoSpeedFor(videoUrl);
          if (Math.abs(v.playbackRate - want) > 0.01) {
            v.playbackRate = want;
          }
        }}
      />
    </div>
  );
}
