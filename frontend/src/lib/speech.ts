import type { Lang } from "../types";

export type SpeakOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
};

const BCP47: Record<Lang, string> = {
  en: "en-US",
  ar: "ar-EG",
};

export function bcp47(lang: Lang): string {
  return BCP47[lang];
}

function pickVoice(langTag: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const exact = voices.find((v) => v.lang.toLowerCase() === langTag.toLowerCase());
  if (exact) return exact;
  const prefix = langTag.split("-")[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

export function speak(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  stop();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "en-US";
  u.rate = opts.rate ?? 0.95;
  u.pitch = opts.pitch ?? 1;
  const voice = pickVoice(u.lang);
  if (voice) u.voice = voice;
  u.onend = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stop() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking;
}
