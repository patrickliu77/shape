import type { Theorem } from "../types";

export type FormalKind =
  | "Definition"
  | "Theorem"
  | "Proposition"
  | "Corollary"
  | "Lemma";

export type Section = {
  heading: string;
  formal: { kind: FormalKind; name?: string; body: string };
  // Friendly intro that lives inside the tappable simpler-explanation box.
  // Plain string with $...$ math markup so it can be auto-translated.
  intro: string;
  // Index into the book's `theorems` array — the theorem whose tap target
  // this section's box opens.
  theoremIndex: number;
};

export type ChapterDef = {
  number: number;
  title: string;
  blurb: string;
  sections: Section[];
};

export type BuiltinBook = {
  // Stable id used by the library ("calculus", "geometry", "algebra").
  id: string;
  // Human-facing name shown in the library menu.
  name: string;
  // Theorems referenced by sections via theoremIndex.
  theorems: Theorem[];
  // Chapter / section structure rendered by the textbook viewer.
  chapters: ChapterDef[];
};
