import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "../types";

type LangCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
};

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = "shape.lang";
export const SUPPORTED: Lang[] = ["en", "ar", "hi", "zh", "fr", "kk", "ja"];

function readInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED as string[]).includes(stored)) return stored as Lang;
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, dir }), [lang, setLang, dir]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used inside <LangProvider>");
  return v;
}

// Pick the right per-language string bundle from a Partial<Record<Lang, T>>,
// falling back to English when the requested language has no localised copy.
// Components define their STR table for at least { en, ar } and rely on this
// helper for the other supported locales.
export function pickStr<T>(strs: Partial<Record<Lang, T>>, lang: Lang): T {
  return (strs[lang] ?? strs.en) as T;
}

// Short labels for the language picker. Each one is shown in its own script
// so the user can scan-pick visually.
export const LANG_LABEL: Record<Lang, string> = {
  en: "EN",
  ar: "عربي",
  hi: "हिंदी",
  zh: "中文",
  fr: "FR",
  kk: "Қазақ",
  ja: "日本語",
};

import polished from "../polished-transcripts.json";

const POLISHED = polished as Record<string, Partial<Record<Lang, string>>>;

export function pickTranscript(
  transcript: Partial<Record<Lang, string>>,
  lang: Lang,
  theoremId?: string,
): string | undefined {
  // Prefer a polished version if one exists for this theorem + lang.
  if (theoremId) {
    const p = POLISHED[theoremId]?.[lang];
    if (p) return p;
  }
  // Then a hand-written transcript in the requested language.
  if (transcript[lang]) return transcript[lang];
  // Fall back to the English transcript text. The /tts endpoint will
  // auto-translate it to the requested language before synthesis.
  if (theoremId) {
    const p = POLISHED[theoremId]?.en;
    if (p) return p;
  }
  return transcript.en;
}
