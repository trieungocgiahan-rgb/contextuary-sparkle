
# Contextuary Practice Rebuild

Big scope — laying it out before writing. Confirm and I'll ship it.

## 1. Schema changes (one migration)

- `sat_words`: add `part_of_speech text`, `synonyms text[] default '{}'`, `example_sentences text[] default '{}'`, `collocations text[] default '{}'`, `needs_review boolean default false`, `review_reason text`, `suggested_correction text`. Keep existing single `example_sentence` / `memory_hint` columns; new arrays are additive so the seeder can fill richer content without breaking the current UI.
- `words` (user library): add `part_of_speech text` (for distractor matching).
- New table `admin_seed_review` OR reuse `sat_words.needs_review` flag. Going with the flag on `sat_words` — simpler, one source of truth. `/admin/seed` reads `WHERE needs_review = true`.
- Add admin RPCs: `admin_flag_sat_word(id, reason, suggestion)`, `admin_resolve_sat_word(id, action, new_word)`.
- GRANTs + RLS as usual.

## 2. Validation

Server function `validateWord(word)` used by both manual add + seeder pipeline:
- Lookup against a dictionary API (Free Dictionary API `api.dictionaryapi.dev` — no key). If 404 → not a real word.
- If close-but-wrong (Levenshtein ≤ 2 to a known word from a small SAT wordlist we ship) → return `suggested_correction`.
- SAT-level check: reject a small hardcoded stoplist of ~200 basic words (love, happy, run, big, …) — deterministic, no AI.
- Manual-add UI: inline "Did you mean X?" with accept button; hard error for non-words; never call `generateWordDetails` unless validation passes.
- Seeder: instead of dropping, write row with `needs_review=true` + reason + suggestion. `/admin/seed` surfaces these; approving replaces the word and re-enriches.

## 3. Shared Word Picker (`src/components/practice-picker.tsx`)

Dialog opened from My Words ("Practice" button) and from sidebar. Fields:
- **Mode**: Practice / AI Challenge (segmented, AI badge on the right).
- **Type**: Quiz / Flashcards (Flashcards disabled under AI Challenge).
- **Which words**: Selected (only if My Words has selection) / Today's new / All / By status (New/Learning/Reviewing/Mastered multiselect) / Favorites only.
- **How many**: 10 / 20 / 50 / All (capped to 10 for AI Challenge, with note).
- **Question types** (Quiz only, hidden for Flashcards): six checkboxes a–f, all on by default.
- Start button → resolves word IDs → navigates to `/practice/quiz` or `/practice/flashcards` with session config in router state (or a `sessionStorage` key to survive reloads).

## 4. Standard Quiz (`src/routes/_authenticated/practice/quiz.tsx`)

- Pure client generator `src/lib/quiz-engine.ts`:
  - Input: selected `WordRow[]`, library pool for distractors, `sat_words` fallback pool (fetched once), enabled types, target count.
  - For each word, enumerate all possible questions across enabled types (skip types where content missing — no synonyms → no type e; no examples → no type c; etc.).
  - Shuffle, take `count` (or all).
  - Distractors: same-tag first, then rest of library, then `sat_words`. Filter out any option in the target's `synonyms`. For c/d also filter by matching `part_of_speech`.
- HUD: exit, "Q x of N", progress bar, count-up timer (respects `profiles.show_timer`).
- Feedback panel: correct/wrong, filled-in sentence, VN meaning, memory hint, speaker button (sentence).
- Prev/Next; end screen with single score, time, per-type breakdown, missed-word list linking into `word-details-drawer`, status-change summary, three action buttons.
- Status progression via updated `saveQuizResult`: one step forward per correct, one back per wrong, floor at "new". Aggregate per-word: majority correct → forward.

## 5. Flashcards (`src/routes/_authenticated/practice/flashcards.tsx`)

- Full-screen. Deck = array; "Chưa nhớ" pushes to end, "Đã nhớ" retires. Progress = retired/total.
- Flip animation on click; keyboard: space/arrows/1/2.
- End screen: known/unknown, "Practice unknown again" restarts with unknown set. No status writes.

## 6. Audio (`src/lib/speech.ts`)

Thin `speechSynthesis` wrapper: picks first en-US voice, `speak(text)`, `cancel()`. Speaker button component. Autoplay on question type f. Retire `src/routes/api/tts.ts` and `src/lib/tts.ts` from practice paths (leave file until unused).

## 7. AI Challenge (`src/routes/_authenticated/practice/ai.tsx`)

Three exercise types, mixed to session cap 10:
- **Passage in context**: server fn `generatePassage({wordIds})` → paragraph + comprehension MCQs. Cache 24h in `ai_challenge_cache` table keyed by sorted-wordIds hash + type.
- **Write your own sentence**: user textarea → server fn `evaluateSentence({word, sentence})` returns `{verdict, feedback, fix}`.
- **Spot the misuse**: server fn `generateMisusePair({word})` returns two sentences + which is correct + explanation.

All server fns use existing `createGateway()` with a Gemini model. Loading skeletons. AI badge visible. Cap enforced client + server.

## 8. Settings

Add "Show timer during quizzes" toggle → `profiles.show_timer boolean default true`.

## 9. Admin `/admin/seed`

New route (gated by an `is_admin` check on `user_roles`, or just hidden from nav — user already runs as sole user). Table of `needs_review` rows: original word, reason, suggestion, actions (Approve suggestion / Edit / Delete). Uses `admin_resolve_sat_word` RPC.

## 10. Files

**New**
- `src/components/practice-picker.tsx`
- `src/components/speaker-button.tsx`
- `src/lib/speech.ts`
- `src/lib/quiz-engine.ts`
- `src/lib/validation.ts` + `src/lib/validation.functions.ts`
- `src/lib/ai-challenge.functions.ts`
- `src/routes/_authenticated/practice/quiz.tsx`
- `src/routes/_authenticated/practice/flashcards.tsx`
- `src/routes/_authenticated/practice/ai.tsx`
- `src/routes/_authenticated/admin/seed.tsx`

**Edited**
- `src/lib/vocab.functions.ts` — new status progression rule + validation gate on create
- `src/routes/_authenticated/words.tsx` — checkbox column, Practice button opening picker, inline "Did you mean?"
- `src/routes/_authenticated/settings.tsx` — timer toggle
- `src/components/app-sidebar.tsx` — replace Quiz link with Practice → picker
- `src/routes/_authenticated/quiz.tsx` — delete (or redirect to `/practice/quiz`)

**Migration** — schema deltas above; seeder background job re-runs to fill new columns for existing rows.

## 11. Open questions

1. `part_of_speech` for existing user words: default null and skip the c/d POS filter when unknown, or backfill via a one-shot AI pass? I'll go with **skip filter when unknown** unless you say otherwise.
2. Admin gate for `/admin/seed`: add a `user_roles` table + `has_role()` RPC and hardcode you as admin by email on first login, or just leave it path-hidden? I'll add proper roles.
3. Existing seeder currently running — should I let it finish then re-enrich, or stop it and restart against the new schema? I'll **let it finish**, then run a follow-up pass to fill `part_of_speech` / `synonyms` / arrays and flag misspellings.

Reply "go" (or with tweaks) and I'll execute end-to-end.
