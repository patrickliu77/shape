import type { Theorem } from "../types";
import { TheoremBlock } from "./TheoremBlock";
import { FormalDefinition } from "./FormalDefinition";
import { useT } from "../lib/translate";
import { useTextbookLibrary } from "../lib/library";
import { MathText } from "../lib/math-text";
import type { ChapterDef, Section } from "../books";

type Props = {
  // Theorems passed in from the parent. The library provider also exposes
  // `activeTheorems` directly; both should agree, but the parent prop is
  // what the popup is wired against so we keep using it for the SectionView
  // lookup to stay consistent across renders.
  theorems: Theorem[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

function ChapterView({
  ch,
  firstChapter,
  theorems,
  activeId,
  onSelect,
}: {
  ch: ChapterDef;
  firstChapter: boolean;
  theorems: Theorem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  // In `popup` scope these calls return the English original; in `full`
  // scope they fetch translations from the language filter.
  const tTitle = useT(ch.title);
  const tBlurb = useT(ch.blurb);
  const tChapterWord = useT("Chapter");
  return (
    <div>
      <header
        className={
          firstChapter
            ? "mb-10 border-b border-stone-300 dark:border-stone-700 pb-6"
            : "mt-16 mb-10 border-b border-stone-300 dark:border-stone-700 pb-6"
        }
      >
        <div className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-2">
          {tChapterWord} {ch.number}
        </div>
        <h1 className="text-4xl font-semibold text-ink dark:text-stone-100 mb-2 break-words">
          <MathText>{tTitle}</MathText>
        </h1>
        <p className="text-stone-600 dark:text-stone-400 italic break-words">
          <MathText>{tBlurb}</MathText>
        </p>
      </header>

      <section className="space-y-2">
        {ch.sections.map((s, si) => {
          const th = theorems[s.theoremIndex];
          if (!th) return null;
          return (
            <SectionView
              key={s.heading}
              section={s}
              firstSection={si === 0}
              theorem={th}
              active={activeId === th.id}
              onSelect={onSelect}
            />
          );
        })}
      </section>
    </div>
  );
}

function SectionView({
  section,
  firstSection,
  theorem,
  active,
  onSelect,
}: {
  section: Section;
  firstSection: boolean;
  theorem: Theorem;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const tHeading = useT(section.heading);
  return (
    <div>
      <h2
        className={
          firstSection
            ? "text-2xl font-semibold mt-8 mb-3 break-words"
            : "text-2xl font-semibold mt-10 mb-3 break-words"
        }
      >
        <MathText>{tHeading}</MathText>
      </h2>
      <FormalDefinition
        kind={section.formal.kind}
        name={section.formal.name}
        body={section.formal.body}
      />
      <TheoremBlock
        theorem={theorem}
        introText={section.intro}
        onTap={() => onSelect(theorem.id)}
        active={active}
      />
    </div>
  );
}

export function Textbook({ theorems, activeId, onSelect }: Props) {
  // Source of truth for what's rendered: the library provider knows which
  // book is active (built-in or imported PDF) and exposes its chapters in
  // a uniform shape. Falls back to the parent-supplied theorems when the
  // active book is imported (those theorems are derived inside the lib).
  const { activeChapters, activeImported, active } = useTextbookLibrary();

  if (!activeChapters.length) return null;

  const sourceName = activeImported ? active?.name ?? activeImported.source : null;

  return (
    <article className="textbook max-w-2xl mx-auto px-10 py-12 bg-paper dark:bg-[#1a1726] dark:text-stone-200 shadow-sm rounded-md my-6 transition-colors">
      {sourceName && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 mb-6 font-sans">
          Imported from <span className="text-accent dark:text-violet-300">{sourceName}</span>
        </div>
      )}
      {activeChapters.map((ch, ci) => (
        <ChapterView
          key={`${ch.number}-${ch.title}`}
          ch={ch}
          firstChapter={ci === 0}
          theorems={theorems}
          activeId={activeId}
          onSelect={onSelect}
        />
      ))}
    </article>
  );
}
