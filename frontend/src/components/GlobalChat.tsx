import { useEffect, useRef, useState } from "react";
import { ask, type AskStep } from "../lib/api";
import { useLang } from "../lib/lang";
import { useT } from "../lib/translate";
import { MathText } from "../lib/math-text";
import { InlineVideoGate } from "./InlineVideoGate";
import { play as playNarration, stop as stopNarration } from "../lib/player";

type Props = {
  onOpenTheorem: (id: string) => void;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  steps?: AskStep[];
  suggestedTheoremId?: string | null;
  videoUrl?: string | null;
  videoAtStep?: number | null;
  pending?: boolean;
};

const STR = {
  placeholder: "Ask any math question…",
  ask: "Ask",
  title: "Ask shape",
  subtitle: "I can answer math questions and point you to the right textbook visualization.",
  open: "▶ Open visualization",
  close: "Close",
  thinking: "Thinking…",
  failed: "Sorry — couldn't reach the AI right now.",
  steps: "Step-by-step",
  playStep: "Play narration",
  stopStep: "Stop",
  examples: "Try:",
  ex1: "Why does the chain rule multiply derivatives?",
  ex2: "What's the derivative of e^(x²)?",
  ex3: "Why is ∫e^(-x²)dx equal to √π?",
};

export function GlobalChat({ onOpenTheorem }: Props) {
  const { lang, dir } = useLang();
  void lang;
  const t = {
    placeholder: useT(STR.placeholder),
    ask: useT(STR.ask),
    title: useT(STR.title),
    subtitle: useT(STR.subtitle),
    open: useT(STR.open),
    close: useT(STR.close),
    thinking: useT(STR.thinking),
    failed: useT(STR.failed),
    steps: useT(STR.steps),
    playStep: useT(STR.playStep),
    stopStep: useT(STR.stopStep),
    examples: useT(STR.examples),
    ex1: useT(STR.ex1),
    ex2: useT(STR.ex2),
    ex3: useT(STR.ex3),
  };
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the conversation to the bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  // ESC closes the overlay
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const submit = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || pending) return;
    setOpen(true);
    const userMsg: Message = { role: "user", content: value };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPending(true);
    // Only the FIRST relevant assistant turn in a thread should embed a
    // video. Follow-ups ("use taylor expansion to prove it") get text-only.
    const alreadyShownVideo = messages.some((m) => m.role === "assistant" && m.videoUrl);
    try {
      const resp = await ask({
        text: value,
        lang,
        history: next.map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages([
        ...next,
        {
          role: "assistant",
          content: resp.answer,
          steps: resp.steps,
          suggestedTheoremId: resp.suggested_theorem_id,
          videoUrl: alreadyShownVideo ? null : resp.video_url,
          videoAtStep: alreadyShownVideo ? null : resp.video_at_step,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: t.failed },
      ]);
    } finally {
      setPending(false);
    }
  };

  const handleOpen = (id: string) => {
    onOpenTheorem(id);
    setOpen(false);
  };

  // Track which step (if any) is currently playing narration so the button
  // toggles between play/stop. Format: `${msgIdx}:${stepIdx}` or null.
  const [playingStep, setPlayingStep] = useState<string | null>(null);

  const togglePlayStep = (msgIdx: number, stepIdx: number, text: string) => {
    const key = `${msgIdx}:${stepIdx}`;
    if (playingStep === key) {
      stopNarration();
      setPlayingStep(null);
      return;
    }
    setPlayingStep(key);
    // Strip $...$ delimiters so the TTS engine reads "f of x" instead of
    // literal dollar signs.
    const cleanText = text.replace(/\$([^$]+)\$/g, "$1");
    playNarration(cleanText, lang, { onEnd: () => setPlayingStep(null) });
  };

  // Stop any playing narration when the chat closes
  useEffect(() => {
    if (!open) {
      stopNarration();
      setPlayingStep(null);
    }
  }, [open]);

  return (
    <>
      {/* Sticky bottom bar — always visible. Click or focus expands the
          conversation overlay above. */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 sm:px-6 pb-3 sm:pb-4 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 dark:bg-[#15121f]/95 backdrop-blur border border-stone-200 dark:border-[#2d2740] shadow-lg"
          >
            <span className="pl-1 text-violet-500 dark:text-violet-300" aria-hidden>
              {/* spark icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2L12 2zm7 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM5 14l.8 2.4L8 17l-2.2.6L5 20l-.8-2.4L2 17l2.2-.6L5 14z"/></svg>
            </span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => messages.length > 0 && setOpen(true)}
              placeholder={t.placeholder}
              dir={dir}
              className="flex-1 px-2 py-1 bg-transparent text-sm focus:outline-none text-ink dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
              aria-label={t.placeholder}
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="px-3 py-1 text-sm font-medium bg-accent text-white rounded-full hover:bg-violet-700 disabled:opacity-40 transition shrink-0"
            >
              {t.ask}
            </button>
          </form>
        </div>
      </div>

      {/* Conversation overlay — slides up from bottom when there's a chat */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#15121f] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-stone-200 dark:border-[#2d2740]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between px-5 py-4 border-b border-stone-200 dark:border-[#2d2740] shrink-0">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-violet-500 dark:text-violet-300 font-semibold mb-1">
                  {t.title}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 max-w-md leading-snug">
                  {t.subtitle}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-100 text-2xl leading-none ml-3 shrink-0"
                aria-label={t.close}
              >
                ×
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 && (
                <div className="text-sm text-stone-500 dark:text-stone-400 space-y-2">
                  <div className="font-medium">{t.examples}</div>
                  {[t.ex1, t.ex2, t.ex3].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => submit(ex)}
                      className="block text-left w-full px-3 py-2 rounded-md border border-stone-200 dark:border-[#2d2740] hover:border-accent dark:hover:border-violet-400 hover:bg-stone-50 dark:hover:bg-[#221d31] transition text-stone-700 dark:text-stone-200"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} dir={dir}>
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-violet-50 dark:bg-violet-900/40 text-ink dark:text-stone-100 rounded-2xl rounded-br-md px-4 py-2.5 text-sm">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                        <MathText>{m.content}</MathText>
                      </div>

                      {m.steps && m.steps.length > 0 && (
                        <div className="rounded-lg border border-stone-200 dark:border-[#2d2740] overflow-hidden">
                          <div className="px-3 py-2 bg-stone-50 dark:bg-[#221d31] text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-semibold">
                            {t.steps}
                          </div>
                          <ol className="divide-y divide-stone-200 dark:divide-[#2d2740]">
                            {m.steps.map((s, j) => {
                              const playKey = `${i}:${j}`;
                              const isPlaying = playingStep === playKey;
                              return (
                                <li key={j} className="px-3 py-2.5 text-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="shrink-0 text-[10px] font-mono w-5 h-5 rounded-full bg-accent text-white inline-flex items-center justify-center mt-0.5">
                                      {j + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-0.5">
                                        <div className="font-medium text-ink dark:text-stone-100">
                                          <MathText>{s.title}</MathText>
                                        </div>
                                        <button
                                          onClick={() =>
                                            togglePlayStep(
                                              i,
                                              j,
                                              `${s.title}. ${s.body}`,
                                            )
                                          }
                                          className="shrink-0 text-[11px] text-stone-400 hover:text-accent dark:hover:text-violet-300 transition"
                                          title={isPlaying ? t.stopStep : t.playStep}
                                          aria-label={isPlaying ? t.stopStep : t.playStep}
                                        >
                                          {isPlaying ? "■" : "▶"}
                                        </button>
                                      </div>
                                      <div className="text-stone-700 dark:text-stone-300 leading-relaxed">
                                        <MathText>{s.body}</MathText>
                                      </div>

                                      {/* Embedded video at the Claude-chosen step */}
                                      {m.videoUrl && m.videoAtStep === j && (
                                        <div className="mt-3">
                                          <InlineVideoGate videoUrl={m.videoUrl} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      )}

                      {m.suggestedTheoremId && (
                        <button
                          onClick={() => handleOpen(m.suggestedTheoremId!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-full hover:bg-violet-700 transition shadow-sm"
                        >
                          {t.open}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {pending && (
                <div className="text-sm italic text-stone-400 dark:text-stone-500">
                  {t.thinking}
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 dark:border-[#2d2740] p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder}
                  dir={dir}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-stone-300 dark:border-[#2d2740] dark:bg-[#221d31] dark:text-stone-100 dark:placeholder-stone-500 focus:outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  className="px-3 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-violet-700 disabled:opacity-40 transition shrink-0"
                >
                  {t.ask}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
