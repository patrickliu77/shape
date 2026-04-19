import { useEffect, useState, type RefObject } from "react";

type Props = { videoRef: RefObject<HTMLVideoElement> };

// Slim controls overlay that displays time in WALL-CLOCK seconds rather
// than media seconds. The CinematicView slows the video's playbackRate so
// the animation pace matches the (longer) translated narration; the
// browser's built-in <video controls> would then tick the timer at
// playbackRate × 1Hz, which made every "second" longer than a real second
// and made the displayed total wrong. This bar divides currentTime and
// duration by playbackRate so a viewer's stopwatch and the bar agree.
export function WallClockControls({ videoRef }: Props) {
  // Force a render every timeupdate so the position reflects the video.
  const [, bump] = useState(0);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tick = () => bump((n) => n + 1);
    const onPause = () => {
      setPaused(true);
      tick();
    };
    const onPlay = () => {
      setPaused(false);
      tick();
    };
    v.addEventListener("timeupdate", tick);
    v.addEventListener("loadedmetadata", tick);
    v.addEventListener("durationchange", tick);
    v.addEventListener("ratechange", tick);
    v.addEventListener("play", onPlay);
    v.addEventListener("playing", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    return () => {
      v.removeEventListener("timeupdate", tick);
      v.removeEventListener("loadedmetadata", tick);
      v.removeEventListener("durationchange", tick);
      v.removeEventListener("ratechange", tick);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("playing", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
    };
  }, [videoRef]);

  const v = videoRef.current;
  const dur = v?.duration ?? 0;
  const hasDur = Number.isFinite(dur) && dur > 0;
  const rate = v?.playbackRate || 1;
  // Wall-clock equivalents: divide by rate so a slowed video's bar still
  // ticks at one second per second.
  const elapsedWall = hasDur ? (v?.currentTime ?? 0) / rate : 0;
  const totalWall = hasDur ? dur / rate : 0;
  const fraction = hasDur ? (v?.currentTime ?? 0) / dur : 0;

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused || el.ended) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !hasDur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    el.currentTime = pct * dur;
  };

  const fullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-10 px-3 pb-2 pt-6
        bg-gradient-to-t from-black/80 via-black/40 to-transparent
        text-white opacity-0 hover:opacity-100 focus-within:opacity-100
        transition-opacity duration-200 select-none"
    >
      <div
        className="h-1.5 w-full rounded-full bg-white/20 cursor-pointer overflow-hidden mb-2"
        onClick={seek}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalWall)}
        aria-valuenow={Math.round(elapsedWall)}
      >
        <div
          className="h-full bg-white"
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
        <button
          onClick={togglePlay}
          className="text-white hover:text-violet-300 transition shrink-0"
          aria-label={paused ? "Play" : "Pause"}
          title={paused ? "Play" : "Pause"}
        >
          {paused ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>
        <span>
          {fmt(elapsedWall)} / {fmt(totalWall)}
        </span>
        <div className="flex-1" />
        <button
          onClick={fullscreen}
          className="text-white hover:text-violet-300 transition shrink-0"
          aria-label="Fullscreen"
          title="Fullscreen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
