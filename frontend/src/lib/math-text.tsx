import { BlockMath, InlineMath } from "react-katex";

// Splits text on math delimiters and renders each math chunk via KaTeX.
// Recognised delimiters:
//   $$...$$     block math
//   $...$       inline math
//   \(...\)     inline math (Mercury / standard LaTeX)
//   \[...\]     block math
//
// Block math is wrapped in an overflow-x-auto container so a long display
// formula scrolls horizontally inside its parent instead of blowing out
// the textbook column. Falls back to plain text on any KaTeX error so a
// malformed LaTeX fragment can never crash the bubble it's rendered inside.
function Block({ tex }: { tex: string }) {
  return (
    <div className="my-1 overflow-x-auto max-w-full">
      <BlockMath math={tex} />
    </div>
  );
}

// Inline math can also be wider than the column when it has a long
// fraction or a sum with many terms. We don't want it to stretch the
// surrounding line — give it its own scrollable inline-block. Most short
// inline expressions stay flush-inline because the inner KaTeX is
// narrower than the parent.
function Inline({ tex }: { tex: string }) {
  return (
    <span className="inline-block max-w-full overflow-x-auto align-middle">
      <InlineMath math={tex} />
    </span>
  );
}

export function MathText({ children }: { children: string }) {
  const parts = children.split(
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]*?\\\))/g,
  );
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("$$") && p.endsWith("$$") && p.length > 4) {
          try {
            return <Block key={i} tex={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("\\[") && p.endsWith("\\]") && p.length > 4) {
          try {
            return <Block key={i} tex={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          try {
            return <Inline key={i} tex={p.slice(1, -1).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("\\(") && p.endsWith("\\)") && p.length > 4) {
          try {
            return <Inline key={i} tex={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
