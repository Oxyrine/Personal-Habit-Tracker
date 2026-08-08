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
- **Auth**: plain email/password. `werkzeug.security` (already a Flask dependency, no
  new package) hashes passwords. `/signup` and `/login` are separate routes; every
  other route requires a session (`login_required`). Previously Google OAuth via
  Authlib — dropped because Google Cloud Console setup (consent screen, credentials,
  redirect URIs) was too much ceremony for a personal app; it also crashed production
  once (Authlib pulled in `requests`, which wasn't in `requirements.txt`).
- **Deploy**: Vercel's Python runtime auto-detects Flask from `requirements.txt` +
  `api/index.py` (a thin re-export of `app.py`'s `app`). `vercel.json` is intentionally
  empty — an explicit rewrite once broke routing; Vercel's own detection handles it.

## Data model (`app.py`)

- `User(id, email unique, password_hash, name)`
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

- No CSRF protection on forms (consistent with the app's existing risk posture — a
  personal single-target app; revisit if that ever changes)
- `signup-ui/` (see below) is a standalone design, **not wired to the Flask login flow
  yet** — the live `/login` and `/signup` use `templates/login.html` / `signup.html`,
  plain email/password, not the React prototype
- No habit rename/edit, no CSV export, no reminders, no password reset flow

## Subproject: `signup-ui/`

Standalone React/Vite/Tailwind v4 build of a "Sign Up" page, built to a specific visual
spec — separate npm project, own `package.json`, own Vercel project, not part of the
Flask app's deploy. `motion/react` for animation, `lucide-react` for icons (note: this
lucide-react version ships **no brand icons** — the Github button uses `GitFork` as a
stand-in; the Google option was dropped entirely, not just relabeled). Hero panel
background is a CSS gradient placeholder (video generation was requested but blocked by
workspace credits — revisit if a real video is wanted).

- **Live**: https://signup-ui-rose.vercel.app (Vercel project `oxyrines-projects/signup-ui`,
  connected to `Oxyrine/Personal-Habit-Tracker` `main` with root directory `signup-ui`
  — auto-deploys on push like the main app, but only when files under `signup-ui/`
  change; the two Vercel projects share one GitHub repo, scoped by root directory)

```bash
cd signup-ui && npm run dev   # localhost:5173
```

## Local dev

```bash
python app.py       # localhost:5000, SQLite, zero setup
python test_streaks.py
```
