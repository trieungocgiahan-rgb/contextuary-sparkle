
## 1. Shared SAT word bank

New table `public.sat_words` (public-readable, admin-writable):
- `word` (unique, lowercase), `pronunciation` (IPA), `vietnamese_meaning`, `example_sentence`, `memory_hint`, `frequency_rank` (unique, 1 = most common), timestamps.
- GRANT SELECT to `anon, authenticated`; ALL to `service_role`.
- RLS on; policy: anyone can SELECT; no INSERT/UPDATE/DELETE policy (only service_role writes via seeding function).

**Seeding (one-time, idempotent):**
- Curate a 1000-word SAT list (from a well-known public list, e.g. Manhattan/Barron high-frequency set) and commit as `scripts/sat-words-1000.json` (word + rank only).
- Add a protected server route `POST /api/public/seed-sat-words` guarded by `x-seed-secret` header matching a new `SAT_SEED_SECRET`. It:
  1. Reads the JSON list and inserts any missing `word/rank` rows (no AI content yet).
  2. Fetches up to N rows where `vietnamese_meaning IS NULL`, processes in batches of 20 through Gemini via the AI Gateway with a strict Zod schema (`{ ipa, vietnamese_meaning, example_sentence, memory_hint }[]`), and updates rows by word.
  3. Returns `{ seeded, enriched, remaining }` so we can call it repeatedly until `remaining=0`.
- Invoke it manually via curl after the migration runs; content generated once and stored — no AI at read time.

## 2. Daily progress + goal

New table `public.daily_progress`:
- `user_id`, `date` (date, user local — sent from client), `words_added` (int, default 0), unique `(user_id, date)`.
- RLS: user manages own rows. Standard grants.
- Bumped in the same server fn that saves a Daily Pick.

`profiles.daily_goal` already exists. Settings page (`_authenticated/settings.tsx`): replace the number input with a Select of 5/10/15/20 (default 10). Copy: "Applies from tomorrow." No retroactive change to today's counter row.

## 3. Server functions (`src/lib/daily-picks.functions.ts`)

- `listDailyPicks({ offset, limit=20, tzDate })`: returns SAT bank rows ordered by `frequency_rank ASC`, excluding words the user already has (`NOT EXISTS` join on `words.word` case-insensitive for this user), with `offset/limit`. Also returns `{ total, hasMore }`.
- `getDailyProgress({ tzDate })`: returns `{ words_added, daily_goal }`; upserts today's row lazily on read? No — read-only; a missing row means 0.
- `addDailyPick({ satWordId, tzDate })`: within a single call —
  - Load the SAT row.
  - Insert into `words` for `auth.uid()` with `status='new'`, copying `word, ipa=pronunciation, vietnamese_meaning, examples=[example_sentence], memory_hint`.
  - Upsert `daily_progress(user_id, tzDate)` incrementing `words_added`.
  - Return the new word id + updated counter.

## 4. UI: DailyPicksBar

New `src/components/daily-picks-bar.tsx`, placed on `_authenticated/words.tsx` between header and the search card.

- Container: white card, subtle border, rounded-2xl, light shadow.
- Header row: sparkle icon + "Daily Picks" + `${added} / ${goal} added today`; right side: gear icon + "Daily goal: N" → links to `/settings`.
- Chip row: horizontal scroll container, left/right circular arrow buttons that scroll the container by ~1 chip width; hidden native scrollbar.
- Chip: purple gradient `linear-gradient(135deg,#6D3FEC,#8B5CF6)`, white text, rounded-xl, fixed width (~180px), padding so nothing clips vertically. Contents: word (bold), IPA (small), footer row with `#${rank} Most common`/`#${rank}` + circular white "+" button on the right.
- Click chip body → open existing `WordDetailsDrawer` in read-only preview mode (reuse drawer; pass a synthetic `WordRow` shaped from the SAT row, disable Edit/Delete when it's not yet saved).
- Click "+" → optimistic: chip flashes green, framer-motion `AnimatePresence` exit (fade + slide-out), then `addDailyPick` mutation; on success invalidate `["words"]`, `["daily-picks"]`, `["daily-progress"]`; on error rollback.
- Infinite scroll: `useInfiniteQuery(["daily-picks", tzDate], listDailyPicks, getNextPageParam)`. IntersectionObserver on a right-edge sentinel triggers `fetchNextPage`. Loading shimmer chip while fetching.
- Empty/terminal state: when `pages` flattened is empty and no more pages → single-line "You've added every word 🎉".
- Timezone: compute `tzDate` on client as `new Date().toLocaleDateString('en-CA')` (YYYY-MM-DD in user's local tz) and pass to every daily-picks call.

## 5. Wiring

- Add queries in `src/lib/queries.ts`: `dailyProgressQueryOptions(tzDate)`, `dailyPicksInfiniteQueryOptions(tzDate)`.
- Words page: render `<DailyPicksBar />` above search block. No other changes.
- Settings: swap daily-goal input for a Select (5/10/15/20).

## Technical notes

- Exclusion in SQL: `SELECT s.* FROM sat_words s WHERE NOT EXISTS (SELECT 1 FROM words w WHERE w.user_id = auth.uid() AND lower(w.word) = s.word) ORDER BY s.frequency_rank OFFSET $1 LIMIT $2` — executed through `requireSupabaseAuth` server fn using `context.supabase.rpc('list_daily_picks', {...})` (define a SQL function to keep the NOT EXISTS clause simple and set-based), or a plain `.from('sat_words').select().not('word','in', <subquery>)` — RPC is cleaner, so add `public.list_daily_picks(_offset int, _limit int)`.
- Seeding function reuses `createGateway()` + `CHAT_MODEL` from `src/lib/ai-gateway.server.ts`; strict Zod validation; on batch failure, skip that batch and continue.
- All new public tables get GRANTs + RLS in the same migration.
- After migration approval: seed script curled from the sandbox in batches until `remaining=0`.
