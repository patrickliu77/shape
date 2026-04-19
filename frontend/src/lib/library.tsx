import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Theorem } from "../types";

// ── Imported-PDF schema (mirrors backend /import-pdf response) ──────────────
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
  source?: string;
};

// ── Library entries ─────────────────────────────────────────────────────────
// One Book per visible item in the left-hand library menu. The built-in
// "Calculus Textbook" is always present; every PDF the student imports adds
// another entry.
type BookKind = "builtin" | "imported";

export type Book = {
  id: string;
  name: string;
  kind: BookKind;
  lastOpenedAt: number; // ms epoch
  content?: ImportedTextbook; // present only for imported books
};

export const BUILTIN_ID = "builtin";

type Ctx = {
  books: Book[]; // sorted most-recently-opened first
  activeId: string;
  active: Book | undefined;
  // Returns the resolved imported content for the active book, or null when
  // the built-in textbook is active.
  activeImported: ImportedTextbook | null;
  // Theorems derived from the imported content. Empty when builtin is active.
  importedTheorems: Theorem[];
  setActive: (id: string) => void;
  addImported: (data: ImportedTextbook) => string; // returns new book id
  remove: (id: string) => void;
};

const LibraryCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "shape.library";

type Persisted = {
  activeId: string;
  // Only imported books are persisted; the builtin is always added on load.
  books: Book[];
};

function readInitial(): Persisted {
  if (typeof window === "undefined") {
    return { activeId: BUILTIN_ID, books: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed && Array.isArray(parsed.books)) {
        return {
          activeId: parsed.activeId || BUILTIN_ID,
          books: parsed.books.filter((b) => b.kind === "imported"),
        };
      }
    }
  } catch {
    /* ignore */
  }
  // Migrate from the previous single-import key if present.
  try {
    const old = window.localStorage.getItem("shape.importedTextbook");
    if (old) {
      const parsed = JSON.parse(old) as ImportedTextbook;
      if (parsed?.chapters?.length) {
        const id = newBookId();
        return {
          activeId: id,
          books: [
            {
              id,
              name: parsed.source || "Imported PDF",
              kind: "imported",
              lastOpenedAt: Date.now(),
              content: parsed,
            },
          ],
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { activeId: BUILTIN_ID, books: [] };
}

function newBookId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
        transcript: {},
      });
    }
  }
  return out;
}

export function TextbookLibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(readInitial);
  // Update lastOpenedAt for the builtin lazily on first render so it sorts
  // sensibly in the menu without being persisted across sessions.
  const [builtinOpenedAt, setBuiltinOpenedAt] = useState<number>(() => {
    return state.activeId === BUILTIN_ID ? Date.now() : 0;
  });

  const persist = useCallback((next: Persisted) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setActive = useCallback(
    (id: string) => {
      const now = Date.now();
      if (id === BUILTIN_ID) {
        setBuiltinOpenedAt(now);
        persist({ ...state, activeId: id });
        return;
      }
      const books = state.books.map((b) =>
        b.id === id ? { ...b, lastOpenedAt: now } : b,
      );
      persist({ activeId: id, books });
    },
    [persist, state],
  );

  const addImported = useCallback(
    (data: ImportedTextbook) => {
      const id = newBookId();
      const now = Date.now();
      const book: Book = {
        id,
        name: data.source || "Imported PDF",
        kind: "imported",
        lastOpenedAt: now,
        content: data,
      };
      persist({ activeId: id, books: [book, ...state.books] });
      return id;
    },
    [persist, state.books],
  );

  const remove = useCallback(
    (id: string) => {
      if (id === BUILTIN_ID) return; // can't delete the built-in
      const books = state.books.filter((b) => b.id !== id);
      const activeId = state.activeId === id ? BUILTIN_ID : state.activeId;
      if (activeId === BUILTIN_ID) setBuiltinOpenedAt(Date.now());
      persist({ activeId, books });
    },
    [persist, state],
  );

  // Always-present builtin entry; reset its lastOpenedAt every render so the
  // menu shows a meaningful sort even before the user has switched anything.
  useEffect(() => {
    if (state.activeId === BUILTIN_ID && builtinOpenedAt === 0) {
      setBuiltinOpenedAt(Date.now());
    }
  }, [state.activeId, builtinOpenedAt]);

  const books = useMemo<Book[]>(() => {
    const builtin: Book = {
      id: BUILTIN_ID,
      name: "Calculus Textbook",
      kind: "builtin",
      lastOpenedAt: builtinOpenedAt,
    };
    return [builtin, ...state.books].sort(
      (a, b) => b.lastOpenedAt - a.lastOpenedAt,
    );
  }, [state.books, builtinOpenedAt]);

  const active = useMemo(
    () => books.find((b) => b.id === state.activeId),
    [books, state.activeId],
  );

  const activeImported = useMemo<ImportedTextbook | null>(
    () => (active && active.kind === "imported" ? active.content ?? null : null),
    [active],
  );

  const importedTheorems = useMemo(
    () => chaptersToTheorems(activeImported),
    [activeImported],
  );

  const value = useMemo<Ctx>(
    () => ({
      books,
      activeId: state.activeId,
      active,
      activeImported,
      importedTheorems,
      setActive,
      addImported,
      remove,
    }),
    [
      books,
      state.activeId,
      active,
      activeImported,
      importedTheorems,
      setActive,
      addImported,
      remove,
    ],
  );

  return <LibraryCtx.Provider value={value}>{children}</LibraryCtx.Provider>;
}

export function useTextbookLibrary(): Ctx {
  const v = useContext(LibraryCtx);
  if (!v)
    throw new Error(
      "useTextbookLibrary must be used inside <TextbookLibraryProvider>",
    );
  return v;
}
