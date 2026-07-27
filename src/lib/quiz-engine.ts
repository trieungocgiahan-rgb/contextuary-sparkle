// Deterministic client-side quiz generator. No AI at runtime.

import type { WordRow } from "./vocab.functions";

export type QuizType = "word_meaning" | "meaning_word" | "cloze" | "collocation" | "closest_meaning" | "listen";

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  word_meaning: "Word → meaning",
  meaning_word: "Meaning → word",
  cloze: "Fill in the blank",
  collocation: "Collocation",
  closest_meaning: "Closest in meaning",
  listen: "Listen and choose",
};

export type QuizQuestion = {
  id: string;
  word_id: string;
  word: string;
  type: QuizType;
  prompt: string;
  options: string[];
  answer_index: number;
  // Feedback context
  filled_sentence?: string;
  vietnamese_meaning?: string | null;
  memory_hint?: string | null;
  play_audio?: string; // text to speak on load (listen questions)
};

export type FallbackWord = {
  word: string;
  vietnamese_meaning: string | null;
  part_of_speech: string | null;
  synonyms?: string[];
};

// ---------- utilities ----------
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Escape regex special chars
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blankOutWord(sentence: string, target: string): string | null {
  const stem = target.replace(/(ed|ing|s|es|ly)$/, "");
  const re = new RegExp(`\\b${esc(target)}\\w*|\\b${esc(stem)}\\w*`, "i");
  if (!re.test(sentence)) return null;
  return sentence.replace(re, "______");
}

function blankOutInCollocation(coll: string, target: string): string | null {
  const stem = target.replace(/(ed|ing|s|es|ly)$/, "");
  const re = new RegExp(`\\b(${esc(target)}|${esc(stem)})\\w*`, "i");
  if (!re.test(coll)) return null;
  return coll.replace(re, "______");
}

// ---------- distractor picking ----------
function pickDistractors(
  target: WordRow,
  library: WordRow[],
  fallback: FallbackWord[],
  kind: "meaning" | "word",
  opts: { matchPos?: boolean } = {},
): { correct: string; options: string[] } | null {
  const forbidden = new Set(
    (target.synonyms ?? []).map(normalize).concat(normalize(target.word)),
  );

  // Same-tag first
  const sameTag = library.filter(
    (w) => w.id !== target.id && w.tag_id && w.tag_id === target.tag_id,
  );
  const others = library.filter(
    (w) => w.id !== target.id && (!w.tag_id || w.tag_id !== target.tag_id),
  );

  const valueOf = (w: WordRow | FallbackWord) =>
    kind === "meaning" ? (w.vietnamese_meaning ?? "").trim() : w.word.trim();

  const isEligible = (w: WordRow | FallbackWord) => {
    const v = valueOf(w);
    if (!v) return false;
    if (forbidden.has(normalize(w.word))) return false;
    if (opts.matchPos && target.part_of_speech && w.part_of_speech && w.part_of_speech !== target.part_of_speech) {
      return false;
    }
    return true;
  };

  const seen = new Set<string>();
  const pool: string[] = [];
  for (const w of [...shuffle(sameTag), ...shuffle(others)]) {
    if (!isEligible(w)) continue;
    const v = valueOf(w);
    const key = normalize(v);
    if (seen.has(key) || key === normalize(valueOf(target))) continue;
    seen.add(key);
    pool.push(v);
    if (pool.length >= 6) break;
  }

  if (pool.length < 3) {
    for (const w of shuffle(fallback)) {
      if (!isEligible(w)) continue;
      const v = valueOf(w);
      const key = normalize(v);
      if (seen.has(key) || key === normalize(valueOf(target))) continue;
      seen.add(key);
      pool.push(v);
      if (pool.length >= 6) break;
    }
  }

  if (pool.length < 3) return null;
  const correct = valueOf(target);
  const opts4 = shuffle([correct, ...pool.slice(0, 3)]);
  return { correct, options: opts4 };
}

// ---------- question builders ----------
type Ctx = { library: WordRow[]; fallback: FallbackWord[] };

function buildWordMeaning(w: WordRow, ctx: Ctx): QuizQuestion | null {
  if (!w.vietnamese_meaning) return null;
  const d = pickDistractors(w, ctx.library, ctx.fallback, "meaning");
  if (!d) return null;
  return {
    id: `wm-${w.id}`,
    word_id: w.id,
    word: w.word,
    type: "word_meaning",
    prompt: w.word,
    options: d.options,
    answer_index: d.options.indexOf(d.correct),
    vietnamese_meaning: w.vietnamese_meaning,
    memory_hint: w.memory_hint,
  };
}

function buildMeaningWord(w: WordRow, ctx: Ctx): QuizQuestion | null {
  if (!w.vietnamese_meaning) return null;
  const d = pickDistractors(w, ctx.library, ctx.fallback, "word");
  if (!d) return null;
  return {
    id: `mw-${w.id}`,
    word_id: w.id,
    word: w.word,
    type: "meaning_word",
    prompt: w.vietnamese_meaning,
    options: d.options,
    answer_index: d.options.indexOf(d.correct),
    vietnamese_meaning: w.vietnamese_meaning,
    memory_hint: w.memory_hint,
  };
}

function buildCloze(w: WordRow, ctx: Ctx): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const examples = (w.examples ?? []).filter(Boolean);
  for (let i = 0; i < examples.length; i++) {
    const blanked = blankOutWord(examples[i], w.word);
    if (!blanked) continue;
    const d = pickDistractors(w, ctx.library, ctx.fallback, "word", { matchPos: true });
    if (!d) continue;
    out.push({
      id: `cz-${w.id}-${i}`,
      word_id: w.id,
      word: w.word,
      type: "cloze",
      prompt: blanked,
      options: d.options,
      answer_index: d.options.indexOf(d.correct),
      filled_sentence: examples[i],
      vietnamese_meaning: w.vietnamese_meaning,
      memory_hint: w.memory_hint,
    });
  }
  return out;
}

function buildCollocation(w: WordRow, ctx: Ctx): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const cs = (w.collocations ?? []).filter(Boolean);
  for (let i = 0; i < cs.length; i++) {
    const blanked = blankOutInCollocation(cs[i], w.word);
    if (!blanked) continue;
    const d = pickDistractors(w, ctx.library, ctx.fallback, "word", { matchPos: true });
    if (!d) continue;
    out.push({
      id: `co-${w.id}-${i}`,
      word_id: w.id,
      word: w.word,
      type: "collocation",
      prompt: blanked,
      options: d.options,
      answer_index: d.options.indexOf(d.correct),
      filled_sentence: cs[i],
      vietnamese_meaning: w.vietnamese_meaning,
      memory_hint: w.memory_hint,
    });
  }
  return out;
}

function buildClosest(w: WordRow, ctx: Ctx): QuizQuestion | null {
  const syns = (w.synonyms ?? []).filter(Boolean);
  if (!syns.length) return null;
  const correct = syns[Math.floor(Math.random() * syns.length)];

  const forbidden = new Set([normalize(w.word), ...syns.map(normalize)]);
  const pool: string[] = [];
  for (const other of [...shuffle(ctx.library), ...shuffle(ctx.fallback)]) {
    if (normalize(other.word) === normalize(w.word)) continue;
    if (forbidden.has(normalize(other.word))) continue;
    pool.push(other.word);
    if (pool.length >= 3) break;
  }
  if (pool.length < 3) return null;
  const options = shuffle([correct, ...pool]);
  return {
    id: `cm-${w.id}`,
    word_id: w.id,
    word: w.word,
    type: "closest_meaning",
    prompt: w.word,
    options,
    answer_index: options.indexOf(correct),
    vietnamese_meaning: w.vietnamese_meaning,
    memory_hint: w.memory_hint,
  };
}

function buildListen(w: WordRow, ctx: Ctx): QuizQuestion | null {
  if (!w.vietnamese_meaning) return null;
  const d = pickDistractors(w, ctx.library, ctx.fallback, "meaning");
  if (!d) return null;
  return {
    id: `ln-${w.id}`,
    word_id: w.id,
    word: w.word,
    type: "listen",
    prompt: "🔊 Listen and choose the correct meaning",
    options: d.options,
    answer_index: d.options.indexOf(d.correct),
    play_audio: w.word,
    vietnamese_meaning: w.vietnamese_meaning,
    memory_hint: w.memory_hint,
  };
}

export function buildQuiz(params: {
  words: WordRow[];
  library: WordRow[];
  fallback: FallbackWord[];
  enabledTypes: QuizType[];
  count: number | "all";
}): QuizQuestion[] {
  const { words, enabledTypes, count } = params;
  const ctx: Ctx = { library: params.library, fallback: params.fallback };
  const enabled = new Set(enabledTypes);

  const all: QuizQuestion[] = [];
  for (const w of words) {
    if (enabled.has("word_meaning")) {
      const q = buildWordMeaning(w, ctx);
      if (q) all.push(q);
    }
    if (enabled.has("meaning_word")) {
      const q = buildMeaningWord(w, ctx);
      if (q) all.push(q);
    }
    if (enabled.has("cloze")) all.push(...buildCloze(w, ctx));
    if (enabled.has("collocation")) all.push(...buildCollocation(w, ctx));
    if (enabled.has("closest_meaning")) {
      const q = buildClosest(w, ctx);
      if (q) all.push(q);
    }
    if (enabled.has("listen")) {
      const q = buildListen(w, ctx);
      if (q) all.push(q);
    }
  }

  const shuffled = shuffle(all);
  return count === "all" ? shuffled : shuffled.slice(0, count);
}
