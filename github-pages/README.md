# Contextuary: GitHub Pages edition

This folder is a static copy of the Contextuary app that can be hosted for free on
**GitHub Pages**. The Lovable project in the repo root is unchanged and keeps working.

## How it differs from the Lovable version

| Lovable version (repo root)                | GitHub Pages version (this folder)                          |
| ------------------------------------------ | ----------------------------------------------------------- |
| TanStack Start server functions            | Browser talks to Supabase directly (row-level security)     |
| AI via Lovable AI gateway                  | AI via the `ai` Supabase Edge Function and **your own key** |
| Admin seed review via server function      | `admin` Supabase Edge Function                              |
| Google sign-in via Lovable Cloud Auth      | Supabase Auth: Google, plus an email magic link             |
| Pronunciation via Lovable's paid TTS       | The browser's built-in speech (free)                        |

The pages, components, quiz engine and database schema are the same.

## One-time setup

### 1. Create a Supabase project

A Lovable Cloud backend can't be configured from outside Lovable, so use your own
(free) project at [supabase.com](https://supabase.com).

Then push the database schema and the two Edge Functions (`ai`, `admin`). Pick whichever
of these two ways you're comfortable with — both end up in the same place.

<details>
<summary><strong>Option A — Dashboard only, no terminal</strong> (click to expand)</summary>

**Tables:** open your project → **SQL Editor** → **New query**. Copy the whole contents of
[`supabase/migrations/`](../supabase/migrations) — all 7 `.sql` files, in filename order (they're
timestamped, so oldest first) — paste them one after another into the same query, then click
**Run**. This creates every table, function and permission the app needs.

**Edge Functions:** open **Edge Functions** in the sidebar → **Deploy a new function**.
- Name it exactly `ai`, paste the full contents of
  [`supabase/functions/ai/index.ts`](../supabase/functions/ai/index.ts), and deploy.
- Repeat for a function named exactly `admin`, pasting
  [`supabase/functions/admin/index.ts`](../supabase/functions/admin/index.ts).

Both files are self-contained (no other files to add) so one paste each is enough.

**Secrets:** still in **Edge Functions**, open **Secrets** (or **Manage secrets**) and add the
three keys from [step 2](#2-add-your-ai-key) below, one at a time.

</details>

<details>
<summary><strong>Option B — Supabase CLI</strong> (click to expand)</summary>

From the **repo root**:

```sh
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push                      # creates the tables from supabase/migrations
npx supabase functions deploy             # deploys supabase/functions (ai, admin)
```

</details>

### 2. Add your AI key

The `ai` function works with any OpenAI-compatible API. For example, with Google Gemini
(the model the Lovable version used; get a key at https://aistudio.google.com/apikey):

| Secret name   | Value                                                          |
| ------------- | --------------------------------------------------------------- |
| `AI_API_KEY`  | your provider key                                                |
| `AI_MODEL`    | `gemini-2.5-flash`                                               |
| `AI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai`       |

Using the CLI instead of the Dashboard:

```sh
npx supabase secrets set \
  AI_API_KEY=your-key \
  AI_MODEL=gemini-2.5-flash \
  AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

For OpenAI, leave out `AI_BASE_URL` and set `AI_MODEL` to a model such as `gpt-4.1-mini`.
The key stays on Supabase and is never sent to the browser.

### 3. Configure sign-in

In the Supabase dashboard, open **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-GITHUB-USERNAME.github.io/contextuary-sparkle/`
- **Redirect URLs:** add `https://YOUR-GITHUB-USERNAME.github.io/contextuary-sparkle/auth`
  and `http://localhost:5173/auth`

Email magic links work straight away. For **Continue with Google**, enable
**Authentication → Providers → Google** and follow Supabase's guide to create a Google
OAuth client.

### 4. Bring over your data (optional)

The Daily Picks word bank (`sat_words`) lives in your Lovable Cloud database. Export
that table as CSV from Lovable (Cloud → Database), then import it in the Supabase
dashboard (Table Editor → `sat_words` → Import). Do the same for any other tables you
want to keep.

To use the admin seed-review page, make your account an admin in the SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com';
```

### 5. Turn on GitHub Pages

1. In the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and
   choose **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions → Variables** and add:
   - `VITE_SUPABASE_URL`: `https://YOUR-PROJECT-REF.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable (anon) key

   Both values are public, so repository *variables* are fine.
3. Push to `main`, or run **Actions → Deploy to GitHub Pages → Run workflow**.

The site is published at `https://YOUR-GITHUB-USERNAME.github.io/contextuary-sparkle/`.

### 6. Images

`public/logo.png` (logo and favicon) and `public/signin-bg.jpg` (sign-in background)
are served from the site's base path. Replace them to change the artwork, or update
`src/lib/assets.ts` if you rename them.

## Local development

```sh
cd github-pages
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:5173
```

`npm run build` writes the site to `dist/`. It also copies `index.html` to `404.html` so
deep links like `/words` load on GitHub Pages.
