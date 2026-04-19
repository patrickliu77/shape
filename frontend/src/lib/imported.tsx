import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Theorem } from "../types";

// Shape returned by the backend `/import-pdf` endpoint. Mirrors the in-app
// CHAPTERS structure so it can be spliced straight into <Textbook>.
export type ImportedSection = {
  heading: string;
  formal: {
    kind: "Definition" | "Theorem" | "Proposition" | "Corollary" | "Lemma";
    name?: string | null;
    body: string;
  };
  intro: string;
  theorem: {
    id: string;
    title: string;
    statement: string;
    context: string;
  };
};

export type ImportedChapter = {
  number: number;
  title: string;
  blurb: string;
  sections: ImportedSection[];
};

export type ImportedTextbook = {
  chapters: ImportedChapter[];
  // Filename of the source PDF — surfaced in the UI so the student knows
  // which textbook they're currently looking at.
  source?: string;
};

type Ctx = {
  imported: ImportedTextbook | null;
  setImported: (t: ImportedTextbook | null) => void;
  // Flat list of theorems built from the imported chapters — so existing
  // selection / popup code that expects a `Theorem[]` keeps working.
  importedTheorems: Theorem[];
};

const ImportedCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "shape.importedTextbook";

function readInitial(): ImportedTextbook | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImportedTextbook;
  } catch {
    return null;
  }
}

function chaptersToTheorems(t: ImportedTextbook | null): Theorem[] {
  if (!t) return [];
  const out: Theorem[] = [];
  for (const ch of t.chapters) {
    for (const s of ch.sections) {
      out.push({
        id: s.theorem.id,
        title: s.theorem.title || s.heading,
        statement: s.theorem.statement,
        context: s.theorem.context,
        // No transcript / no media — the popup will render in "text" mode.
        transcript: {},
      });
    }
  }
  return out;
}

export function ImportedTextbookProvider({ children }: { children: ReactNode }) {
  const [imported, setImportedState] = useState<ImportedTextbook | null>(readInitial);

  const setImported = useCallback((t: ImportedTextbook | null) => {
    setImportedState(t);
    try {
      if (t) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const importedTheorems = useMemo(
    () => chaptersToTheorems(imported),
    [imported],
  );

  const value = useMemo<Ctx>(
    () => ({ imported, setImported, importedTheorems }),
    [imported, setImported, importedTheorems],
  );

  return <ImportedCtx.Provider value={value}>{children}</ImportedCtx.Provider>;
}

export function useImportedTextbook(): Ctx {
  const v = useContext(ImportedCtx);
  if (!v) throw new Error("useImportedTextbook must be used inside <ImportedTextbookProvider>");
  return v;
}
