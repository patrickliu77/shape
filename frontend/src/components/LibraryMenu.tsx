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
    <>
      {/* Invisible hot-zone — only present when the panel is closed.
          Pinned to the left edge so the cursor approaching the margin
          triggers an expand. Unmounts as soon as the panel opens so there
          is no overlap or seam in front of the panel. */}
      {!open && (
        <div
          className="fixed left-0 top-0 w-8 h-full z-40"
          onMouseEnter={() => setOpen(true)}
          aria-hidden
          title={tHint}
        />
      )}

      {/* Side panel — flush with the left edge (left-0), full viewport
          height, width transitions from 0 → 288px for a soft expand.
          When open, mouseleave anywhere on the panel collapses it. */}
      <div
        className={`fixed left-0 top-0 h-full z-40 overflow-hidden transition-[width] duration-200 ease-out
          ${open ? "w-72" : "w-0"}`}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="w-72 h-full bg-white dark:bg-[#15121f] border-r border-stone-200 dark:border-[#2d2740] shadow-xl py-4 px-3 flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 font-sans font-semibold px-2 mb-2">
            {tTitle}
          </div>
          <ul className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
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
    </>
  );
}
