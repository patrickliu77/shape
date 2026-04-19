import { useEffect, useRef, useState } from "react";
import type { CinematicSpec } from "../types";
import { stop as stopGlobalPlayer } from "../lib/player";
import { fetchTTS } from "../lib/tts";
import { useLang } from "../lib/lang";
import { useT } from "../lib/translate";
import { randomQuote, type Quote } from "../lib/quotes";
import { MathText } from "../lib/math-text";

type Props = {
  spec: CinematicSpec;
  transcript?: string;
};

// Single English source; useT() routes every label through the language
// filter when a non-English language is selected.
const STR = {
  play: "▶ Play with narration",
  stop: "■ Stop",
  missing: "Animation not rendered yet.",
  missingHint: "Run python scripts/build_cache.py to generate it.",
  fetching: "Loading narration…",
  volume: "Volume",
  mute: "Mute",
  unmute: "Unmute",
  visualize: "✨ Generate visualization",
  visualizeHint: "Tap to generate a Manim animation for this theorem.",
  generating: "Generating visualization…",
};

// Total fake "generation" time. The actual video is preloaded; this gives
// the demo a real-feeling generation moment and time to read a quote.
const GEN_DURATION_MS = 10_000;

const VOLUME_KEY = "shape.cinemaVolume";

function readVolume(): number {
  if (typeof window === "undefined") return 0.85;
  const v = parseFloat(window.localStorage.getItem(VOLUME_KEY) ?? "");
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.85;
}

// We keep the *narration* at natural speed (1.0×) and slow the *video* down
// to match — that preserves the voice's intelligibility. Cap the slowdown so
// the video never crawls; if the audio is much shorter than the video, just
// let the audio finish early and the video continue at 1.0×.
const VIDEO_RATE_MIN = 0.55;
const VIDEO_RATE_MAX = 1.0;

type GenState = "idle" | "generating" | "ready";

export function CinematicView({ spec, transcript }: Props) {
  const { lang } = useLang();
  // Route every label through the language filter. Returns the English
  // string while a translation is loading.
  const t = {
    play: useT(STR.play),
    stop: useT(STR.stop),
    missing: useT(STR.missing),
    missingHint: useT(STR.missingHint),
    fetching: useT(STR.fetching),
    volume: useT(STR.volume),
    mute: useT(STR.mute),
    unmute: useT(STR.unmute),
    visualize: useT(STR.visualize),
    visualizeHint: useT(STR.visualizeHint),
    generating: useT(STR.generating),
  };
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoMissing, setVideoMissing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(readVolume);
  const [muted, setMuted] = useState<boolean>(false);

  // Generation gate — shows a "generate" button, then a progress bar +
  // rotating quote, then reveals the preloaded video.
  const [genState, setGenState] = useState<GenState>("idle");
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState<Quote>(() => randomQuote());

  // Reset the gate every time the theorem changes
  useEffect(() => {
    setGenState("idle");
    setProgress(0);
    setQuote(randomQuote());
  }, [spec.video]);

  // Drive progress + rotate quote while "generating"
  useEffect(() => {
    if (genState !== "generating") return;
    const start = performance.now();
    let timer = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= GEN_DURATION_MS) {
        setProgress(100);
        // Brief pause showing 100% before the video reveals
        timer = window.setTimeout(() => setGenState("ready"), 350);
        return;
      }
      // Base linear progress + jitter so the bar advances unevenly
      const linear = (elapsed / GEN_DURATION_MS) * 100;
      const jittered = Math.min(99, linear + (Math.random() - 0.35) * 5);
      setProgress((prev) => Math.max(prev, jittered));
      // Random delay between ticks so the bar feels organic
      timer = window.setTimeout(tick, 90 + Math.random() * 240);
    };
    tick();

    // New quote every ~3.5s
    const quoteInterval = window.setInterval(() => {
      setQuote((prev) => randomQuote(prev));
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(quoteInterval);
    };
  }, [genState]);

  // 1ms of silence as a base64 MP3 — used to "prime" the audio element when
  // the real narration URL hasn't loaded yet (e.g. while Claude is busy
  // translating an English transcript into Hindi/Chinese/Kazakh). Without
  // a src on the element, the muted play()/pause() unlock trick can't run,
  // so audio is silently denied by the browser when the URL arrives later.
  const SILENT_MP3 =
    "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQxAADgnABGiAAQBCqgCRMAAgEAH//////////+/g3VGAAAAAVVVVVUEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVQ==";

  const startGeneration = () => {
    setProgress(0);
    setQuote(randomQuote());
    setGenState("generating");

    // Browsers block audio.play() if there's no recent user gesture. The
    // 10-second gate eats the user-activation window, so by the time the
    // video reveals + tries to autoplay narration, Chrome silently denies
    // it (the original "lost narrator" bug). Trick: prime the audio
    // element *now*, inside the click handler, by issuing a muted .play()
    // then .pause(). Once the element has been played, subsequent
    // programmatic plays work even after the activation window expires.
    //
    // If the real narration URL hasn't arrived yet (e.g. Claude is still
    // translating into Hindi/Chinese), we prime against a silent 1ms MP3
    // first — the *element* gets unlocked, then once the real src lands
    // the browser lets us play it without a fresh gesture.
    const a = audioRef.current;
    if (a) {
      const hadSrc = !!a.src;
      if (!hadSrc) {
        a.src = SILENT_MP3;
      }
      a.muted = true;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = muted;
          // Drop the silent placeholder so the React-driven src takes over
          // when the real URL arrives.
          if (!hadSrc) a.removeAttribute("src");
        })
        .catch(() => {
          if (!hadSrc) a.removeAttribute("src");
        });
    }
  };

  // Persist volume across reloads
  useEffect(() => {
    try {
      window.localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* ignore */
    }
  }, [volume]);

  // Push volume + mute into both elements whenever they change
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (v) {
      v.volume = volume;
      v.muted = muted;
    }
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
  }, [volume, muted, audioUrl, videoMissing]);

  // Fetch narration audio whenever transcript or language changes.
  useEffect(() => {
    if (!transcript) {
      setAudioUrl(null);
      return;
    }
    let cancelled = false;
    setAudioUrl(null);
    fetchTTS(transcript, lang).then((url) => {
      if (!cancelled) setAudioUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [transcript, lang]);

  // Tear down everything when the theorem changes.
  useEffect(() => {
    setVideoMissing(false);
    return () => {
      const v = videoRef.current;
      const a = audioRef.current;
      if (v) {
        v.pause();
        v.currentTime = 0;
      }
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
      stopGlobalPlayer();
    };
  }, [spec.video]);

  // Sync the narration audio with the video element.
  // Listens for play/pause/seek/volume/ended on the video and mirrors them on
  // the audio. Auto-adjusts playbackRate when both durations are known so the
  // narration finishes when the video does.
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a || !audioUrl) return;

    const adjustRate = () => {
      // Keep narration at 1.0× — slow the *video* so it lasts as long as the
      // audio does. If audio is shorter than video, leave video at 1.0×.
      a.playbackRate = 1.0;
      if (
        a.duration > 0 &&
        v.duration > 0 &&
        Number.isFinite(a.duration) &&
        Number.isFinite(v.duration)
      ) {
        const ratio = v.duration / a.duration;
        v.playbackRate = Math.max(VIDEO_RATE_MIN, Math.min(VIDEO_RATE_MAX, ratio));
      }
    };

    const syncVolume = () => {
      // Native video volume control changed → sync to audio AND lift back up
      // into our state so the slider follows the user's interaction with
      // the video element's own volume controls.
      a.volume = v.volume;
      a.muted = v.muted;
      setVolume(v.volume);
      setMuted(v.muted);
    };

    const onPlay = () => {
      adjustRate();
      // Audio runs at 1.0× wall-clock; video runs at v.playbackRate. To
      // align them at any moment t (wall-clock seconds since playback
      // started), audio.currentTime ≈ v.currentTime / v.playbackRate.
      const vr = v.playbackRate || 1;
      a.currentTime = Math.min(v.currentTime / vr, a.duration || 0);
      a.play().catch(() => {});
    };
    const onPause = () => a.pause();
    const onSeeking = () => {
      const vr = v.playbackRate || 1;
      a.currentTime = Math.min(v.currentTime / vr, a.duration || 0);
    };
    const onEnded = () => {
      a.pause();
      a.currentTime = 0;
    };

    syncVolume();
    adjustRate();

    // If the video already started playing before this effect ran (e.g.
    // autoPlay fired between commit and effect), kick off the audio now.
    if (!v.paused && !v.ended) {
      onPlay();
    }

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("volumechange", syncVolume);
    v.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", adjustRate);
    v.addEventListener("loadedmetadata", adjustRate);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("volumechange", syncVolume);
      v.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", adjustRate);
      v.removeEventListener("loadedmetadata", adjustRate);
    };
    // genState in deps so listeners re-attach when the video element mounts
    // on the idle→generating→ready transition (videoRef is null until then).
  }, [audioUrl, videoMissing, genState]);

  // The custom "Play with narration" button is now equivalent to the video's
  // native ▶ — it just calls v.play(), which fires the 'play' event handler
  // above, which starts the synced audio.
  const playFromStart = () => {
    const v = videoRef.current;
    const a = audioRef.current;
    // Hard-reset both elements so we never have a previously-buffered audio
    // racing the new play() call.
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    if (v && !videoMissing) {
      v.pause();
      v.currentTime = 0;
      // Defer slightly so the pause→play transition flushes any pending
      // play promise rather than overlapping with a still-cancelling one.
      requestAnimationFrame(() => {
        v.play().catch(() => {});
      });
    }
  };

  const stopAll = () => {
    const v = videoRef.current;
    if (v) v.pause();
    const a = audioRef.current;
    if (a) a.pause();
    stopGlobalPlayer();
  };

  // Single render path. The <audio> element is mounted at the top so it
  // exists across all gate states — this lets us *prime* it during the
  // user's click on "Generate visualization" (browsers block subsequent
  // programmatic .play() calls if the user-activation has timed out).
  return (
    <div className="space-y-4">
      {/* Always-rendered narration audio so the priming trick works. */}
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" />

      {genState === "idle" && (
        <div className="relative w-full aspect-video rounded-lg bg-stone-900 dark:bg-[#0a0814] overflow-hidden flex flex-col items-center justify-center text-stone-400 p-6 text-center">
          <div className="text-5xl mb-4 opacity-70">🎬</div>
          <button
            onClick={startGeneration}
            className="px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-md hover:bg-violet-700 transition shadow-lg"
          >
            {t.visualize}
          </button>
          <div className="mt-3 text-xs text-stone-500 max-w-xs">
            {t.visualizeHint}
          </div>
        </div>
      )}

      {genState === "generating" && (
        <div className="relative w-full aspect-video rounded-lg bg-stone-900 dark:bg-[#0a0814] overflow-hidden flex flex-col items-center justify-center px-8 py-6">
          <div className="text-xs uppercase tracking-[0.2em] text-violet-300 font-semibold mb-3 animate-pulse">
            {t.generating}
          </div>
          <div className="w-full max-w-md h-2 rounded-full bg-stone-700/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] font-mono text-stone-400 tabular-nums">
            {Math.floor(progress)}%
          </div>
          <blockquote
            key={quote.text}
            className="mt-8 max-w-md text-stone-200 italic text-base leading-relaxed text-center animate-fade-in"
          >
            <span className="block">
              <MathText>{quote.text}</MathText>
            </span>
            <footer className="mt-2 text-xs not-italic text-stone-400">
              — {quote.attr}
            </footer>
          </blockquote>
        </div>
      )}

      {genState === "ready" && (
        <div className="relative w-full aspect-video rounded-lg bg-stone-900 overflow-hidden">
          {videoMissing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
              <div className="text-5xl mb-3">🎬</div>
              <div className="text-sm">
                {t.missing}
                <br />
                <code className="bg-stone-800 px-1.5 py-0.5 rounded text-xs mt-2 inline-block">
                  {t.missingHint}
                </code>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={spec.video}
              className="w-full h-full object-contain"
              controls
              playsInline
              autoPlay
              onError={() => setVideoMissing(true)}
            />
          )}
        </div>
      )}

      {genState === "ready" && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={playFromStart}
              className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-violet-700 transition"
            >
              {t.play}
            </button>
            <button
              onClick={stopAll}
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition"
            >
              {t.stop}
            </button>
            {transcript && !audioUrl && (
              <span className="text-xs text-stone-400 italic ml-1">{t.fetching}</span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setMuted((m) => !m)}
              className="text-stone-500 hover:text-stone-800 transition shrink-0"
              title={muted ? t.unmute : t.mute}
              aria-label={muted ? t.unmute : t.mute}
            >
              {muted || volume === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              ) : volume < 0.4 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && muted) setMuted(false);
              }}
              className="flex-1 accent-accent"
              aria-label={t.volume}
            />
            <span className="text-[10px] font-mono text-stone-400 w-8 text-right tabular-nums">
              {Math.round((muted ? 0 : volume) * 100)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
