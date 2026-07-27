import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

// -------- Passage in context --------
const PassageSchema = z.object({
  passage: z.string(),
  questions: z.array(z.object({
    word: z.string(),
    prompt: z.string(),
    options: z.array(z.string()).length(4),
    answer_index: z.number().int().min(0).max(3),
    explanation: z.string(),
  })),
});
export type PassageChallenge = z.infer<typeof PassageSchema>;

async function cacheGet(supabase: unknown, userId: string, key: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("ai_challenge_cache")
    .select("payload, created_at")
    .eq("user_id", userId)
    .eq("cache_key", key)
    .maybeSingle();
  if (!data) return null;
  const age = Date.now() - new Date(data.created_at).getTime();
  if (age > 24 * 60 * 60 * 1000) return null;
  return data.payload;
}
async function cachePut(supabase: unknown, userId: string, key: string, payload: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("ai_challenge_cache").upsert(
    { user_id: userId, cache_key: key, payload, created_at: new Date().toISOString() },
    { onConflict: "user_id,cache_key" },
  );
}

export const generatePassage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { wordIds: string[] }) => {
    if (!Array.isArray(input?.wordIds) || input.wordIds.length < 3)
      throw new Error("Need at least 3 words");
    return { wordIds: input.wordIds.slice(0, 5) };
  })
  .handler(async ({ data, context }): Promise<PassageChallenge> => {
    const { data: rows } = await context.supabase
      .from("words")
      .select("word, vietnamese_meaning")
      .in("id", data.wordIds)
      .eq("user_id", context.userId);
    const words = (rows ?? []).map((r) => r.word);
    if (words.length < 3) throw new Error("Words not found");

    const key = `passage:${words.slice().sort().join(",")}`;
    const hit = await cacheGet(context.supabase, context.userId, key);
    if (hit) return hit as PassageChallenge;

    const { createGateway, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createGateway();
    const prompt = `You are an SAT prep tutor. Write a short SAT-style paragraph (4-6 sentences)
that naturally uses these words: ${words.join(", ")}.
Then produce ONE comprehension question per word about how it functions in the passage.
Each question has 4 options and one correct answer with a short explanation.`;

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: PassageSchema }),
        prompt,
      });
      await cachePut(context.supabase, context.userId, key, output);
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        try { return PassageSchema.parse(JSON.parse(e.text ?? "{}")); } catch { /* fall */ }
      }
      throw new Error("AI failed to generate passage");
    }
  });

// -------- Evaluate user sentence --------
const EvalSchema = z.object({
  verdict: z.enum(["correct", "awkward", "wrong"]),
  feedback: z.string(),
  fix: z.string(),
});
export type SentenceEval = z.infer<typeof EvalSchema>;

export const evaluateSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { word: string; sentence: string }) => {
    const word = String(input?.word ?? "").trim();
    const sentence = String(input?.sentence ?? "").trim();
    if (!word || !sentence || sentence.length > 400) throw new Error("Invalid input");
    return { word, sentence };
  })
  .handler(async ({ data }): Promise<SentenceEval> => {
    const { createGateway, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createGateway();
    const prompt = `A student wrote this sentence to practice the SAT word "${data.word}":
"""${data.sentence}"""

Evaluate whether the usage is correct AND natural.
- verdict: "correct" (natural + accurate), "awkward" (understandable but off), or "wrong" (incorrect usage/collocation).
- feedback: 1-2 sentences explaining what works or what doesn't and WHY (register, collocation, connotation).
- fix: a revised sentence that keeps the student's intent but uses the word correctly. If already perfect, echo the sentence.`;

    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: EvalSchema }),
        prompt,
      });
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        try { return EvalSchema.parse(JSON.parse(e.text ?? "{}")); } catch { /* fall */ }
      }
      throw new Error("AI failed to evaluate");
    }
  });

// -------- Spot the misuse --------
const MisuseSchema = z.object({
  word: z.string(),
  sentences: z.array(z.string()).length(2),
  correct_index: z.number().int().min(0).max(1),
  explanation: z.string(),
});
export type MisuseChallenge = z.infer<typeof MisuseSchema>;

export const generateMisusePair = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { word: string }) => {
    const word = String(input?.word ?? "").trim();
    if (!word) throw new Error("word required");
    return { word };
  })
  .handler(async ({ data, context }): Promise<MisuseChallenge> => {
    const key = `misuse:${data.word}`;
    const hit = await cacheGet(context.supabase, context.userId, key);
    if (hit) return hit as MisuseChallenge;

    const { createGateway, CHAT_MODEL } = await import("./ai-gateway.server");
    const gateway = createGateway();
    const prompt = `Write two sentences using the SAT word "${data.word}".
One uses it correctly and naturally.
The other uses it SUBTLY WRONG: wrong register, wrong collocation, or wrong connotation.
Then explain the difference in 1-2 sentences.
Return correct_index = 0 or 1.`;
    try {
      const { output } = await generateText({
        model: gateway(CHAT_MODEL),
        output: Output.object({ schema: MisuseSchema }),
        prompt,
      });
      await cachePut(context.supabase, context.userId, key, output);
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        try { return MisuseSchema.parse(JSON.parse(e.text ?? "{}")); } catch { /* fall */ }
      }
      throw new Error("AI failed to generate");
    }
  });
