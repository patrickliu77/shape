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
const SUPPORTED: Lang[] = ["en", "ar"];

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

export const LANG_LABEL: Record<Lang, string> = {
  en: "EN",
  ar: "عربي",
};

import polished from "../polished-transcripts.json";

const POLISHED = polished as Record<string, Partial<Record<Lang, string>>>;

export function pickTranscript(
  transcript: Partial<Record<Lang, string>>,
  lang: Lang,
  theoremId?: string,
): string | undefined {
  if (theoremId) {
    const p = POLISHED[theoremId]?.[lang] ?? POLISHED[theoremId]?.en;
    if (p) return p;
  }
  return transcript[lang] ?? transcript.en;
}
