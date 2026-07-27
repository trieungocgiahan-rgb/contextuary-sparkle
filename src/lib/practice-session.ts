// Shared session config passed from picker to /practice/* routes via sessionStorage.
import type { QuizType } from "./quiz-engine";

export type PracticeMode = "standard" | "ai";
export type PracticeType = "quiz" | "flashcards";
export type WordScope =
  | { kind: "selected"; ids: string[] }
  | { kind: "today" }
  | { kind: "all" }
  | { kind: "status"; statuses: ("new" | "learning" | "reviewing" | "mastered")[] }
  | { kind: "favorites" };

export type SessionConfig = {
  mode: PracticeMode;
  type: PracticeType;
  scope: WordScope;
  size: 10 | 20 | 50 | "all";
  quizTypes: QuizType[];
};

const KEY = "contextuary:practice-session";

export function saveSession(cfg: SessionConfig) {
  try { sessionStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* noop */ }
}

export function loadSession(): SessionConfig | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch { return null; }
}

export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
}
