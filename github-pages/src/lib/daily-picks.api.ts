// Browser-side replacements for the Lovable app's `daily-picks.functions.ts`.
import { supabase, requireUserId } from "@/integrations/supabase/client";

export type SatWord = {
  id: string;
  word: string;
  pronunciation: string | null;
  vietnamese_meaning: string | null;
  example_sentence: string | null;
  memory_hint: string | null;
  frequency_rank: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function listDailyPicks({
  data: input,
}: {
  data: { offset?: number; limit?: number };
}): Promise<{ items: SatWord[]; hasMore: boolean }> {
  const offset = Math.max(0, Number(input?.offset ?? 0));
  const limit = Math.min(50, Math.max(1, Number(input?.limit ?? 20)));
  const { data: rows, error } = await supabase.rpc("list_daily_picks", {
    _offset: offset,
    _limit: limit,
  });
  if (error) throw error;
  const items = (rows ?? []) as SatWord[];
  return { items, hasMore: items.length === limit };
}

export async function getDailyProgress({ data }: { data: { date: string } }) {
  if (!DATE_RE.test(data?.date ?? "")) throw new Error("Bad date");
  const userId = await requireUserId();
  const { data: row } = await supabase
    .from("daily_progress")
    .select("words_added")
    .eq("user_id", userId)
    .eq("date", data.date)
    .maybeSingle();
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal")
    .eq("id", userId)
    .maybeSingle();
  return {
    words_added: row?.words_added ?? 0,
    daily_goal: profile?.daily_goal ?? 10,
  };
}

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

export async function addDailyPick({
  data,
}: {
  data: { satWordId: string; date: string; details?: DailyPickDetails };
}) {
  if (!data?.satWordId) throw new Error("satWordId required");
  if (!DATE_RE.test(data?.date ?? "")) throw new Error("Bad date");
  const userId = await requireUserId();

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
  const satExamples = sat.example_sentences?.length
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
    await supabase.from("daily_progress").update({ words_added }).eq("id", existing.id);
  } else {
    await supabase
      .from("daily_progress")
      .insert({ user_id: userId, date: data.date, words_added: 1 });
  }
  return { wordId: inserted.id, words_added };
}
