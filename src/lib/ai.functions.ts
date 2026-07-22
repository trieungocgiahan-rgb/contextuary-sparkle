import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const WordDetailsSchema = z.object({
  ipa: z.string(),
  vietnamese_meaning: z.string(),
  nuance_note: z.string(),
  examples: z.array(z.string()),
  collocations: z.array(z.string()),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()),
  memory_hint: z.string(),
  suggested_tag: z.string(),
});

export type WordDetails = z.infer<typeof WordDetailsSchema>;

export const generateWordDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { word: string }) => {
    const word = String(input?.word ?? "").trim().toLowerCase();
    if (!word || word.length > 60) throw new Error("Invalid word");
    return { word };
  })
  .handler(async ({ data }): Promise<WordDetails> => {
    const { createGateway, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createGateway();
    const model = gateway(CHAT_MODEL);

    const prompt = `You are a bilingual English–Vietnamese SAT vocabulary tutor.
For the SAT word: "${data.word}"

Return concise, high-quality content for a Vietnamese learner:
- ipa: British/General American IPA in slashes, e.g. /juːˈbɪkwɪtəs/
- vietnamese_meaning: 1 short line, the core Vietnamese meaning
- nuance_note: 2–4 short Vietnamese sentences explaining nuance and when to use it vs simpler synonyms
- examples: exactly 3 SAT-style English example sentences that each use the exact word "${data.word}" (or a natural inflection)
- collocations: 3–5 short English phrase pairings
- synonyms: 3–5 English words
- antonyms: 2–4 English words
- memory_hint: one short mnemonic in English or English+Vietnamese
- suggested_tag: one of Society, Environment, Psychology, Justice, Science, Abstract, Emotion, Academic, General, Nature`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: WordDetailsSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return WordDetailsSchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          throw new Error("AI generation failed. Please try again.");
        }
      }
      throw error;
    }
  });

const QuizQuestionSchema = z.object({
  word_id: z.string(),
  word: z.string(),
  type: z.enum(["meaning", "cloze"]),
  prompt: z.string(),
  options: z.array(z.string()),
  answer_index: z.number(),
});

const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { wordIds: string[] }) => {
    const ids = Array.isArray(input?.wordIds) ? input.wordIds.slice(0, 20) : [];
    if (!ids.length) throw new Error("Select at least one word");
    return { wordIds: ids };
  })
  .handler(async ({ data, context }): Promise<QuizQuestion[]> => {
    const { supabase, userId } = context;
    const { data: words, error } = await supabase
      .from("words")
      .select("id, word, vietnamese_meaning, examples")
      .eq("user_id", userId)
      .in("id", data.wordIds);
    if (error) throw error;
    if (!words || !words.length) throw new Error("No words found");

    // Build questions locally (no AI needed, deterministic and fast).
    const allMeanings = words
      .map((w) => w.vietnamese_meaning)
      .filter((m): m is string => !!m);

    const questions: QuizQuestion[] = [];
    for (const w of words) {
      if (!w.vietnamese_meaning) continue;
      // Multiple choice: pick Vietnamese meaning
      const distractors = shuffle(
        allMeanings.filter((m) => m !== w.vietnamese_meaning)
      ).slice(0, 3);
      const options = shuffle([w.vietnamese_meaning, ...distractors]);
      const answer_index = options.indexOf(w.vietnamese_meaning);
      questions.push({
        word_id: w.id,
        word: w.word,
        type: "meaning",
        prompt: `What is the Vietnamese meaning of "${w.word}"?`,
        options,
        answer_index,
      });

      // Cloze if we have an example
      const ex = Array.isArray(w.examples) ? (w.examples as string[])[0] : null;
      if (ex && typeof ex === "string") {
        const blanked = ex.replace(new RegExp(w.word, "gi"), "_____");
        const otherWords = shuffle(
          words.filter((x) => x.id !== w.id).map((x) => x.word)
        ).slice(0, 3);
        const clozeOpts = shuffle([w.word, ...otherWords]);
        questions.push({
          word_id: w.id,
          word: w.word,
          type: "cloze",
          prompt: blanked,
          options: clozeOpts,
          answer_index: clozeOpts.indexOf(w.word),
        });
      }
    }
    return shuffle(questions).slice(0, Math.min(20, questions.length));
  });

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
