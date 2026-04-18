import type { Lang } from "../types";

export type ExplainRequest = {
  theorem_id?: string;
  theorem_title?: string;
  theorem_statement?: string;
  text: string;
  lang: Lang;
  history?: { role: "user" | "assistant"; content: string }[];
};

export type ExplainResponse = {
  answer: string;
  model: "k2-think" | "mercury" | "nile-chat" | "sherkala" | "claude" | "stub";
};

export type AskStep = { title: string; body: string };

export type AskRequest = {
  text: string;
  lang: Lang;
  history?: { role: "user" | "assistant"; content: string }[];
};

export type AskResponse = {
  answer: string;
  steps: AskStep[];
  suggested_theorem_id: string | null;
  video_url: string | null;
  video_at_step: number | null;
  model: string;
};

const API_BASE = "/api";

export async function explain(req: ExplainRequest): Promise<ExplainResponse> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`explain failed: ${res.status}`);
  return res.json();
}

export async function ask(req: AskRequest): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`ask failed: ${res.status}`);
  return res.json();
}
