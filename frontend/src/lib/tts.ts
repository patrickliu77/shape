import type { Lang } from "../types";

const memCache = new Map<string, string>();

export async function fetchTTS(text: string, lang: Lang): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const key = `${lang}:${trimmed}`;
  const cached = memCache.get(key);
  if (cached) return cached;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, lang }),
    });
    if (!res.ok) return null;
    const data: { url: string } = await res.json();
    const fullUrl = `/api${data.url}`;
    memCache.set(key, fullUrl);
    return fullUrl;
  } catch {
    return null;
  }
}
