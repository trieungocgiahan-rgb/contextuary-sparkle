import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BASIC_STOPLIST, levenshtein } from "./validation";

export type ValidationResult =
  | { ok: true; word: string; partOfSpeech?: string }
  | { ok: false; reason: "misspelled" | "not_a_word" | "too_basic"; suggestion?: string; message: string };

// Query dictionaryapi.dev to check whether a word exists. Also collect a POS if available.
async function lookupDictionary(word: string): Promise<{ found: boolean; pos?: string }> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { headers: { Accept: "application/json" } },
    );
    if (res.status === 404) return { found: false };
    if (!res.ok) return { found: true }; // network hiccup — don't reject the user
    const data = (await res.json()) as unknown;
    let pos: string | undefined;
    if (Array.isArray(data)) {
      for (const entry of data as Array<{ meanings?: Array<{ partOfSpeech?: string }> }>) {
        const m = entry?.meanings?.[0]?.partOfSpeech;
        if (m) { pos = m; break; }
      }
    }
    return { found: true, pos };
  } catch {
    return { found: true }; // network failure — permissive
  }
}

// Try to find a close suggestion using the sat_words bank.
async function suggestFromBank(
  supabase: { rpc: (...args: unknown[]) => unknown; from: (t: string) => unknown },
  word: string,
): Promise<string | undefined> {
  // Fetch a candidate window via prefix.
  const prefix = word.slice(0, 2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = await (supabase.from("sat_words") as any)
    .select("word")
    .ilike("word", `${prefix}%`)
    .limit(400);
  const rows: { word: string }[] = q?.data ?? [];
  let best: { w: string; d: number } | null = null;
  for (const r of rows) {
    const d = levenshtein(word, r.word);
    if (d === 0) return undefined;
    if (d <= 2 && (!best || d < best.d)) best = { w: r.word, d };
  }
  return best?.w;
}

export const validateWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { word: string }) => {
    const word = String(input?.word ?? "").trim().toLowerCase();
    if (!word || word.length > 60) throw new Error("Invalid word");
    if (!/^[a-z][a-z'-]*[a-z]?$/.test(word)) throw new Error("Only letters allowed");
    return { word };
  })
  .handler(async ({ data, context }): Promise<ValidationResult> => {
    const { word } = data;

    if (BASIC_STOPLIST.has(word)) {
      return {
        ok: false,
        reason: "too_basic",
        message: `"${word}" is common everyday vocabulary — not SAT-level.`,
      };
    }

    const dict = await lookupDictionary(word);
    if (!dict.found) {
      const suggestion = await suggestFromBank(context.supabase, word);
      if (suggestion) {
        return {
          ok: false,
          reason: "misspelled",
          suggestion,
          message: `"${word}" isn't in the dictionary. Did you mean "${suggestion}"?`,
        };
      }
      return {
        ok: false,
        reason: "not_a_word",
        message: `"${word}" doesn't appear to be a real English word.`,
      };
    }

    return { ok: true, word, partOfSpeech: dict.pos };
  });
