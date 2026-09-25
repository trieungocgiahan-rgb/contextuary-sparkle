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
(free) project at [supabase.com](https://supabase.com). Then, from the **repo root**, run:

```sh
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push                      # creates the tables from supabase/migrations
npx supabase functions deploy             # deploys supabase/functions (ai, admin)
```

### 2. Add your AI key

The `ai` function works with any OpenAI-compatible API. For example, with Google Gemini
(the model the Lovable version used; get a key at https://aistudio.google.com/apikey):

```sh
npx supabase secrets set \
  AI_API_KEY=your-key \
  AI_MODEL=gemini-2.5-flash \
  AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

For OpenAI, omit `AI_BASE_URL` and set `AI_MODEL` to a model such as `gpt-4.1-mini`.
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

### 6. Your images

The Lovable version's logo and sign-in background are stored on Lovable's servers.
Download them from your Lovable project and put them in `public/`:

- `public/logo.svg` is a placeholder logo. Replace it with your own, keeping the name,
  or update `src/lib/assets.ts` if you use a different name.
- `public/signin-bg.png` is the sign-in background. Until you add it, a soft gradient
  is shown.

## Local development

```sh
cd github-pages
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:5173
```

`npm run build` writes the site to `dist/`. It also copies `index.html` to `404.html` so
deep links like `/words` load on GitHub Pages.
