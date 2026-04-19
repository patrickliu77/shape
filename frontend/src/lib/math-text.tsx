import type { ReactNode } from "react";
import { BlockMath, InlineMath } from "react-katex";

// ── Defensive sanitiser for non-math prose ────────────────────────────────
// Imported PDFs and Claude responses occasionally come back with content
// that doesn't belong in plain text:
//   - LaTeX layout macros: \begin{itemize}, \item, \par, …
//   - Math-spacing commands outside math: \,, \;, …
//   - Markdown formatting: **bold**, *italic*, _italic_, `code`, # heading
// We strip the LaTeX junk and convert the markdown into real JSX so the
// prose looks polished instead of sprinkled with raw `**` or `\item` tokens.
const LIST_ENV_RE = /\\(?:begin|end)\{(?:itemize|enumerate|description|list)\}/g;
const ITEM_RE = /\\item\b\s*/g;
const OUTSIDE_MATH_GLUE_RE = /\\[,;!:](?![A-Za-z])/g;
const LAYOUT_RE = /\\(?:par|noindent|smallskip|medskip|bigskip|vspace\{[^}]*\}|hspace\{[^}]*\})\b\s*/g;
// Markdown headings at line start, e.g. "# Title" or "## Subtitle".
const HEADING_RE = /(^|\n)\s{0,3}#{1,6}\s+/g;

function scrubProse(prose: string): string {
  return prose
    .replace(LIST_ENV_RE, " ")
    .replace(ITEM_RE, " • ")
    .replace(LAYOUT_RE, " ")
    .replace(OUTSIDE_MATH_GLUE_RE, " ")
    .replace(HEADING_RE, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:])/g, "$1");
}

// Recognises markdown emphasis. Order matters: longer markers (**, __)
// before shorter (*, _) so `**foo**` isn't misread as `*[*foo]*`. Each
// pattern requires non-whitespace inside so a stray asterisk used for
// multiplication doesn't trigger a match.
const MD_RE =
  /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*(?!\s)[^*\n]+?(?<!\s)\*|_(?!\s)[^_\n]+?(?<!\s)_|`[^`\n]+?`)/g;

function renderProse(prose: string): ReactNode[] {
  const cleaned = scrubProse(prose);
  if (!cleaned) return [];
  const parts = cleaned.split(MD_RE);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith("**") && p.endsWith("**") && p.length >= 4) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("__") && p.endsWith("__") && p.length >= 4) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length >= 2) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith("_") && p.endsWith("_") && p.length >= 2) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[0.95em]"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

// Splits text on math delimiters and renders each math chunk via KaTeX.
// Recognised delimiters:
//   $$...$$     block math
//   $...$       inline math
//   \(...\)     inline math (Mercury / standard LaTeX)
//   \[...\]     block math
//
// Overflow strategy: render every formula at its natural size and let
// container-level CSS decide whether a scrollbar is needed.
//   - Block math: the global `.katex-display { overflow-x: auto }` rule in
//     index.css triggers a horizontal scrollbar ONLY when the rendered
//     formula is wider than its parent column. No per-formula wrapper.
//   - Inline math: no wrapper at all — InlineMath flows inline like any
//     other character. If a single inline formula is wider than the line,
//     the row's parent (the textbook article, which already has
//     `overflow-x: hidden` plus `word-break`) handles the clipping; the
//     line itself wraps before/after the formula.
// This avoids the spurious scrollbar tracks Chrome draws on inline-block
// wrappers whose intrinsic width differs from KaTeX's by a sub-pixel.
function Block({ tex }: { tex: string }) {
  return <BlockMath math={tex} />;
}

function Inline({ tex }: { tex: string }) {
  return <InlineMath math={tex} />;
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
        // Non-math prose: scrub stray LaTeX layout macros that KaTeX
        // would otherwise leak through, and convert markdown emphasis
        // (**bold**, *italic*, `code`) into real JSX so it doesn't show
        // up as raw asterisks or backticks.
        return <span key={i}>{renderProse(p)}</span>;
      })}
    </>
  );
}
