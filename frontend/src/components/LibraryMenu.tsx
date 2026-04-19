import { useState } from "react";
import { useTextbookLibrary, BUILTIN_ID } from "../lib/library";
import { useT } from "../lib/translate";

// Hover-expanding rail on the left edge of the page. Always-visible vertical
// stripe with a small library icon; on hover it pops out a bubble panel
// listing every textbook (built-in + imported PDFs), most-recently-opened
// first. Click to switch; × to delete an imported one.
export function LibraryMenu() {
  const { books, activeId, setActive, remove } = useTextbookLibrary();
  const [open, setOpen] = useState(false);

  const tTitle = useT("Your textbooks");
  const tHint = useT("Hover to open");
  const tBuiltin = useT("Calculus Textbook");
  const tDelete = useT("Remove from library");

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-stretch"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Always-visible rail. Stays as a slim accent stripe so the affordance
          is discoverable without crowding the textbook. */}
      <div
        className={`flex flex-col items-center justify-center gap-3 py-4 pr-1 pl-2
          rounded-r-xl shadow-lg backdrop-blur transition-colors
          ${open
            ? "bg-white dark:bg-[#15121f] border-r border-y border-stone-200 dark:border-[#2d2740]"
            : "bg-violet-100/80 dark:bg-violet-900/40 hover:bg-violet-200/80 dark:hover:bg-violet-900/60"
          }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-accent dark:text-violet-300"
          aria-hidden
        >
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
        </svg>
        {!open && (
          <>
            {/* Tiny dots indicating how many books are in the library. */}
            <div className="flex flex-col items-center gap-1.5">
              {books.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  className={`w-1.5 h-1.5 rounded-full ${
                    b.id === activeId
                      ? "bg-accent dark:bg-violet-300"
                      : "bg-stone-400/70 dark:bg-stone-500/70"
                  }`}
                />
              ))}
            </div>
            <div
              className="text-[9px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400 [writing-mode:vertical-rl] rotate-180"
              aria-hidden
            >
              {tHint}
            </div>
          </>
        )}
      </div>

      {/* Bubble — slides out on hover. Width transitions from 0 to ~280px so
          there's a soft expand effect rather than a hard pop. */}
      <div
        className={`overflow-hidden transition-[max-width] duration-200 ease-out
          ${open ? "max-w-xs" : "max-w-0"}`}
      >
        <div className="w-72 ml-1 my-2 bg-white dark:bg-[#15121f] border border-stone-200 dark:border-[#2d2740] rounded-r-2xl shadow-xl py-3 px-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 font-sans font-semibold px-2 mb-2">
            {tTitle}
          </div>
          <ul className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
            {books.map((b) => {
              const isActive = b.id === activeId;
              const isBuiltin = b.id === BUILTIN_ID;
              return (
                <li key={b.id}>
                  <div
                    className={`group flex items-center gap-2 px-2 py-2 rounded-md transition cursor-pointer
                      ${isActive
                        ? "bg-violet-100 dark:bg-violet-900/40 text-accent dark:text-violet-200"
                        : "hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-200"
                      }`}
                    onClick={() => setActive(b.id)}
                  >
                    <span className="shrink-0">
                      {isBuiltin ? (
                        // open-book icon for built-in
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z" />
                        </svg>
                      ) : (
                        // pdf-document icon for imported
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                        </svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={b.name}>
                        {isBuiltin ? tBuiltin : b.name}
                      </div>
                      {!isBuiltin && (
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                          {new Date(b.lastOpenedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {!isBuiltin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(b.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition px-1"
                        title={tDelete}
                        aria-label={tDelete}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
