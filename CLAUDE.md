# Habit Tracker

A personal habit tracker with a GitHub-style 365-day contribution heatmap, per-habit
streak tracking, and daily check-off — Flask + SQLAlchemy, no frontend framework.

- **Live**: https://habit-tracker-six-kappa-49.vercel.app
- **Repo**: https://github.com/Oxyrine/Personal-Habit-Tracker (branch `main`, auto-deploys via GitHub → Vercel)

## Stack

- **Backend**: Flask + Flask-SQLAlchemy (`app.py`), one file, no blueprints
- **DB**: SQLite locally (`habits.db`, auto-created on import, gitignored); Postgres via
  Neon in production (`DATABASE_URL`, set by the Vercel Postgres/Neon integration).
  `app.py` picks whichever is set — no code change needed to switch.
- **Frontend**: server-rendered Jinja (`templates/`) + vanilla CSS/JS (`static/`), no
  build step, no npm at the app level
- **Auth**: Google OAuth only (Authlib), no password system. First sign-in creates a
  `User` row (`google_sub`, `email`, `name`); every route requires a session.
- **Deploy**: Vercel's Python runtime auto-detects Flask from `requirements.txt` +
  `api/index.py` (a thin re-export of `app.py`'s `app`). `vercel.json` is intentionally
  empty — an explicit rewrite once broke routing; Vercel's own detection handles it.

## Data model (`app.py`)

- `User(id, google_sub, email, name)`
- `Habit(id, user_id, name, created_on)`
- `Log(id, habit_id, day)` — a row's *existence* means done that day, no boolean
- Streaks (`compute_streaks`) count only from `created_on` forward, not from the graph's
  365-day window start

## Design

Warm-monochrome editorial style (not the earlier GitHub-dark theme): white canvas,
Newsreader serif for hero headings, Geist Sans/Mono for UI and data, 1px-bordered cards,
muted pastel accents, a bordered sage-green heatmap ramp (bordered so low levels stay
legible against white — an unbordered fill made `l0` nearly invisible, see git history).
Full palette/tokens in `static/style.css` `:root`.

## Known gaps / next steps

- **Google OAuth credentials aren't set on Vercel yet** — `/login` shows a graceful
  "not configured" notice instead of the real button until `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` / `SECRET_KEY` are set (`vercel env add ...`, values are
  secrets — run that yourself, not through chat). See commit history for the exact
  Google Cloud Console redirect URIs needed.
- `signup-ui/` (see below) is a standalone design, **not wired to the Flask login flow
  yet** — the live `/login` still uses `templates/login.html`.
- No habit rename/edit, no CSV export, no reminders.

## Subproject: `signup-ui/`

Standalone React/Vite/Tailwind v4 build of a "Sign Up" page, built to a specific visual
spec — separate npm project, own `package.json`, not part of the Flask app's deploy.
`motion/react` for animation, `lucide-react` for icons (note: this lucide-react version
ships **no brand icons** — Google/Github buttons use `Globe`/`GitFork` as stand-ins).
Hero panel background is a CSS gradient placeholder (video generation was requested but
blocked by workspace credits — revisit if a real video is wanted).

```bash
cd signup-ui && npm run dev   # localhost:5173
```

## Local dev

```bash
python app.py       # localhost:5000, SQLite, zero setup
python test_streaks.py
```
