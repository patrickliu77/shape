import type { Lang } from "../types";
import { fetchTTS } from "./tts";
import { speak as webSpeak, stop as webStop, bcp47 } from "./speech";

// Every Audio() ever created is registered here so stop() can nuke them all.
// Avoids the "old <audio> kept playing after a new click" overlap bug.
const liveAudio = new Set<HTMLAudioElement>();
let token = 0;

type PlayOpts = { onEnd?: () => void };

function killOne(a: HTMLAudioElement) {
  try {
    a.pause();
    a.currentTime = 0;
    a.src = "";
    a.removeAttribute("src");
    a.load();
  } catch {
    /* ignore */
  }
  liveAudio.delete(a);
}

export function stop() {
  // Bump the token first so any in-flight async play() returns early.
  token++;
  // Kill every audio element we've ever started.
  for (const a of liveAudio) killOne(a);
  liveAudio.clear();
  // Flush the Web Speech queue. Some browsers need cancel() called twice
  // to drop pending utterances reliably.
  webStop();
  webStop();
}

export async function play(text: string, lang: Lang, opts: PlayOpts = {}) {
  stop();
  const myToken = ++token;

  const url = await fetchTTS(text, lang);
  if (myToken !== token) return; // user pressed stop or play again mid-fetch

  if (url) {
    const audio = new Audio(url);
    liveAudio.add(audio);

    audio.onended = () => {
      liveAudio.delete(audio);
      if (myToken === token) opts.onEnd?.();
    };
    audio.onerror = () => {
      liveAudio.delete(audio);
      // Only fall back to Web Speech for English. On Windows the OS often has
      // no ar-EG voice and Web Speech ends up spelling out the Latin
      // characters in the transcript ("L… x… L…"), which sounds awful.
      if (myToken === token && lang === "en") {
        webSpeak(text, { lang: bcp47(lang), onEnd: opts.onEnd });
      }
    };

    try {
      await audio.play();
      return;
    } catch {
      liveAudio.delete(audio);
      // Autoplay rejection or similar — fall through (English only).
    }
  }

  if (myToken === token && lang === "en") {
    webSpeak(text, { lang: bcp47(lang), onEnd: opts.onEnd });
  }
}
