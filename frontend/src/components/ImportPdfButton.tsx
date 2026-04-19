import { useRef, useState } from "react";
import { useTextbookLibrary, type ImportedChapter } from "../lib/library";
import { useT } from "../lib/translate";

// Top-bar button that lets the student upload a PDF textbook. The backend
// extracts text via PyMuPDF, structures it through Claude into the same
// chapters/sections/theorems shape the built-in textbook uses, and the new
// book is added to the library (left-hand menu) and made active.
export function ImportPdfButton() {
  const { addImported } = useTextbookLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tImport = useT("Import PDF");
  const tImporting = useT("Reading…");

  const onPick = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import-pdf", { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { chapters: ImportedChapter[] };
      addImported({ chapters: data.chapters, source: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFile}
        className="hidden"
      />
      <button
        onClick={onPick}
        disabled={pending}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition border bg-stone-100 dark:bg-stone-800 text-ink dark:text-stone-100 border-transparent hover:border-stone-300 dark:hover:border-stone-600 disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
        </svg>
        <span className="hidden sm:inline">
          {pending ? tImporting : tImport}
        </span>
      </button>
      {error && (
        <span
          className="text-[10px] text-red-500 dark:text-red-400 max-w-[12rem] truncate"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}
