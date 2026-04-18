import { BlockMath, InlineMath } from "react-katex";

// Splits text on math delimiters and renders each math chunk via KaTeX.
// Recognised delimiters:
//   $$...$$     block math
//   $...$       inline math
//   \(...\)     inline math (Mercury / standard LaTeX)
//   \[...\]     block math
//
// Falls back to plain text on any KaTeX error so a malformed LaTeX
// fragment can never crash the bubble it's rendered inside.
export function MathText({ children }: { children: string }) {
  const parts = children.split(
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]*?\\\))/g,
  );
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("$$") && p.endsWith("$$") && p.length > 4) {
          try {
            return <BlockMath key={i} math={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("\\[") && p.endsWith("\\]") && p.length > 4) {
          try {
            return <BlockMath key={i} math={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          try {
            return <InlineMath key={i} math={p.slice(1, -1).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        if (p.startsWith("\\(") && p.endsWith("\\)") && p.length > 4) {
          try {
            return <InlineMath key={i} math={p.slice(2, -2).trim()} />;
          } catch {
            return <span key={i}>{p}</span>;
          }
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
