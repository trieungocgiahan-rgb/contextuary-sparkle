// AI features run in the `ai` Supabase Edge Function (supabase/functions/ai), which
// holds your AI provider key. Same names and call shape as the Lovable server functions.
import { invokeFunction } from "@/integrations/supabase/client";

export type WordDetails = {
  ipa: string;
  vietnamese_meaning: string;
  nuance_note: string;
  examples: string[];
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
  memory_hint: string;
  suggested_tag: string;
};

export async function generateWordDetails({ data }: { data: { word: string } }) {
  const word = String(data?.word ?? "")
    .trim()
    .toLowerCase();
  if (!word || word.length > 60) throw new Error("Invalid word");
  return invokeFunction<WordDetails>("ai", { action: "word-details", word });
}
