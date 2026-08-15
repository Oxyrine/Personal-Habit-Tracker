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

## Dashboard (2026-08-14/15)

Closed the gap between the cinematic landing page and the previously bare logged-in
app. `/dashboard/:habitId?` is now a real route (`useParams`, not local state) — the
selected habit survives refresh and the back button works. `App.tsx` actually uses
the `isAuthenticated` it fetches now: `RequireAuth`/`RequireGuest` wrappers gate
`/dashboard` and `/login`/`/signup` via `<Navigate>`, and `Login`/`Signup` navigate
client-side (`onAuthChange` prop calls back into `App` to refresh auth state) instead
of hard-reloading with `window.location.href`.

- **Heatmap** (`Heatmap.tsx`) cells are clickable — `onToggleDay` backfills any past
  day, disabled outside `[created_on, today]` since the backend 400s on those anyway.
  Days before `created_on` render visibly dimmer than missed days (a third state, not
  just binary done/not-done) so the grid doesn't lie about pre-habit history. Month
  labels and a legend row were added.
- **Overview** now shows a greeting (`user.name`, threaded through from
  `/api/auth/status`), today's progress ("N of M complete"), and a "streaks at risk"
  card (habits with `current > 0 && !done`) — clicking one toggles it directly.
- **Habit rename**: new `POST /api/habits/<id>/rename` endpoint (ownership-checked
  like `delete_habit`), inline-edit on the detail heading (click to edit, Enter
  commits, Escape/blur cancels).
- **Delete** uses an inline "Delete forever? Yes / Cancel" row instead of native
  `confirm()`.
- **Errors are visible**: add/delete/toggle/rename all check `res.ok` and surface a
  dismissible banner (same style as the Login/Signup error banner) instead of
  swallowing failures into `console.error`. Toggle rolls back optimistic state via
  `loadHabits()` on failure.
- **Keyboard shortcuts** on Overview: `1`–`9` toggle the nth habit, `N` focuses the
  add-habit input, `Escape` returns to Overview from a detail view. Guarded against
  firing while typing in an input.
- Dead pre-SPA leftovers (`templates/`, `static/`) deleted — `app.py` had zero
  `render_template` calls, nothing referenced them.

**A routing/animation gotcha worth knowing**: the outer page-transition
`<AnimatePresence mode="wait"><Routes key={location.pathname}>` in `App.tsx`
originally keyed on the *full* pathname. Navigating within `/dashboard/:habitId?`
(e.g. clicking a different habit) shares that one Route, but keying on the full path
still forced the whole Dashboard subtree — including its *own* nested
`AnimatePresence` for the Overview↔Detail transition — to unmount and remount
mid-navigation. Two nested `mode="wait"` exits resolving at once does not complete
reliably: the URL updates but the page can stay frozen on the old view. Fixed by
keying the outer transition on *which page* (`/dashboard` vs the literal pathname
for everything else), not the exact path, so switching habits stays inside the same
Dashboard instance.

A related, more fundamental fix: Dashboard's own inner Overview↔Detail
`AnimatePresence` was switched from `mode="wait"` to `mode="popLayout"`. `mode="wait"`
makes the *entering* view's mount strictly depend on the *exiting* view's animation
finishing — if the tab loses visibility/focus mid-transition (verified in this repo's
test tooling via `document.hidden`), `requestAnimationFrame` can stall indefinitely
and that exit-complete signal never fires, freezing the UI on stale content
permanently, not just briefly. `popLayout` pops the exiting element out of layout
flow instead of gating on it, so the correct new view always renders immediately;
worst case on a starved tab is a harmless leftover ghost fading out late, never a
functional freeze. Prefer `popLayout` over `wait` for any AnimatePresence a user
interacts with repeatedly.

## SEO / launch-checklist pass (2026-08-15)

Went through a generic 20-item site-launch checklist against the actual app. What
was already true: custom 404 (`NotFound.tsx`), the hero CTA is above the fold
(`h-dvh` hero), mobile breakpoints throughout, form error banners on
Login/Signup/Dashboard, real `alt` text on the three feature icons in
`Landing.tsx`, and the feature images are already served compressed (WebP via the
`images.higgs.ai` proxy, `q=85`).

Added:
- `src/hooks/usePageMeta.ts` — sets `document.title` and the `<meta name="description">`
  tag per page (Landing/Login/Signup/Dashboard/NotFound each call it; Dashboard's
  title also reflects the selected habit). This is client-side only — there's no
  SSR/prerendering, so it helps the browser tab and JS-rendering crawlers but not
  unfurlers that don't execute JS (see Open Graph note below).
- `public/robots.txt` and `public/sitemap.xml` — `/dashboard` is disallowed from
  the sitemap and crawling since it's auth-gated and has no public content to index.
- Real loading spinners (`lucide-react`'s `LoaderCircle` + Tailwind `animate-spin`)
  replacing the old plain "Loading..." text in `App.tsx` and `Dashboard.tsx`.

Deliberately not done, each needing a decision rather than a default:
- **Open Graph image** — `index.html` has no `og:image`/Twitter card tags at all.
  Needs an actual designed 1200×630 asset, not a fabricated one.
- **Cookie banner** — not added on purpose. The app sets exactly one cookie (the
  Flask session, strictly necessary for auth), which is exempt from consent
  requirements under GDPR/ePrivacy. Adding a banner without real tracking would be
  misleading. Only becomes necessary if analytics is added.
- ~~**Analytics**~~ — added 2026-08-15: `@vercel/analytics`, `<Analytics />` mounted
  in `App.tsx` inside the router. Still no cookie banner needed — Vercel Web
  Analytics is cookieless by design (page views tied to an ephemeral hashed
  identifier, not a persistent cookie or IP-based profile).
- **Privacy policy / Terms / real contact address** — not fabricated. These need
  actual content (what's collected, business/contact info) the assistant can't
  invent; echoes the earlier decision to skip a footer/legal page as out of scope.
- **Sticky mobile CTA** — a real conversion-pattern decision for the landing page,
  not a default to add silently.
- **Favicon set** — `favicon.svg` alone covers all evergreen browsers; only a
  nice-to-have gap is an `apple-touch-icon` PNG for iOS home-screen bookmarks.

## UX-polish pass (2026-08-15)

Audited a third, more app-type-dependent checklist (dark mode toggle, cookie
banner, site search, back-to-top, mobile menus, loading animations, hover
states, scroll progress, copy button, print stylesheet, sticky headers,
skip-to-content, password visibility toggle, UTM tracking, form success/error
states, confirmation modal, last-updated date, expandable FAQ, floating
contact) and implemented the items that were cheap, objective wins for this
app specifically:

- **`src/pages/Landing.tsx`**: the nav was previously scoped inside the hero's
  own `overflow-hidden` video container (`absolute top-0`), so it scrolled
  away once you passed the hero. Extracted to a page-level `SiteNav` component
  (`position: fixed`, `z-50`), now persistent across the whole scroll. Added a
  `BackToTop` button (plain `window.scrollY` threshold + listener, no new
  dependency) that fades in past ~60% of viewport height and smooth-scrolls
  to `#top`.
- **Skip-to-content link**: one `<a href="#main-content" className="sr-only
  focus:not-sr-only ...">` in `App.tsx`, rendered once above the router so it
  persists across every page. Each page's outer content wrapper now carries
  `id="main-content" tabIndex={-1}` (Landing's `<main>`, Login/Signup's outer
  `motion.div`, Dashboard's `<main>`, NotFound's outer `motion.div`) so
  activating the link both scrolls to and focuses the right target.
- **Password visibility toggle**: `Eye`/`EyeOff` icon button inside the
  password field on Login and Signup, toggling `type="password"` ↔ `"text"`.

Deliberately skipped, with reasoning (not a default to add):
- **Dark mode toggle** — the app has no light theme to toggle to; it's
  dark-only by design (the whole cinematic-editorial system is built on
  `#0a0a0a` + cream). Adding this means designing a full second theme, not
  wiring a switch.
- **Site search, print stylesheet, UTM tracking, last-updated dates** — low or
  no value here: no searchable content library, no report-style pages worth
  printing, no marketing campaigns feeding traffic, and no static content with
  a meaningful "freshness" concept (habit data changes live).
- **Copy button, expandable FAQ, floating contact** — nothing in the app
  currently needs copying (no share links/codes); an FAQ needs real Q&A
  content the assistant shouldn't invent; floating contact needs a real
  contact method decided first (same reasoning as the earlier real-contact-
  address skip).
- **Confirmation modal** — already functionally covered: habit delete uses an
  inline "Delete forever? Yes / Cancel" row instead of a native `confirm()` or
  a modal overlay. The function (a clear are-you-sure step) matters more than
  it being literally a modal.
- **Form success state** — success on Login/Signup redirects straight to the
  dashboard; there's no distinct flash-of-success moment before that happens.
  Considered low priority given the redirect itself is the confirmation.

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
