// AI features for the GitHub Pages build (github-pages/). Ports the prompts from the
// Lovable app's ai.functions.ts / ai-challenge.functions.ts.
//
// Works with any OpenAI-compatible chat API. Set these secrets
// (`supabase secrets set NAME=value`):
//   AI_API_KEY   your provider key (required)
//   AI_MODEL     model id, e.g. gemini-2.5-flash or gpt-4.1-mini (required)
//   AI_BASE_URL  defaults to https://api.openai.com/v1
//                Gemini: https://generativelanguage.googleapis.com/v1beta/openai
//                OpenRouter: https://openrouter.ai/api/v1
import { z } from "npm:zod@3";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError, json, requireUser, serve } from "../_shared/http.ts";

// ---------- Provider ----------

async function generateObject<T>(schema: z.ZodType<T>, prompt: string, shape: string): Promise<T> {
  const apiKey = Deno.env.get("AI_API_KEY");
  const model = Deno.env.get("AI_MODEL");
  const baseUrl = (Deno.env.get("AI_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
  if (!apiKey || !model) {
    throw new HttpError(500, "AI is not configured: set the AI_API_KEY and AI_MODEL secrets");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Reply with a single JSON object and nothing else. It must have this shape:\n${shape}`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    console.error(`AI provider error ${res.status}: ${await res.text()}`);
    if (res.status === 401 || res.status === 403) {
      throw new HttpError(502, "The AI provider rejected the API key");
    }
    if (res.status === 429) throw new HttpError(429, "AI rate limit reached. Try again shortly.");
    throw new HttpError(502, "AI request failed. Please try again.");
  }

  const payload = await res.json();
  const text: string = payload?.choices?.[0]?.message?.content ?? "";
  try {
    // Some providers wrap JSON in ```json fences even in JSON mode.
    const cleaned = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    return schema.parse(JSON.parse(cleaned));
  } catch (e) {
    console.error("AI returned unexpected output", e, text);
    throw new HttpError(502, "AI generation failed. Please try again.");
  }
}

// ---------- Cache (per user, 24h) ----------

async function cacheGet(supabase: SupabaseClient, userId: string, key: string) {
  const { data } = await supabase
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

async function cachePut(supabase: SupabaseClient, userId: string, key: string, payload: unknown) {
  await supabase
    .from("ai_challenge_cache")
    .upsert(
      { user_id: userId, cache_key: key, payload, created_at: new Date().toISOString() },
      { onConflict: "user_id,cache_key" },
    );
}

// ---------- Word details ----------

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

async function wordDetails(body: Record<string, unknown>) {
  const word = String(body.word ?? "")
    .trim()
    .toLowerCase();
  if (!word || word.length > 60) throw new HttpError(400, "Invalid word");

  const prompt = `You are a bilingual English–Vietnamese SAT vocabulary tutor.
For the SAT word: "${word}"

Return concise, high-quality content for a Vietnamese learner:
- ipa: British/General American IPA in slashes, e.g. /juːˈbɪkwɪtəs/
- vietnamese_meaning: 1 short line, the core Vietnamese meaning
- nuance_note: 2–4 short Vietnamese sentences explaining nuance and when to use it vs simpler synonyms
- examples: exactly 3 SAT-style English example sentences that each use the exact word "${word}" (or a natural inflection)
- collocations: 3–5 short English phrase pairings
- synonyms: 3–5 English words
- antonyms: 2–4 English words
- memory_hint: one short mnemonic in English or English+Vietnamese
- suggested_tag: one of Society, Environment, Psychology, Justice, Science, Abstract, Emotion, Academic, General, Nature`;

  return generateObject(
    WordDetailsSchema,
    prompt,
    `{"ipa": string, "vietnamese_meaning": string, "nuance_note": string, "examples": string[], "collocations": string[], "synonyms": string[], "antonyms": string[], "memory_hint": string, "suggested_tag": string}`,
  );
}

// ---------- Passage in context ----------

const PassageSchema = z.object({
  passage: z.string(),
  questions: z.array(
    z.object({
      word: z.string(),
      prompt: z.string(),
      options: z.array(z.string()).length(4),
      answer_index: z.number().int().min(0).max(3),
      explanation: z.string(),
    }),
  ),
});

async function passage(supabase: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const ids = Array.isArray(body.wordIds) ? body.wordIds.map(String).slice(0, 5) : [];
  if (ids.length < 3) throw new HttpError(400, "Need at least 3 words");

  const { data: rows } = await supabase
    .from("words")
    .select("word, vietnamese_meaning")
    .in("id", ids)
    .eq("user_id", userId);
  const words = (rows ?? []).map((r: { word: string }) => r.word);
  if (words.length < 3) throw new HttpError(404, "Words not found");

  const key = `passage:${words.slice().sort().join(",")}`;
  const hit = await cacheGet(supabase, userId, key);
  if (hit) return hit;

  const prompt = `You are an SAT prep tutor. Write a short SAT-style paragraph (4-6 sentences)
that naturally uses these words: ${words.join(", ")}.
Then produce ONE comprehension question per word about how it functions in the passage.
Each question has 4 options and one correct answer with a short explanation.`;

  const output = await generateObject(
    PassageSchema,
    prompt,
    `{"passage": string, "questions": [{"word": string, "prompt": string, "options": [string, string, string, string], "answer_index": 0-3, "explanation": string}]}`,
  );
  await cachePut(supabase, userId, key, output);
  return output;
}

// ---------- Evaluate user sentence ----------

const EvalSchema = z.object({
  verdict: z.enum(["correct", "awkward", "wrong"]),
  feedback: z.string(),
  fix: z.string(),
});

async function evaluate(body: Record<string, unknown>) {
  const word = String(body.word ?? "").trim();
  const sentence = String(body.sentence ?? "").trim();
  if (!word || !sentence || sentence.length > 400) throw new HttpError(400, "Invalid input");

  const prompt = `A student wrote this sentence to practice the SAT word "${word}":
"""${sentence}"""

Evaluate whether the usage is correct AND natural.
- verdict: "correct" (natural + accurate), "awkward" (understandable but off), or "wrong" (incorrect usage/collocation).
- feedback: 1-2 sentences explaining what works or what doesn't and WHY (register, collocation, connotation).
- fix: a revised sentence that keeps the student's intent but uses the word correctly. If already perfect, echo the sentence.`;

  return generateObject(
    EvalSchema,
    prompt,
    `{"verdict": "correct" | "awkward" | "wrong", "feedback": string, "fix": string}`,
  );
}

// ---------- Spot the misuse ----------

const MisuseSchema = z.object({
  word: z.string(),
  sentences: z.array(z.string()).length(2),
  correct_index: z.number().int().min(0).max(1),
  explanation: z.string(),
});

async function misuse(supabase: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const word = String(body.word ?? "").trim();
  if (!word || word.length > 60) throw new HttpError(400, "word required");

  const key = `misuse:${word}`;
  const hit = await cacheGet(supabase, userId, key);
  if (hit) return hit;

  const prompt = `Write two sentences using the SAT word "${word}".
One uses it correctly and naturally.
The other uses it SUBTLY WRONG: wrong register, wrong collocation, or wrong connotation.
Then explain the difference in 1-2 sentences.
Return correct_index = 0 or 1.`;

  const output = await generateObject(
    MisuseSchema,
    prompt,
    `{"word": string, "sentences": [string, string], "correct_index": 0 | 1, "explanation": string}`,
  );
  await cachePut(supabase, userId, key, output);
  return output;
}

// ---------- Router ----------

serve(async (req) => {
  // Every action spends paid AI quota, so require a signed-in user.
  const { supabase, userId } = await requireUser(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  switch (body.action) {
    case "word-details":
      return json(await wordDetails(body));
    case "passage":
      return json(await passage(supabase, userId, body));
    case "evaluate":
      return json(await evaluate(body));
    case "misuse":
      return json(await misuse(supabase, userId, body));
    default:
      throw new HttpError(400, "Unknown action");
  }
});
