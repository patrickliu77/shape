import { MathText } from "../lib/math-text";
import { useT } from "../lib/translate";

type FormalKind =
  | "Definition"
  | "Theorem"
  | "Proposition"
  | "Corollary"
  | "Lemma";

type Props = {
  // What kind of statement this is — controls the italic header label.
  kind: FormalKind;
  // Optional name in parentheses, e.g. "Chain Rule", "De Moivre".
  name?: string;
  // The body of the statement. Use $...$ inline and $$...$$ block math.
  // Plain prose is rendered in a serif face to mimic a printed textbook.
  body: string;
};

// A non-tappable, textbook-style boxed definition or theorem statement.
// This mirrors what a student would see in their printed textbook — formal,
// dense, often hard to parse on first read. Below it sits the tappable
// "simpler explanation" TheoremBlock which is what shape unlocks for them.
export function FormalDefinition({ kind, name, body }: Props) {
  // Every visible string flows through the language filter. Math is masked
  // server-side so it survives translation intact.
  const tKind = useT(kind);
  const tName = useT(name ?? "");
  const tBody = useT(body);
  return (
    <div className="my-5 border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#1f1b2c] px-5 py-4 font-serif text-stone-900 dark:text-stone-100 leading-relaxed">
      <div className="mb-2 text-[15px]">
        <span className="font-semibold italic">{tKind}</span>
        {name && <span className="font-semibold italic"> ({tName})</span>}
        <span className="font-semibold">.</span>{" "}
      </div>
      <div className="text-[15px]">
        <MathText>{tBody}</MathText>
      </div>
    </div>
  );
}
