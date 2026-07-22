import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WordRow = {
  id: string;
  word: string;
  ipa: string | null;
  vietnamese_meaning: string | null;
  nuance_note: string | null;
  examples: string[];
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
  memory_hint: string | null;
  status: "new" | "learning" | "reviewing" | "mastered";
  tag_id: string | null;
  is_favorite: boolean;
  created_at: string;
};

export const listWords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WordRow[]> => {
    const { data, error } = await context.supabase
      .from("words")
      .select(
        "id, word, ipa, vietnamese_meaning, nuance_note, examples, collocations, synonyms, antonyms, memory_hint, status, tag_id, is_favorite, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((w) => ({
      ...w,
      examples: Array.isArray(w.examples) ? (w.examples as string[]) : [],
    })) as WordRow[];
  });

export const createWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<WordRow> & { word: string }) => input)
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      word: String(data.word).trim(),
      ipa: data.ipa ?? null,
      vietnamese_meaning: data.vietnamese_meaning ?? null,
      nuance_note: data.nuance_note ?? null,
      examples: data.examples ?? [],
      collocations: data.collocations ?? [],
      synonyms: data.synonyms ?? [],
      antonyms: data.antonyms ?? [],
      memory_hint: data.memory_hint ?? null,
      status: data.status ?? "new",
      tag_id: data.tag_id ?? null,
      is_favorite: data.is_favorite ?? false,
    };
    const { data: inserted, error } = await context.supabase
      .from("words")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return inserted;
  });

export const updateWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; patch: Partial<WordRow> }) => input)
  .handler(async ({ data, context }) => {
    const { id, patch } = data;
    const { data: row, error } = await context.supabase
      .from("words")
      .update(patch)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("words")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tags")
      .select("id, name, color, created_at")
      .eq("user_id", context.userId)
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const createTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; color: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tags")
      .insert({ user_id: context.userId, name: data.name.trim(), color: data.color })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const updateTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; name?: string; color?: string }) => input)
  .handler(async ({ data, context }) => {
    const patch: { name?: string; color?: string } = {};
    if (data.name) patch.name = data.name.trim();
    if (data.color) patch.color = data.color;
    const { data: row, error } = await context.supabase
      .from("tags")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tags")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const saveQuizResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      results: { word_id: string; correct: boolean; question_type: string }[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const total = data.results.length;
    const score = data.results.filter((r) => r.correct).length;
    const { data: quiz, error: qErr } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        mode: "mixed",
        score,
        total_questions: total,
      })
      .select()
      .single();
    if (qErr) throw qErr;

    const rows = data.results.map((r) => ({
      quiz_id: quiz.id,
      word_id: r.word_id,
      user_id: context.userId,
      question_type: r.question_type,
      correct: r.correct,
    }));
    if (rows.length) {
      const { error } = await context.supabase.from("quiz_words").insert(rows);
      if (error) throw error;
    }

    // Auto-progress status per word
    const wordStats = new Map<string, { correct: number; total: number }>();
    for (const r of data.results) {
      const s = wordStats.get(r.word_id) ?? { correct: 0, total: 0 };
      s.total += 1;
      if (r.correct) s.correct += 1;
      wordStats.set(r.word_id, s);
    }
    for (const [wordId, s] of wordStats) {
      const { data: w } = await context.supabase
        .from("words")
        .select("status")
        .eq("id", wordId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!w) continue;
      const order = ["new", "learning", "reviewing", "mastered"] as const;
      let idx = order.indexOf(w.status);
      if (s.correct === s.total && s.total > 0) idx = Math.min(order.length - 1, idx + 1);
      else if (s.correct === 0) idx = Math.max(1, idx);
      const next = order[idx];
      if (next !== w.status) {
        await context.supabase
          .from("words")
          .update({ status: next })
          .eq("id", wordId)
          .eq("user_id", context.userId);
      }
    }
    return { quizId: quiz.id, score, total };
  });

export type Stats = {
  totalWords: number;
  mastered: number;
  learning: number;
  reviewing: number;
  new: number;
  quizAccuracy: number;
  quizAccuracyTrend: { date: string; accuracy: number }[];
  wordsOverTime: { date: string; count: number }[];
  mostMissed: { word: string; misses: number }[];
};

export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Stats> => {
    const { data: words } = await context.supabase
      .from("words")
      .select("id, status, created_at")
      .eq("user_id", context.userId);

    const { data: quizzes } = await context.supabase
      .from("quizzes")
      .select("id, score, total_questions, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });

    const { data: qw } = await context.supabase
      .from("quiz_words")
      .select("word_id, correct, words(word)")
      .eq("user_id", context.userId);

    const counts = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    for (const w of words ?? []) counts[w.status as keyof typeof counts]++;

    const wordsOverTime: { date: string; count: number }[] = [];
    if (words) {
      const byDate = new Map<string, number>();
      for (const w of words) {
        const d = w.created_at.slice(0, 10);
        byDate.set(d, (byDate.get(d) ?? 0) + 1);
      }
      const sorted = [...byDate.entries()].sort();
      let cum = 0;
      for (const [d, c] of sorted) {
        cum += c;
        wordsOverTime.push({ date: d, count: cum });
      }
    }

    const quizAccuracyTrend =
      quizzes?.map((q) => ({
        date: q.created_at.slice(0, 10),
        accuracy: q.total_questions
          ? Math.round((q.score / q.total_questions) * 100)
          : 0,
      })) ?? [];

    const totalScore = quizzes?.reduce((a, q) => a + q.score, 0) ?? 0;
    const totalQ = quizzes?.reduce((a, q) => a + q.total_questions, 0) ?? 0;
    const quizAccuracy = totalQ ? Math.round((totalScore / totalQ) * 100) : 0;

    const missMap = new Map<string, { word: string; misses: number }>();
    for (const r of qw ?? []) {
      if (r.correct) continue;
      const w = (r.words as { word: string } | null)?.word;
      if (!w) continue;
      const cur = missMap.get(r.word_id) ?? { word: w, misses: 0 };
      cur.misses += 1;
      missMap.set(r.word_id, cur);
    }
    const mostMissed = [...missMap.values()]
      .sort((a, b) => b.misses - a.misses)
      .slice(0, 5);

    return {
      totalWords: words?.length ?? 0,
      mastered: counts.mastered,
      learning: counts.learning,
      reviewing: counts.reviewing,
      new: counts.new,
      quizAccuracy,
      quizAccuracyTrend,
      wordsOverTime,
      mostMissed,
    };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, daily_goal, theme")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { display_name?: string; daily_goal?: number; theme?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw error;
    return row;
  });
