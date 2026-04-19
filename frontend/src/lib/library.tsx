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
import {
  BUILTIN_BOOKS,
  DEFAULT_BUILTIN_ID,
  builtinById,
  type ChapterDef,
} from "../books";

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
type BookKind = "builtin" | "imported";

export type Book = {
  id: string;
  name: string;
  kind: BookKind;
  lastOpenedAt: number;
  // Present only for imported books — the raw structured payload.
  content?: ImportedTextbook;
};

// Kept exported for back-compat with components that imported the old
// constant; now points at the default built-in id.
export const BUILTIN_ID = DEFAULT_BUILTIN_ID;

type Ctx = {
  books: Book[];
  activeId: string;
  active: Book | undefined;
  // Resolved chapters for whichever book is active. Always defined.
  activeChapters: ChapterDef[];
  // Resolved theorems for whichever book is active. Built-ins return their
  // own Theorem[]; imported PDFs return synthesised text-only Theorem[].
  activeTheorems: Theorem[];
  // Convenience for callers that specifically need the imported payload.
  activeImported: ImportedTextbook | null;
  importedTheorems: Theorem[];
  setActive: (id: string) => void;
  addImported: (data: ImportedTextbook) => string;
  remove: (id: string) => void;
};

const LibraryCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "shape.library";

type Persisted = {
  activeId: string;
  // Only imported books are persisted; built-ins are always available from
  // BUILTIN_BOOKS at module-load time.
  imported: Book[];
};

function readInitial(): Persisted {
  if (typeof window === "undefined") {
    return { activeId: DEFAULT_BUILTIN_ID, imported: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed && Array.isArray(parsed.imported)) {
        return {
          activeId: parsed.activeId || DEFAULT_BUILTIN_ID,
          imported: parsed.imported.filter((b) => b.kind === "imported"),
        };
      }
    }
  } catch {
    /* ignore */
  }
  // Migrate the older single-import key if present.
  try {
    const old = window.localStorage.getItem("shape.importedTextbook");
    if (old) {
      const parsed = JSON.parse(old) as ImportedTextbook;
      if (parsed?.chapters?.length) {
        const id = newBookId();
        return {
          activeId: id,
          imported: [
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
  return { activeId: DEFAULT_BUILTIN_ID, imported: [] };
}

function newBookId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Auto-attach Manim videos to imported theorems ─────────────────────────
// Whenever a freshly-imported PDF section has a heading or theorem title
// that matches one of these patterns, the Theorem we synthesise gets the
// corresponding cinematic + an English transcript. The /tts endpoint then
// translates that transcript into whatever language the student picked, so
// imported textbooks gain narrated visualisations for free.
type VideoMatch = {
  patterns: RegExp[];
  video: string;
  transcript: string;
};

const IMPORTED_VIDEO_MATCHES: VideoMatch[] = [
  {
    patterns: [/trapezium\s+rule/i, /trapezoid(?:al)?\s+rule/i],
    video: "/cache/videos/calc_trapezium.mp4",
    transcript:
      "The trapezium rule approximates the area under a curve by stacking trapezoids on top of every strip. Slice the interval from a to b into n equal pieces of width h. Above each strip, draw a trapezoid whose top connects f at the left endpoint to f at the right endpoint. The trapezoid's area is h over two times the sum of those two heights. Add the n trapezoid areas up — that's your approximation. Notice that every interior sample point appears in two trapezoids, which is why the formula multiplies them by two while the two endpoints are counted just once.",
  },
  {
    patterns: [/simpson'?s\s+rule/i, /simpson(?!\s+iden)/i],
    video: "/cache/videos/calc_simpson.mp4",
    transcript:
      "Simpson's rule does better than the trapezium rule by fitting a parabola — not a straight line — over every pair of strips. Take three consecutive sample points: f at x zero, f at x one, f at x two. There's a unique parabola through them, and we can integrate that parabola exactly. The formula combines the three heights with weights 1, 4, 1 and multiplies by h over three. Tile this across all the strip-pairs and you get the full Simpson's rule, with weights one, four, two, four, two, dot dot dot, four, one. Because parabolas hug a smooth curve much more tightly than a straight line, Simpson is dramatically more accurate than the trapezium rule for the same n.",
  },
  {
    patterns: [
      /improper\s+integral.*type\s*1\b/i,
      /improper\s+integral.*type\s*i\b/i,
      /improper\s+integral.*infinite\s+limit/i,
      /infinite\s+limit.*integral/i,
      /\btype\s*1.*improper/i,
    ],
    video: "/cache/videos/calc_improper_inf.mp4",
    transcript:
      "An improper integral of type one has an infinite limit — for example, the integral of one over x squared from one out to infinity. Infinity isn't a number you can plug in, so we replace it with a variable t and compute the ordinary integral from one to t. That answer is one minus one over t. Now we let t grow without bound and watch what the area does. As t goes to infinity, one over t shrinks to zero, so the area approaches one. The integral converges, and we say its value is one. If the limit had blown up, we'd say the integral diverges instead.",
  },
  {
    patterns: [
      /improper\s+integral.*type\s*2\b/i,
      /improper\s+integral.*type\s*ii\b/i,
      /improper\s+integral.*vertical\s+asymptot/i,
      /vertical\s+asymptot.*integral/i,
      /\btype\s*2.*improper/i,
      /\btype\s*ii.*improper/i,
    ],
    video: "/cache/videos/calc_improper_vert.mp4",
    transcript:
      "An improper integral of type two has a vertical asymptote inside or at the edge of its interval — for example, one over root x on the interval from zero to one. The function blows up at zero, so we can't just plug zero in. Instead, replace the trouble end with a variable t and compute the ordinary integral from t to one. That answer is two minus two times root t. Now slide t toward zero from the right and watch the area. Two times root t shrinks to zero, so the area approaches two. Even though the curve goes to infinity at the left edge, the area underneath stays finite — the integral converges to two.",
  },
  {
    patterns: [
      /comparison\s+test/i,
      /comparison\s+theorem/i,
      /direct\s+comparison/i,
    ],
    video: "/cache/videos/calc_comparison.mp4",
    transcript:
      "The comparison test lets you decide whether an improper integral converges without computing it. Suppose you have two non-negative functions f and g, with f always less than or equal to g. Then the area under f is sandwiched under the area under g. So if g's improper integral converges to a finite value, f's must also converge — it can't be bigger than something finite. The contrapositive is just as useful: if f's integral diverges, then g's must diverge too, because g sits on top of something already infinite. Pick a g you already know about and you can settle f without doing any new integration.",
  },
];

function findImportedVideo(text: string): VideoMatch | null {
  for (const m of IMPORTED_VIDEO_MATCHES) {
    if (m.patterns.some((p) => p.test(text))) return m;
  }
  return null;
}

function chaptersToTheorems(t: ImportedTextbook | null): Theorem[] {
  if (!t) return [];
  const out: Theorem[] = [];
  for (const ch of t.chapters) {
    for (const s of ch.sections) {
      // Match against the section heading + the theorem title combined,
      // so either "7.1 Improper Integrals…" or just the title alone hits.
      const matchText = `${s.heading} ${s.theorem.title}`;
      const match = findImportedVideo(matchText);
      out.push({
        id: s.theorem.id,
        title: s.theorem.title || s.heading,
        statement: s.theorem.statement,
        context: s.theorem.context,
        transcript: match ? { en: match.transcript } : {},
        cinematic: match ? { video: match.video } : undefined,
      });
    }
  }
  return out;
}

// Convert imported PDF chapters → ChapterDef[] (the same shape built-ins
// use) so the textbook viewer can render either with the same code.
function importedToChapters(
  t: ImportedTextbook,
  derivedTheorems: Theorem[],
): ChapterDef[] {
  const idToIndex = new Map(derivedTheorems.map((th, i) => [th.id, i]));
  return t.chapters.map((ch) => ({
    number: ch.number,
    title: ch.title,
    blurb: ch.blurb,
    sections: ch.sections.map((s) => ({
      heading: s.heading,
      formal: {
        kind: s.formal.kind,
        name: s.formal.name ?? undefined,
        body: s.formal.body,
      },
      intro: s.intro,
      theoremIndex: idToIndex.get(s.theorem.id) ?? 0,
    })),
  }));
}

export function TextbookLibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(readInitial);
  // Open-times for built-in books: not persisted across sessions, just used
  // for the menu's most-recently-opened sort within a session.
  const [builtinOpenedAt, setBuiltinOpenedAt] = useState<Record<string, number>>(
    () => {
      const init: Record<string, number> = {};
      // Whichever built-in is active at startup gets a fresh timestamp so it
      // sorts to the top.
      const ids = BUILTIN_BOOKS.map((b) => b.id);
      const now = Date.now();
      for (const id of ids) init[id] = id === state.activeId ? now : 0;
      return init;
    },
  );

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
      const isBuiltin = !!builtinById(id);
      if (isBuiltin) {
        setBuiltinOpenedAt((prev) => ({ ...prev, [id]: now }));
        persist({ ...state, activeId: id });
        return;
      }
      const imported = state.imported.map((b) =>
        b.id === id ? { ...b, lastOpenedAt: now } : b,
      );
      persist({ activeId: id, imported });
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
      persist({ activeId: id, imported: [book, ...state.imported] });
      return id;
    },
    [persist, state.imported],
  );

  const remove = useCallback(
    (id: string) => {
      if (builtinById(id)) return; // built-ins are not deletable
      const imported = state.imported.filter((b) => b.id !== id);
      const activeId =
        state.activeId === id ? DEFAULT_BUILTIN_ID : state.activeId;
      if (activeId === DEFAULT_BUILTIN_ID) {
        const now = Date.now();
        setBuiltinOpenedAt((prev) => ({ ...prev, [DEFAULT_BUILTIN_ID]: now }));
      }
      persist({ activeId, imported });
    },
    [persist, state],
  );

  // Reset the active built-in's open-time when nothing has been recorded yet.
  useEffect(() => {
    if (builtinById(state.activeId) && !builtinOpenedAt[state.activeId]) {
      setBuiltinOpenedAt((prev) => ({ ...prev, [state.activeId]: Date.now() }));
    }
  }, [state.activeId, builtinOpenedAt]);

  // Stitch built-ins + imported into one Book[] sorted by lastOpenedAt desc.
  const books = useMemo<Book[]>(() => {
    const builtinBooks: Book[] = BUILTIN_BOOKS.map((b) => ({
      id: b.id,
      name: b.name,
      kind: "builtin" as const,
      lastOpenedAt: builtinOpenedAt[b.id] || 0,
    }));
    return [...builtinBooks, ...state.imported].sort(
      (a, b) => b.lastOpenedAt - a.lastOpenedAt,
    );
  }, [state.imported, builtinOpenedAt]);

  const active = useMemo(
    () => books.find((b) => b.id === state.activeId),
    [books, state.activeId],
  );

  // Resolve the active book's content. Built-ins look up by id from the
  // BUILTIN_BOOKS registry; imported books carry their content inline.
  const { activeChapters, activeTheorems, activeImported, importedTheorems } =
    useMemo(() => {
      const builtin = builtinById(state.activeId);
      if (builtin) {
        return {
          activeChapters: builtin.chapters,
          activeTheorems: builtin.theorems,
          activeImported: null as ImportedTextbook | null,
          importedTheorems: [] as Theorem[],
        };
      }
      const importedBook = state.imported.find((b) => b.id === state.activeId);
      const content = importedBook?.content ?? null;
      const derived = chaptersToTheorems(content);
      return {
        activeChapters: content ? importedToChapters(content, derived) : [],
        activeTheorems: derived,
        activeImported: content,
        importedTheorems: derived,
      };
    }, [state.activeId, state.imported]);

  const value = useMemo<Ctx>(
    () => ({
      books,
      activeId: state.activeId,
      active,
      activeChapters,
      activeTheorems,
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
      activeChapters,
      activeTheorems,
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
