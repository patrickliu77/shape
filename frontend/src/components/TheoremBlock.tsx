import type { ReactNode } from "react";
import { BlockMath } from "react-katex";
import { theoremMode, type Theorem, type TheoremMode } from "../types";
import { MathText } from "../lib/math-text";
import { useT } from "../lib/translate";

type Props = {
  theorem: Theorem;
  onTap: () => void;
  active: boolean;
  // Friendly prose intro relocated from the section above. Renders at the
  // top of the box so the casual explanation precedes the formal-looking
  // simplified statement. Pass a string to enable auto-translation; pass
  // a ReactNode if the intro contains structural JSX you don't want
  // translated.
  intro?: ReactNode;
  introText?: string;
};

// Single English source. Built as a complete sentence so the language
// filter handles word order naturally for each language.
const BADGE_EN: Record<TheoremMode, string> = {
  cinematic: "Animated · simpler explanation",
  interactive: "Interactive · simpler explanation",
  interactive3d: "3D Interactive · simpler explanation",
  "cinematic+interactive": "Animated · Interactive · simpler explanation",
  "cinematic+3d": "Animated · 3D · simpler explanation",
  "interactive+3d": "Interactive · 3D · simpler explanation",
  all: "Animated · Interactive · 3D · simpler explanation",
};

export function TheoremBlock({
  theorem,
  onTap,
  active,
  intro,
  introText,
}: Props) {
  const mode = theoremMode(theorem);
  // Every visible string flows through the language filter. Math inside
  // $...$ / $$...$$ is masked-and-restored on the backend, so it survives
  // translation intact.
  const tBadge = useT(BADGE_EN[mode]);
  const tTitle = useT(theorem.title);
  const tContext = useT(theorem.context);
  const tIntro = useT(introText ?? "");
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      className={`theorem-tappable my-5 ${
        active ? "ring-2 ring-accent ring-offset-2" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-accent dark:text-violet-300 font-sans font-semibold mb-1">
        {tBadge}
      </div>
      {introText ? (
        <div className="text-stone-700 dark:text-stone-300 mb-3 leading-relaxed">
          <MathText>{tIntro}</MathText>
        </div>
      ) : intro ? (
        <div className="text-stone-700 dark:text-stone-300 mb-3 leading-relaxed">
          {intro}
        </div>
      ) : null}
      <div className="font-sans font-semibold text-ink dark:text-stone-100 text-base leading-tight mb-2">
        <MathText>{tTitle}</MathText>
      </div>
      <div className="py-2 overflow-x-auto">
        <BlockMath math={theorem.statement} />
      </div>
      <p className="text-stone-700 dark:text-stone-300 font-serif italic">
        <MathText>{tContext}</MathText>
      </p>
    </div>
  );
}
