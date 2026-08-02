import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SatWord = {
  id: string;
  word: string;
  pronunciation: string | null;
  vietnamese_meaning: string | null;
  example_sentence: string | null;
  memory_hint: string | null;
  frequency_rank: number;
};

export const listDailyPicks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { offset?: number; limit?: number }) => ({
    offset: Math.max(0, Number(input?.offset ?? 0)),
    limit: Math.min(50, Math.max(1, Number(input?.limit ?? 20))),
  }))
  .handler(async ({ data, context }): Promise<{ items: SatWord[]; hasMore: boolean }> => {
    const { data: rows, error } = await context.supabase.rpc("list_daily_picks", {
      _offset: data.offset,
      _limit: data.limit,
    });
    if (error) throw error;
    const items = (rows ?? []) as SatWord[];
    return { items, hasMore: items.length === data.limit };
  });

export const getDailyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { date: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.date ?? "")) throw new Error("Bad date");
    return { date: input.date };
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("daily_progress")
      .select("words_added")
      .eq("user_id", context.userId)
      .eq("date", data.date)
      .maybeSingle();
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("daily_goal")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      words_added: row?.words_added ?? 0,
      daily_goal: profile?.daily_goal ?? 10,
    };
  });

export type DailyPickDetails = {
  ipa?: string | null;
  vietnamese_meaning?: string | null;
  nuance_note?: string | null;
  examples?: string[];
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  memory_hint?: string | null;
  part_of_speech?: string | null;
  tag_id?: string | null;
};

export const addDailyPick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { satWordId: string; date: string; details?: DailyPickDetails }) => {
    if (!input?.satWordId) throw new Error("satWordId required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input?.date ?? "")) throw new Error("Bad date");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sat, error: sErr } = await supabase
      .from("sat_words")
      .select(
        "word, pronunciation, vietnamese_meaning, example_sentence, example_sentences, collocations, synonyms, memory_hint, part_of_speech",
      )
      .eq("id", data.satWordId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!sat) throw new Error("Word not found");

    const d = data.details ?? {};
    const satExamples =
      sat.example_sentences?.length
        ? sat.example_sentences
        : sat.example_sentence
          ? [sat.example_sentence]
          : [];

    const { data: inserted, error: iErr } = await supabase
      .from("words")
      .insert({
        user_id: userId,
        word: sat.word,
        ipa: d.ipa ?? sat.pronunciation,
        vietnamese_meaning: d.vietnamese_meaning ?? sat.vietnamese_meaning,
        nuance_note: d.nuance_note ?? null,
        examples: d.examples?.length ? d.examples : satExamples,
        collocations: d.collocations?.length ? d.collocations : (sat.collocations ?? []),
        synonyms: d.synonyms?.length ? d.synonyms : (sat.synonyms ?? []),
        antonyms: d.antonyms ?? [],
        memory_hint: d.memory_hint ?? sat.memory_hint,
        part_of_speech: d.part_of_speech ?? sat.part_of_speech ?? null,
        tag_id: d.tag_id ?? null,
        status: "new",
      })
      .select("id")
      .single();
    if (iErr) throw iErr;


    // Upsert daily counter
    const { data: existing } = await supabase
      .from("daily_progress")
      .select("id, words_added")
      .eq("user_id", userId)
      .eq("date", data.date)
      .maybeSingle();
    let words_added = 1;
    if (existing) {
      words_added = existing.words_added + 1;
      await supabase
        .from("daily_progress")
        .update({ words_added })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("daily_progress")
        .insert({ user_id: userId, date: data.date, words_added: 1 });
    }
    return { wordId: inserted.id, words_added };
  });
