import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Two switchable UI fonts. Manrope is the modern sans default; Crimson Pro
// is the original textbook-style serif we used before the Manrope switch.
export type FontKey = "manrope" | "crimson";

export const FONTS: { key: FontKey; label: string; stack: string }[] = [
  {
    key: "manrope",
    label: "Sans Serif",
    stack:
      '"Manrope", "Noto Sans", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans JP", "Noto Sans SC", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", sans-serif',
  },
  {
    key: "crimson",
    label: "Serif",
    stack:
      '"Crimson Pro", "Noto Serif", "Noto Naskh Arabic", "Noto Serif Devanagari", "Noto Serif JP", "Noto Serif SC", Georgia, "Times New Roman", serif',
  },
];

const STORAGE_KEY = "shape.font";

type Ctx = {
  font: FontKey;
  setFont: (next: FontKey) => void;
};

const FontCtx = createContext<Ctx | null>(null);

function readInitial(): FontKey {
  if (typeof window === "undefined") return "manrope";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "manrope" || stored === "crimson") return stored;
  // Migrate the previous "inter" choice (briefly the Serif option) to the
  // new actual serif so users that picked Serif still see a serif.
  if (stored === "inter") return "crimson";
  return "manrope";
}

function applyFont(key: FontKey) {
  if (typeof document === "undefined") return;
  const entry = FONTS.find((f) => f.key === key) ?? FONTS[0];
  document.documentElement.style.setProperty("--font-sans", entry.stack);
}

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<FontKey>(readInitial);

  // Apply on mount and on every change so the CSS variable that drives every
  // text element in the app stays in sync with the picker.
  useEffect(() => {
    applyFont(font);
  }, [font]);

  const setFont = useCallback((next: FontKey) => {
    setFontState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ font, setFont }), [font, setFont]);

  return <FontCtx.Provider value={value}>{children}</FontCtx.Provider>;
}

export function useFont(): Ctx {
  const v = useContext(FontCtx);
  if (!v) throw new Error("useFont must be used inside <FontProvider>");
  return v;
}
