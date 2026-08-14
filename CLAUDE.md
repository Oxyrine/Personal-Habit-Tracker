# Habit Tracker

A personal habit tracker with a 365-day contribution heatmap, per-habit streak
tracking, and daily check-off. React SPA frontend + Flask JSON API backend,
cinematic dark editorial design ("Habits" hero, video backgrounds, scroll reveals).

- **Live**: https://habit-tracker-six-kappa-49.vercel.app
- **Repo**: https://github.com/Oxyrine/Personal-Habit-Tracker (branch `main`, auto-deploys via GitHub → Vercel)

## Architecture (major change, 2026-08-10/11)

The app was originally server-rendered Flask/Jinja, then had a separate unwired
`signup-ui/` React prototype. Both are gone now — `signup-ui/` was merged into the
repo root and the whole frontend became a React SPA. **`app.py` is now a pure JSON
API** (`/api/*` routes only, no template rendering). This rewrite happened in a
session this assistant wasn't part of (commits `21a534c`..`2b17d47`); if something
here seems to contradict older assumptions, trust the code over memory.

- **Backend**: Flask + Flask-SQLAlchemy (`app.py`), one file. Routes:
  `/api/auth/status`, `/api/login`, `/api/signup`, `/api/logout`, `/api/habits`
  (GET/POST), `/api/habits/<id>/delete`, `/api/habits/<id>/rename`, `/api/toggle`. Auth is plain email/password
  via `werkzeug.security` — no Google OAuth (deliberately dropped earlier, don't
  reintroduce without being asked).
- **Frontend**: React 19 + Vite + Tailwind v4 + `react-router-dom` v7 + `motion`
  (motion/react) + `lucide-react`, at the repo root (`src/`, `index.html`,
  `package.json` — note: `package.json` `name` is still `signup-ui`, a leftover from
  before the merge, harmless but stale).
  - `src/App.tsx` — router shell, checks `/api/auth/status` on mount
  - `src/pages/Landing.tsx` — marketing page: hero (video bg), about, features
  - `src/pages/Login.tsx` / `Signup.tsx` — auth forms, call the JSON API directly
  - `src/pages/Dashboard.tsx` — logged-in habit list + per-habit detail view
  - `src/pages/NotFound.tsx` — catch-all `*` route, on-brand 404
  - `src/components/Heatmap.tsx` — 365-day grid, `bg-primary` for done days
- **DB**: SQLite locally (`habits.db`, gitignored); Postgres via Neon in production
  (`DATABASE_URL`). No code change needed to switch.
- **Deploy**: `vercel.json` explicitly builds both `package.json` (static Vite build
  → `dist/`) and `api/index.py` (Python, re-exports `app.py`'s `app`), with `/api/*`
  routed to Python and everything else to `dist/index.html`.

## Design system

Dark cinematic editorial: `#0a0a0a` background (not pure black — see below), cream
accent `#DEDBC8` (`--color-primary`), Almarai sans + Instrument Serif italic serif
for emphasis words, noise-texture overlays, scroll-triggered reveals via `motion`.
Tokens in `src/index.css` `@theme`. Tailwind v4's default `black` and `gray-400/500/600`
are overridden at the theme level (not per-class) so the whole app gets an off-black
background and warm-tinted grays instead of Tailwind's cool blue-grays — any new
component using `bg-black`/`text-gray-500` etc. automatically matches, no need to
reach for arbitrary hex values.

Ran a redesign-skill audit (2026-08-12) and fixed: dead `href="#"` links (nav now
scrolls to real `#top`/`#about`/`#features` anchors, "Learn more" CTAs go to
`/signup`), cheap `(01)/(02)/(03)` meta-labels on feature cards (removed),
`h-screen`/`min-h-screen` → `dvh` (iOS Safari viewport-jump bug), missing
`active:scale` press feedback on primary buttons, a global `:focus-visible` ring,
meaningless `alt="Icon"` text, client-side password `minLength` to match the
server's 8-char rule, and a leftover "Prisma — Creative Studio" template title in
`index.html`. Not fixed (out of scope / bigger risk than value): swapping
`lucide-react` for a less-common icon set, adding a footer/legal links page.

A `NotFound.tsx` later appeared (added outside this assistant's session, same as
the SPA rewrite) but was an unedited template from a design-generation workflow —
"TinyTrails" placeholder branding, orange/white gradient, dead `href="#"` nav links
to pages that don't exist ("About Us", "Programs", "Reviews", "FAQ", "Contacts"),
generic "Oops!" copy, `h-screen`. The video asset itself is legitimate — same
`user_38xzZboKViGWJOttwIXH07lWA1P` CloudFront prefix as the Landing hero/feature
videos, so same asset library, not a random unrelated URL.
First pass kept the orange/gradient look distinct from the rest of the app (user
said "just the 404 page" when asked what to revert, meaning *scope* — only that
page, not the whole app's theme — not a statement about keeping the orange color).
User then explicitly asked to recolor it to match: background → black (`#0a0a0a`
via the theme override), `#F16524`/white accents → primary cream (`#DEDBC8`) and
`#E1E0CC` text throughout nav, mobile drawer, bottom CTA — layout/copy/structure
unchanged. Video blend mode changed `mix-blend-darken` → `mix-blend-lighten` since
darken against black would hide the video — a required consequence of the color
change, not scope creep. What got fixed along the way: branding → "Habits", nav
links → real destinations (Home/Sign In/Sign Up), copy → on-brand, `h-screen` →
`min-h-dvh`. Wired in as the `*` catch-all route in `App.tsx`.

## Known gaps / next steps

- No CSRF protection on forms (personal single-target app; revisit if that changes)
- No CSV export, no reminders, no password reset flow
- `package.json` `name` field still says `signup-ui` — cosmetic, harmless
- Video URLs in `Landing.tsx` point to a CloudFront asset host from the earlier
  design session — if those ever 404, the hero/feature cards need new sources

## Local dev

Needs both processes running (Vite proxies `/api` to Flask on 5000):

```bash
python app.py       # localhost:5000, SQLite, zero setup — the API
npm run dev          # localhost:5173 — the React app
python test_streaks.py
```

`.claude/launch.json` (repo-parent level) has both as named configs:
`habit-tracker` (Flask) and `habit-tracker-frontend` (Vite).
