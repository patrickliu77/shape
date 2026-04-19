// Per-video playback-speed overrides. When a video URL appears here, both
// the video and the synced narration audio play at the listed multiplier
// instead of the default 1.0× (or the audio-led auto-adjusted rate).
//
// Use sparingly — most videos should run at native speed so the narration
// timing stays comfortable.
export const VIDEO_SPEED: Record<string, number> = {
  "/cache/videos/geom_05_area_circle.mp4": 1.5,
  "/cache/videos/12_poisson_exp_gamma.mp4": 1.5,
  "/cache/videos/10_roots_of_unity.mp4": 1.5,
};

export function videoSpeedFor(src: string | undefined | null): number {
  if (!src) return 1;
  // Strip any cache-buster query (?v=…) so the lookup matches.
  const clean = src.split("?")[0];
  return VIDEO_SPEED[clean] ?? 1;
}
