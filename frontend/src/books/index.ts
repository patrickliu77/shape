// Registry of every built-in textbook the library knows about.
// Adding a new built-in book is just: add it to this array.

import { calculusBook } from "./calculus";
import { geometryBook } from "./geometry";
import { algebraBook } from "./algebra";
import type { BuiltinBook } from "./types";

export type { BuiltinBook, ChapterDef, Section, FormalKind } from "./types";

export const BUILTIN_BOOKS: BuiltinBook[] = [
  calculusBook,
  geometryBook,
  algebraBook,
];

export function builtinById(id: string): BuiltinBook | undefined {
  return BUILTIN_BOOKS.find((b) => b.id === id);
}

// id of the textbook that's active when the user has never picked one.
export const DEFAULT_BUILTIN_ID = calculusBook.id;
