import { useEffect, useState } from "react";
import { BlockMath } from "react-katex";
import { theoremMode, type Theorem } from "../types";
import { CinematicView } from "./CinematicView";
import { InteractiveView } from "./InteractiveView";
import { Surface3DView } from "./Surface3DView";
import { explain } from "../lib/api";
import { stop as stopPlayback } from "../lib/player";
import { useLang, pickTranscript } from "../lib/lang";
import { useT } from "../lib/translate";
import { MathText } from "../lib/math-text";

type Props = {
  theorem: Theorem | null;
  onClose: () => void;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  model?: "k2-think" | "mercury" | "nile-chat" | "sherkala" | "claude" | "stub";
};

const MODEL_BADGE: Record<NonNullable<ChatMessage["model"]>, { label: string; cls: string }> = {
  "k2-think": {
    label: "✨ K2 Think · IFM/MBZUAI",
    cls: "text-violet-600 bg-violet-50 border-violet-200",
  },
  mercury: {
    label: "⚡ Mercury · Inception Labs",
    cls: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  "nile-chat": {
    label: "✨ Nile-Chat · MBZUAI-Paris",
    cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  sherkala: {
    label: "✨ Sherkala · Inception/MBZUAI",
    cls: "text-amber-600 bg-amber-50 border-amber-200",
  },
  claude: {
    label: "Claude · Anthropic",
    cls: "text-stone-500 bg-stone-50 border-stone-200",
  },
  stub: {
    label: "stub",
    cls: "text-stone-400 bg-stone-50 border-stone-200",
  },
};

// Single English source. The badge string is built then translated as a
// whole sentence so the language filter handles word order naturally.
const MODE_LABEL_EN: Record<
  | "cinematic"
  | "interactive"
  | "interactive3d"
  | "cinematic+interactive"
  | "cinematic+3d"
  | "interactive+3d"
  | "all"
  | "text",
  string
> = {
  cinematic: "Animated",
  interactive: "Interactive",
  interactive3d: "3D Interactive",
  "cinematic+interactive": "Animated · Interactive",
  "cinematic+3d": "Animated · 3D",
  "interactive+3d": "Interactive · 3D",
  all: "Animated · Interactive · 3D",
  text: "Imported",
};

const STR = {
  interactive: "Interactive",
  animated: "Animated",
  transcript: "Transcript",
  askPrompt: "Ask about this theorem",
  askPlaceholder: "Why does this work?",
  send: "Send",
  thinking: "thinking…",
  backendDown:
    "(Backend not reachable. Start the FastAPI server with `uvicorn main:app` in the backend/ folder.)",
  emptyHint: "Tap any theorem in the textbook to explore it.",
  close: "Close",
};

export function ExplainPanel({ theorem, onClose }: Props) {
  const { lang, dir } = useLang();
  const t = {
    interactive: useT(STR.interactive),
    animated: useT(STR.animated),
    transcript: useT(STR.transcript),
    askPrompt: useT(STR.askPrompt),
    askPlaceholder: useT(STR.askPlaceholder),
    send: useT(STR.send),
    thinking: useT(STR.thinking),
    backendDown: useT(STR.backendDown),
    emptyHint: useT(STR.emptyHint),
    close: useT(STR.close),
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMessages([]);
    setInput("");
    return () => stopPlayback();
  }, [theorem?.id]);

  if (!theorem) {
    return (
      <aside className="w-full h-full flex items-center justify-center p-10 text-stone-400 dark:text-stone-500 text-center">
        <div>
          <div className="text-5xl mb-3">✨</div>
          <div>{t.emptyHint}</div>
          <div className="mt-6 text-[10px] uppercase tracking-widest text-stone-300 dark:text-stone-600">
            Powered by <span className="text-violet-500 font-semibold">K2 Think</span> · IFM/MBZUAI
          </div>
        </div>
      </aside>
    );
  }

  const transcript = pickTranscript(theorem.transcript, lang, theorem.id);
  const mode = theoremMode(theorem);

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setPending(true);
    try {
      const { answer, model } = await explain({
        theorem_id: theorem.id,
        theorem_title: theorem.title,
        theorem_statement: theorem.statement,
        text,
        lang,
        history: newMessages,
      });
      setMessages([...newMessages, { role: "assistant", content: answer, model }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: t.backendDown },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-white dark:bg-[#15121f]">
      <header className="flex items-start justify-between p-5 border-b border-stone-200 dark:border-[#2d2740] shrink-0">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-accent dark:text-violet-300 font-semibold mb-1">
            {useT(MODE_LABEL_EN[mode])}
          </div>
          <h2 className="text-lg font-semibold text-ink dark:text-stone-100 leading-tight">
            <MathText>{useT(theorem.title)}</MathText>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-100 text-2xl leading-none ml-3 shrink-0"
          aria-label={t.close}
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="bg-stone-50 dark:bg-[#221d31] border border-stone-200 dark:border-[#2d2740] rounded-md px-4 py-3 overflow-x-auto">
          <BlockMath math={theorem.statement} />
        </div>

        {theorem.cinematic && (
          <CinematicView spec={theorem.cinematic} transcript={transcript} />
        )}
        {theorem.interactive3d && (
          <Surface3DView spec={theorem.interactive3d} />
        )}
        {theorem.interactive && (
          <InteractiveView spec={theorem.interactive} transcript={transcript} />
        )}
        {/* Imported PDF theorems have no media — surface the friendlier
            explanation directly so the popup isn't just the formal box. */}
        {mode === "text" && theorem.context && (
          <div className="bg-violet-50 dark:bg-violet-900/20 border-l-4 border-accent dark:border-violet-400 px-4 py-3 rounded-r">
            <div className="text-[10px] uppercase tracking-[0.2em] text-accent dark:text-violet-300 font-semibold mb-1">
              {useT("Simpler explanation")}
            </div>
            <p className="text-stone-700 dark:text-stone-200 leading-relaxed">
              <MathText>{useT(theorem.context)}</MathText>
            </p>
          </div>
        )}

        <details className="text-sm text-stone-600 dark:text-stone-300">
          <summary className="cursor-pointer text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100">
            {t.transcript}
          </summary>
          {transcript && (
            <p className="mt-2 leading-relaxed" dir={dir}>
              {transcript}
            </p>
          )}
        </details>

        <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
          <div className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
            {t.askPrompt}
          </div>
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div key={i} className="space-y-1">
                <div
                  dir={dir}
                  className={`text-sm rounded-md px-3 py-2 leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-50 text-ink dark:bg-violet-900/40 dark:text-stone-100"
                      : "bg-stone-100 text-stone-800 dark:bg-[#221d31] dark:text-stone-200"
                  }`}
                >
                  <MathText>{m.content}</MathText>
                </div>
                {m.role === "assistant" && m.model && (
                  <div
                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${MODEL_BADGE[m.model].cls}`}
                  >
                    {MODEL_BADGE[m.model].label}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="text-sm text-stone-400 italic">{t.thinking}</div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={t.askPlaceholder}
              dir={dir}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 dark:border-[#2d2740] dark:bg-[#221d31] dark:text-stone-100 dark:placeholder-stone-500 rounded-md focus:outline-none focus:border-accent"
            />
            <button
              onClick={send}
              disabled={pending}
              className="px-3 py-2 text-sm bg-accent text-white rounded-md hover:bg-violet-700 disabled:opacity-50 transition shrink-0"
            >
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
