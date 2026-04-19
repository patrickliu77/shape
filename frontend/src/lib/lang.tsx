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

// Two ways the page can apply a language:
//   "full"  — every visible string outside the textbook chrome flows through
//             the language filter (textbook intros, theorem boxes, popup).
//   "popup" — only the panel that opens when a student taps a theorem flows
//             through the filter; the surrounding textbook stays in English
//             so the formal statement can still be read in the original.
export type TranslateScope = "full" | "popup";

type LangCtx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  scope: TranslateScope;
  setScope: (scope: TranslateScope) => void;
  dir: "ltr" | "rtl";
};

const Ctx = createContext<LangCtx | null>(null);

const STORAGE_KEY = "shape.lang";
const SCOPE_KEY = "shape.langScope";
export const SUPPORTED: Lang[] = ["en", "ar", "hi", "zh", "fr", "kk", "ja"];
export const SCOPES: TranslateScope[] = ["full", "popup"];

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED as string[]).includes(stored)) return stored as Lang;
  return "en";
}

function readInitialScope(): TranslateScope {
  if (typeof window === "undefined") return "full";
  const stored = window.localStorage.getItem(SCOPE_KEY);
  if (stored === "full" || stored === "popup") return stored;
  return "full";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);
  const [scope, setScopeState] = useState<TranslateScope>(readInitialScope);

  // Per spec, switching language or scope reloads the page so the new
  // setting is applied uniformly and any stale React state is wiped.
  const persistAndReload = useCallback(
    (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      window.location.reload();
    },
    [],
  );

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      setLangState(next);
      persistAndReload(STORAGE_KEY, next);
    },
    [lang, persistAndReload],
  );

  const setScope = useCallback(
    (next: TranslateScope) => {
      if (next === scope) return;
      setScopeState(next);
      persistAndReload(SCOPE_KEY, next);
    },
    [scope, persistAndReload],
  );

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, scope, setScope, dir }),
    [lang, setLang, scope, setScope, dir],
  );

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
