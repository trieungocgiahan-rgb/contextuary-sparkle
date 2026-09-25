// AI Challenge generators, backed by the `ai` Supabase Edge Function.
import { invokeFunction } from "@/integrations/supabase/client";

export type PassageChallenge = {
  passage: string;
  questions: {
    word: string;
    prompt: string;
    options: string[];
    answer_index: number;
    explanation: string;
  }[];
};

export type SentenceEval = {
  verdict: "correct" | "awkward" | "wrong";
  feedback: string;
  fix: string;
};

export type MisuseChallenge = {
  word: string;
  sentences: string[];
  correct_index: number;
  explanation: string;
};

export async function generatePassage({ data }: { data: { wordIds: string[] } }) {
  if (!Array.isArray(data?.wordIds) || data.wordIds.length < 3)
    throw new Error("Need at least 3 words");
  return invokeFunction<PassageChallenge>("ai", {
    action: "passage",
    wordIds: data.wordIds.slice(0, 5),
  });
}

export async function evaluateSentence({ data }: { data: { word: string; sentence: string } }) {
  const word = String(data?.word ?? "").trim();
  const sentence = String(data?.sentence ?? "").trim();
  if (!word || !sentence || sentence.length > 400) throw new Error("Invalid input");
  return invokeFunction<SentenceEval>("ai", { action: "evaluate", word, sentence });
}

export async function generateMisusePair({ data }: { data: { word: string } }) {
  const word = String(data?.word ?? "").trim();
  if (!word) throw new Error("word required");
  return invokeFunction<MisuseChallenge>("ai", { action: "misuse", word });
}
