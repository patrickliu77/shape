import type { ReactNode } from "react";
import { BlockMath } from "react-katex";
import { theoremMode, type Theorem } from "../types";
import { MathText } from "../lib/math-text";

type Props = {
  theorem: Theorem;
  onTap: () => void;
  active: boolean;
  // Friendly prose intro relocated from the section above. Renders at the
  // top of the box so the casual explanation precedes the formal-looking
  // simplified statement.
  intro?: ReactNode;
};

const BADGE_BY_MODE = {
  cinematic: "Animated",
  interactive: "Interactive",
  interactive3d: "3D Interactive",
  "cinematic+interactive": "Animated · Interactive",
  "cinematic+3d": "Animated · 3D",
  "interactive+3d": "Interactive · 3D",
  all: "Animated · Interactive · 3D",
} as const;

export function TheoremBlock({ theorem, onTap, active, intro }: Props) {
  const mode = theoremMode(theorem);
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
        {BADGE_BY_MODE[mode]} · simpler explanation
      </div>
      {intro && (
        <div className="text-stone-700 dark:text-stone-300 mb-3 leading-relaxed">
          {intro}
        </div>
      )}
      <div className="font-sans font-semibold text-ink dark:text-stone-100 text-base leading-tight mb-2">
        <MathText>{theorem.title}</MathText>
      </div>
      <div className="py-2 overflow-x-auto">
        <BlockMath math={theorem.statement} />
      </div>
      <p className="text-stone-700 dark:text-stone-300 font-serif italic">
        <MathText>{theorem.context}</MathText>
      </p>
    </div>
  );
}
