import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLang } from "./lang";
import type { Lang } from "../types";

// Per-language in-memory cache. Persisted to localStorage so that switching
// back to a language we've already used is instant on page reload.
type Cache = Map<string, string>;
const caches: Partial<Record<Lang, Cache>> = {};

// v2 = math-masking added on the backend; old cached strings may be broken.
const STORAGE_PREFIX = "shape.tx2.";

function loadCache(lang: Lang): Cache {
  if (caches[lang]) return caches[lang]!;
  const map: Cache = new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + lang);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) map.set(k, v);
    }
  } catch {
    /* ignore */
  }
  caches[lang] = map;
  return map;
}

function persistCache(lang: Lang) {
  const map = caches[lang];
  if (!map) return;
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of map) obj[k] = v;
    window.localStorage.setItem(STORAGE_PREFIX + lang, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

type Ctx = {
  // Synchronously look up a translation. Returns null if we don't have it
  // yet; in that case the component should render the original English.
  get: (text: string) => string | null;
  // Register a string we want translated. The provider batches these into
  // a single /translate call per render frame.
  register: (text: string) => void;
  // Bumped every time a translation batch arrives. Consumers subscribe to
  // it so React knows to re-render them with the freshly cached strings.
  version: number;
};

const TranslationCtx = createContext<Ctx | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const [version, setVersion] = useState(0);
  const pendingRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<number | null>(null);
  const inflightRef = useRef<Set<string>>(new Set());

  // When the language flips, clear any pending batch — those strings should
  // be re-requested for the new language.
  useEffect(() => {
    pendingRef.current.clear();
    inflightRef.current.clear();
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setVersion((n) => n + 1);
  }, [lang]);

  const flush = useCallback(async () => {
    flushTimerRef.current = null;
    if (lang === "en") return;
    const cache = loadCache(lang);
    const todo = [...pendingRef.current].filter(
      (t) => !cache.has(t) && !inflightRef.current.has(t),
    );
    pendingRef.current.clear();
    if (!todo.length) return;
    todo.forEach((t) => inflightRef.current.add(t));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: todo, lang }),
      });
      if (!res.ok) throw new Error("translate failed");
      const data: { translated: string[] } = await res.json();
      for (let i = 0; i < todo.length; i++) {
        cache.set(todo[i], data.translated[i] ?? todo[i]);
      }
      persistCache(lang);
      setVersion((n) => n + 1);
    } catch {
      // On failure leave the strings absent from the cache — components
      // will keep showing English. We mark them no longer in-flight so a
      // later attempt can retry.
    } finally {
      todo.forEach((t) => inflightRef.current.delete(t));
    }
  }, [lang]);

  const register = useCallback(
    (text: string) => {
      if (!text || lang === "en") return;
      const cache = loadCache(lang);
      if (cache.has(text) || inflightRef.current.has(text)) return;
      pendingRef.current.add(text);
      if (flushTimerRef.current === null) {
        // Coalesce all registrations within the same animation frame into
        // one /translate request.
        flushTimerRef.current = window.setTimeout(flush, 30);
      }
    },
    [lang, flush],
  );

  const get = useCallback(
    (text: string): string | null => {
      if (lang === "en") return text;
      const cache = loadCache(lang);
      return cache.get(text) ?? null;
    },
    [lang],
  );

  // `version` is included in the deps so consumers re-render — and re-read
  // ctx.get(text) — every time a translation batch arrives.
  const value = useMemo<Ctx>(
    () => ({ get, register, version }),
    [get, register, version],
  );

  return (
    <TranslationCtx.Provider value={value}>{children}</TranslationCtx.Provider>
  );
}

// Hook: returns the translated version of `text` for the current language,
// or the original text while the translation is in flight (or if it failed).
export function useTranslated(text: string): string {
  const ctx = useContext(TranslationCtx);
  const { lang } = useLang();
  if (!ctx) return text;
  // Touching version subscribes this component to translation-batch arrivals.
  void ctx.version;
  if (lang === "en") return text;
  const cached = ctx.get(text);
  if (cached !== null) return cached;
  // Defer the register so we never trigger a state update during render.
  setTimeout(() => ctx.register(text), 0);
  return text;
}

// Short alias used liberally throughout components — every visible English
// string in the product flows through this hook.
export const useT = useTranslated;
