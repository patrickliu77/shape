// Supported UI + TTS languages.
//   en — English
//   ar — Egyptian Arabic (ar-EG)
//   hi — Hindi
//   zh — Simplified Chinese
//   fr — French
//   kk — Kazakh
//   ja — Japanese
export type Lang = "en" | "ar" | "hi" | "zh" | "fr" | "kk" | "ja";

export type Param = {
  name: string;
  label?: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type InteractiveSpec = {
  fn: (x: number, params: Record<string, number>) => number;
  params: Param[];
  xRange: [number, number];
  yRange?: [number, number];
  xLabel?: string;
  yLabel?: string;
  narrate?: (params: Record<string, number>, lang: Lang) => string;
};

export type CinematicSpec = {
  video: string;
  audio?: Partial<Record<Lang, string>>;
};

// 3D surface playground — z = f(x, y, params). Rendered with Three.js so the
// student can rotate the surface with the mouse and watch sliders re-shape it.
export type Surface3DSpec = {
  fn: (x: number, y: number, params: Record<string, number>) => number;
  params: Param[];
  xRange: [number, number];
  yRange: [number, number];
  zRange?: [number, number];
  resolution?: number; // grid samples per axis (default 48)
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  narrate?: (params: Record<string, number>, lang: Lang) => string;
};

// A theorem may have a cinematic intro, a 2D interactive plot, a 3D playground,
// or any combination. At least one is required (enforced in code, not types).
export type Theorem = {
  id: string;
  title: string;
  statement: string;
  context: string;
  transcript: Partial<Record<Lang, string>>;
  cinematic?: CinematicSpec;
  interactive?: InteractiveSpec;
  interactive3d?: Surface3DSpec;
};

export type TheoremMode =
  | "cinematic"
  | "interactive"
  | "interactive3d"
  | "cinematic+interactive"
  | "cinematic+3d"
  | "interactive+3d"
  | "all"
  | "text";

export function theoremMode(t: Theorem): TheoremMode {
  const c = !!t.cinematic;
  const i = !!t.interactive;
  const i3 = !!t.interactive3d;
  if (c && i && i3) return "all";
  if (c && i3) return "cinematic+3d";
  if (c && i) return "cinematic+interactive";
  if (i && i3) return "interactive+3d";
  if (c) return "cinematic";
  if (i3) return "interactive3d";
  if (i) return "interactive";
  // No media at all — used for imported PDF theorems where the popup just
  // shows the formal statement and a friendlier explanation.
  return "text";
}
