
# Contextuary — build plan

A full-stack SAT vocabulary app with per-user data, AI-generated word explanations in Vietnamese, quizzes, and stats. Built in one pass on TanStack Start + Lovable Cloud + Lovable AI (Gemini) + Google TTS.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create these tables via one migration (with GRANTs + RLS scoped to `auth.uid()`):

- `tags` — id, user_id, name, color, created_at
- `words` — id, user_id, word, ipa, vietnamese_meaning, nuance_note, examples (jsonb[]), collocations (text[]), synonyms (text[]), antonyms (text[]), memory_hint, status ('new'|'learning'|'reviewing'|'mastered'), tag_id (fk nullable), is_favorite, created_at, updated_at
- `quizzes` — id, user_id, created_at, score, total_questions, mode
- `quiz_words` — quiz_id, word_id, correct, question_type
- `profiles` — id (fk auth.users), display_name, daily_goal, theme, created_at (auto-created via trigger on signup)

Seed ~10 default tags per new user via the signup trigger (Society, Environment, Psychology, Justice, Science, Abstract, Emotion, Academic, General, Nature) each with a color.

## 2. Auth

- Enable Email/password + Google via `configure_social_auth`.
- Auth page at `/auth` (public) with tabs: Sign in / Sign up + "Continue with Google" (via `lovable.auth.signInWithOAuth`).
- All app routes live under `src/routes/_authenticated/` using the managed layout.
- Session listener in `__root.tsx`.

## 3. AI (Lovable AI Gateway, Gemini)

Server functions under `src/lib/ai.functions.ts`:

- `generateWordDetails({ word })` — Gemini structured output → { ipa, vietnamese_meaning, nuance_note, examples[3], collocations[], synonyms[], antonyms[], memory_hint, suggested_tag }. User reviews in a modal before save.
- `generateQuiz({ wordIds, mode })` — builds multiple-choice or fill-in-the-blank questions from selected words.
- Server route `src/routes/api/tts.ts` — streams Gemini TTS audio (SSE→PCM) for the speaker button.

## 4. Routes / UI

Three-column layout in `_authenticated/route.tsx` (sidebar + main + slide-in drawer).

- `_authenticated/index.tsx` → **My Words** (redirect / → /words)
  - Sidebar: Contextuary logo, tagline, nav (My Words / Quiz / Statistics / Tags / Settings), "Overview This Week" card (totals, mastered/learning/new bars, quiz accuracy + sparkline), rotating quote card.
  - Main: title, search input + sparkle button + `+ Add Word`, data table (checkbox, Word, Vietnamese Meaning, Example with inline highlighted word, Status pill, Tag pill, ⋮ menu), sticky bottom "Generate Quiz" bar for selected words.
  - Right drawer (Sheet, opens on row click; bottom-sheet on mobile): word + speaker + favorite star, IPA, editable status, Contextual Vietnamese Meaning card, Examples list, Collocations chips, Synonyms, Antonyms, Memory Hint, Edit / ⋯ / close.
- `_authenticated/quiz.tsx` — filter (all / by tag / by status), start quiz, per-question screen, results screen updating word status + writing `quizzes` + `quiz_words`.
- `_authenticated/statistics.tsx` — Recharts: words over time, mastery breakdown, quiz accuracy trend, most-missed words list.
- `_authenticated/tags.tsx` — CRUD tags with color picker, count per tag.
- `_authenticated/settings.tsx` — display name, daily goal, theme toggle, change password, log out, delete account.
- `/auth` — public sign-in/up.

## 5. Design system

Update `src/styles.css` tokens:
- Primary deep purple (~oklch violet 600), primary-glow lighter violet, lavender background (`--background` ~ #F5F3FF), white cards, rounded-xl radius, soft shadows.
- Status colors: mastered (green), reviewing (amber), learning (blue), new (gray) as semantic tokens with matching foreground/background pairs.
- Tag palette: 10 named category colors as CSS vars.
- Inter font via `<link>` in `__root.tsx`.
- Sidebar dark-purple theme via `--sidebar-*` tokens.
- Update `head()` per route with unique title/description/og.

## 6. Technical notes

- Data reads: TanStack Query with `queryOptions` + `useSuspenseQuery`; loaders in `_authenticated/*` prime cache via `ensureQueryData` calling authenticated server fns (`requireSupabaseAuth`).
- Mutations: `useMutation` → server fn → invalidate keys.
- Ownership: `user_id = context.userId` in every insert; never trust client.
- Google OAuth via Lovable broker; `redirect_uri = window.location.origin`.
- TTS: server route proxies Gemini `google/gemini-2.5-flash-tts` SSE→PCM; small client hook plays via WebAudio.
- Add `attachSupabaseAuth` middleware in `src/start.ts`.
- Replace placeholder `src/routes/index.tsx` with redirect to `/words` (or `/auth` if signed out — handled via `_authenticated` gate).

## 7. Deliverables per phase (single pass)

1. Enable Cloud + schema migration + auth config.
2. Design tokens + shell layout + sidebar.
3. Auth page + Google sign-in.
4. Words CRUD + AI Add Word flow + drawer.
5. TTS route + speaker button.
6. Quiz flow + status auto-progression.
7. Statistics + Tags + Settings pages.
8. Head metadata + polish + smoke test via Playwright.
