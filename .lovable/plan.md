
# Contextuary marketing landing page

Build a public landing page at `/` that matches the attached mockup, and route signed-in users straight to the app.

## Routing

- Replace `src/routes/index.tsx` (currently redirects `/` → `/words`) with a real landing page component.
  - In `beforeLoad`, check the Supabase session. If signed in, `redirect({ to: "/words" })`. Otherwise render the landing page.
- Landing page CTAs ("Log in", "Sign up", "Get started for free", "Explore the dashboard", "Try a sample quiz") link to `/auth`.
- Add unique `head()` metadata (title, description, og:title, og:description, og:type=website, canonical, og:url) — no `og:image` unless we generate one.

## Page structure (top to bottom)

1. **Sticky nav bar** — Contextuary wordmark + sparkle icon, anchor links (Features, How it works, Pricing, About) that scroll to sections, "Log in" ghost button, "Sign up" primary button. Translucent white with subtle border on scroll.
2. **Hero** — two-column on desktop, stacked on mobile.
   - Left: headline "Understand words. In context. For real." with the middle line "In context." in `text-primary` italic serif accent; subcopy; input styled like `Paste any SAT passage or try a word…` with a violet sparkle submit button (non-functional, routes to `/auth` on submit); example word chips (Ubiquitous, Mitigate, Salient, Arbitrary); social-proof row with 3 stacked avatar circles + "Loved by 3,000+ ambitious learners".
   - Right: two overlapping floating cards — a passage card with the word "ubiquitous" highlighted, and a detailed word card (word, IPA, speaker icon, Mastered badge, Vietnamese meaning, SAT Context block, Example, "Save to library" button, star). Soft shadow, subtle float animation, decorative sparkles + orbit lines behind.
3. **How Contextuary works** — 4-step row with numbered circles, lucide icons (FileText, Sparkles, BookOpen, Target), title + one-line description each. Connector line between steps on desktop.
4. **See Contextuary in action** — split card: left copy + curved arrow; right sentence card with the word "arbitrary" bolded/highlighted; on hover, a definition popover card appears (meaning, "NOT" simpler synonym `random`, Example, Memory hint). Implemented with Framer Motion for the hover reveal.
5. **All your words. All in one place.** — split section: left copy + "Explore the dashboard" CTA; right condensed static preview of the My Words dashboard (dark purple sidebar w/ Contextuary logo + nav + "Overview This Week" mini card, lavender content area with search + Add Word + table of 4 sample rows with status + tag pills). Hover: scale 1.02 + subtle tilt.
6. **Practice smarter, not harder.** — split section: left copy + "Try a sample quiz" CTA; right quiz question card ("What does mitigate mean?" with 4 lettered options, C selected/correct) + smaller "Correct!" feedback card overlapping.
7. **Track your progress** — 4 stat cards (Words Learned 642, Mastered 391, Quiz Accuracy 86%, Learning Streak 42) each with icon, big number with count-up animation on scroll (react-intersection-observer-less via IntersectionObserver + rAF), delta line, and inline SVG sparkline (unique color per card using chart tokens).
8. **Testimonial** — single centered quote with author, arrow buttons + dot pagination cycling through 3 hardcoded testimonials.
9. **Dark footer** — deep navy/purple bg (reuse `--sidebar` token), left column with heading "Ready to transform your vocabulary?" + "Get started for free" button; right columns: Product, Resources, Company link groups + Contextuary brand column with tagline and social icons (Twitter, Instagram, YouTube, message); bottom copyright line.

## Design system

- Reuse existing tokens from `src/styles.css` (primary violet, lavender background, sidebar deep purple, status pills). No new color additions needed.
- Serif accent for "In context." — load Instrument Serif via `<link>` in `src/routes/__root.tsx` and add `--font-serif` token in `@theme`; apply with a utility class only on the hero accent.
- All spacing, radii, shadows via existing tokens.

## Animations (Framer Motion, already installed if not add via `bun add framer-motion`)

- Section-level `whileInView` fade + slide-up (y: 24 → 0, opacity 0 → 1, duration 0.5, once: true, 15% viewport).
- Hero floating cards: infinite `y: [0, -8, 0]` over 6s, staggered.
- Background: absolutely-positioned sparkle SVGs + faint drifting SAT words with slow `x`/`y` loops and low opacity.
- Card/button hover: `scale: 1.02`, shadow lift, 200ms.
- Dashboard preview: `whileHover={{ scale: 1.02, rotate: -0.5 }}`.
- Stat count-up: IntersectionObserver triggers a rAF tween from 0 to target over 1.2s ease-out.
- Global CSS: `transition-duration: 200ms` default for interactive elements.
- Respect `prefers-reduced-motion` — disable loops and count-up when set.

## New files

- `src/components/landing/nav-bar.tsx`
- `src/components/landing/hero.tsx`
- `src/components/landing/how-it-works.tsx`
- `src/components/landing/in-action.tsx`
- `src/components/landing/dashboard-preview.tsx`
- `src/components/landing/quiz-preview.tsx`
- `src/components/landing/stats.tsx` (with `CountUp` and `Sparkline` sub-components)
- `src/components/landing/testimonials.tsx`
- `src/components/landing/footer.tsx`
- `src/components/landing/decorations.tsx` (sparkles + drifting words)

## Edited files

- `src/routes/index.tsx` — becomes the landing page + auth-aware redirect + head metadata.
- `src/routes/__root.tsx` — add Instrument Serif `<link>`.
- `src/styles.css` — add `--font-serif` in `@theme inline`.

## Out of scope

- No changes to `/auth`, `_authenticated/*`, AI functions, or DB schema.
- Nav links (Features, How it works, Pricing, About) scroll to on-page sections; no separate `/pricing` or `/about` routes.
