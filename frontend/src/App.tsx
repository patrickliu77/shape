import { useEffect, useRef, useState } from "react";
import { Textbook } from "./components/Textbook";
import { ExplainPanel } from "./components/ExplainPanel";
import { Logo } from "./components/Logo";
import { GlobalChat } from "./components/GlobalChat";
import { ImportPdfButton } from "./components/ImportPdfButton";
import { theorems, theoremById } from "./theorems-data";
import { LangProvider, useLang, LANG_LABEL, SUPPORTED, SCOPES } from "./lib/lang";
import { TranslationProvider, PopupTranslationScope } from "./lib/translate";
import { ImportedTextbookProvider, useImportedTextbook } from "./lib/imported";
import { useMediaQuery } from "./lib/use-media-query";
import { ThemeToggle } from "./lib/theme";

const SUPPORTED_LANGS = SUPPORTED;

const PANEL_WIDTH_KEY = "shape.panelWidth";
const PANEL_MIN = 360;
const PANEL_MAX = 900;
const PANEL_DEFAULT = 480;

function readPanelWidth(): number {
  if (typeof window === "undefined") return PANEL_DEFAULT;
  const v = parseInt(window.localStorage.getItem(PANEL_WIDTH_KEY) ?? "", 10);
  if (Number.isFinite(v) && v >= PANEL_MIN && v <= PANEL_MAX) return v;
  return PANEL_DEFAULT;
}

const SCOPE_LABEL: Record<(typeof SCOPES)[number], string> = {
  full: "Full page",
  popup: "Popup only",
};

function LangSwitcher() {
  const { lang, setLang, scope, setScope } = useLang();
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as typeof lang)}
        className="text-xs font-medium rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-ink dark:text-stone-100 border border-transparent hover:border-stone-300 dark:hover:border-stone-600 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
        aria-label="Language"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l} value={l} className="bg-white dark:bg-stone-800 text-ink dark:text-stone-100">
            {LANG_LABEL[l]}
          </option>
        ))}
      </select>
      {/* Scope only matters when a non-English language is picked. */}
      {lang !== "en" && (
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
          className="text-xs font-medium rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1.5 text-ink dark:text-stone-100 border border-transparent hover:border-stone-300 dark:hover:border-stone-600 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          aria-label="Translation scope"
          title="Full page = translate the whole textbook. Popup only = translate just the panel that opens when you tap a theorem."
        >
          {SCOPES.map((s) => (
            <option key={s} value={s} className="bg-white dark:bg-stone-800 text-ink dark:text-stone-100">
              {SCOPE_LABEL[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function Shell() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { importedTheorems, imported } = useImportedTextbook();
  // When a PDF is imported, theorem lookups go against its derived theorems.
  // Otherwise we use the built-in textbook.
  const activeTheorems = imported ? importedTheorems : theorems;
  const active = activeId
    ? activeTheorems.find((t) => t.id === activeId) ?? theoremById(activeId) ?? null
    : null;
  const close = () => setActiveId(null);

  // Tailwind 'md' = 768px. We render exactly one ExplainPanel (with its own
  // <audio> element) per breakpoint to prevent duplicate narration playback.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [panelWidth, setPanelWidth] = useState<number>(readPanelWidth);
  const dragging = useRef(false);

  // Persist to localStorage on commit (debounced via cleanup).
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [panelWidth]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const next = window.innerWidth - e.clientX;
    const clamped = Math.max(PANEL_MIN, Math.min(PANEL_MAX, next));
    setPanelWidth(clamped);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  const onDoubleClick = () => setPanelWidth(PANEL_DEFAULT);

  return (
    <div className="h-screen flex flex-col bg-stone-100 dark:bg-[#0c0a14] transition-colors">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-[#15121f] border-b border-stone-200 dark:border-[#2d2740] shrink-0">
        <div className="flex items-center gap-3 min-w-0 text-ink dark:text-stone-100">
          {/* Square logo. In light mode the black background reads as a chip;
              in dark mode it blends with the nav surface. */}
          <Logo className="h-10 w-10 shrink-0 rounded" />
          <span className="hidden sm:inline text-xs text-stone-400 dark:text-stone-500 truncate">
            AI-native textbook · demo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-xs text-stone-500 dark:text-stone-400 mr-2">
            Tap any theorem to see it move.
          </span>
          <ImportPdfButton />
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 min-w-0 overflow-y-auto pb-24">
          <Textbook
            theorems={activeTheorems}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </div>

        {isDesktop ? (
          <>
            {/* Draggable divider */}
            <div
              className="w-1.5 shrink-0 cursor-col-resize bg-stone-200 dark:bg-stone-800 hover:bg-accent/60 active:bg-accent transition-colors group relative"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={onDoubleClick}
              title="Drag to resize · double-click to reset"
              role="separator"
              aria-orientation="vertical"
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>

            <div
              className="shrink-0 overflow-hidden bg-white dark:bg-[#15121f]"
              style={{ width: `${panelWidth}px` }}
            >
              <PopupTranslationScope>
                <ExplainPanel theorem={active} onClose={close} />
              </PopupTranslationScope>
            </div>
          </>
        ) : (
          <>
            {active && (
              <div
                className="fixed inset-0 z-30 bg-black/30"
                onClick={close}
                aria-hidden
              />
            )}
            <div
              className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
                active ? "translate-y-0" : "translate-y-full pointer-events-none"
              }`}
              aria-hidden={!active}
            >
              <div className="bg-white dark:bg-[#15121f] rounded-t-2xl shadow-2xl max-h-[88vh] flex flex-col">
                <div className="flex justify-center pt-2 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <PopupTranslationScope>
                <ExplainPanel theorem={active} onClose={close} />
              </PopupTranslationScope>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Global "Ask shape" chat — sticky bar bottom-of-page, expands into
          a chat overlay. Suggested theorems open the side panel directly. */}
      <GlobalChat onOpenTheorem={setActiveId} />
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <TranslationProvider>
        <ImportedTextbookProvider>
          <Shell />
        </ImportedTextbookProvider>
      </TranslationProvider>
    </LangProvider>
  );
}
