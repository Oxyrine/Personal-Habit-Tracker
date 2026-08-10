import os
from datetime import date, timedelta
from functools import wraps

from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

# Needed to sign the session cookie. Fine to fall back locally; production
# (Vercel) must set a real one, or every restart invalidates every session.
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-not-secret")

# Vercel's filesystem is ephemeral, so production points DATABASE_URL at Neon
# (set by the Vercel Postgres integration) instead of a local SQLite file.
# Local dev needs neither an env var nor a network connection: it falls back
# to a SQLite file next to app.py.
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgres://", "postgresql://", 1)  # SQLAlchemy 2.x requirement
else:
    db_url = "sqlite:///" + os.path.join(app.root_path, "habits.db")
app.config["SQLALCHEMY_DATABASE_URI"] = db_url

db = SQLAlchemy(app)

WINDOW = 365
MIN_PASSWORD_LEN = 8


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)


class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(60), nullable=False)
    created_on = db.Column(db.Date, nullable=False, default=date.today)
    logs = db.relationship(
        "Log", backref="habit", cascade="all, delete-orphan", lazy="selectin"
    )


class Log(db.Model):
    """A row exists <=> the habit was completed that day. No boolean needed."""

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habit.id"), nullable=False)
    day = db.Column(db.Date, nullable=False, index=True)
    __table_args__ = (db.UniqueConstraint("habit_id", "day"),)


# create_all() is idempotent (checks what exists before creating), so running
# it at import time is safe on every cold start and keeps local `python app.py`
# working with zero setup.
with app.app_context():
    db.create_all()


def compute_streaks(days, created_on, today):
    """(current, longest) for a set of completed dates, counted from created_on."""
    days = {d for d in days if d >= created_on}
    if not days:
        return 0, 0

    longest = run = 0
    prev = None
    for d in sorted(days):
        run = run + 1 if prev and (d - prev).days == 1 else 1
        longest = max(longest, run)
        prev = d

    # Not ticking today yet shouldn't zero out a live streak.
    cursor = today if today in days else today - timedelta(days=1)
    current = 0
    while cursor in days:  # already filtered, so it stops at created_on
        current += 1
        cursor -= timedelta(days=1)
    return current, longest


def current_user():
    return db.session.get(User, session["user_id"])


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped


@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect("/")
    if request.method == "GET":
        return render_template("login.html")

    email = (request.form.get("email") or "").strip().lower()
    password = request.form.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return render_template("login.html", error="Wrong email or password.", email=email)

    session["user_id"] = user.id
    return redirect("/")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if "user_id" in session:
        return redirect("/")
    if request.method == "GET":
        return render_template("signup.html")

    name = (request.form.get("name") or "").strip()[:120]
    email = (request.form.get("email") or "").strip().lower()
    password = request.form.get("password") or ""

    def fail(message):
        return render_template("signup.html", error=message, name=name, email=email)

    if not name or not email or "@" not in email:
        return fail("Enter your name and a valid email.")
    if len(password) < MIN_PASSWORD_LEN:
        return fail(f"Password must be at least {MIN_PASSWORD_LEN} characters.")
    if User.query.filter_by(email=email).first():
        return fail("An account with that email already exists.")

    user = User(email=email, name=name, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return redirect("/")


@app.post("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.get("/old-dashboard")
@login_required
def dashboard():
    today = date.today()
    start = today - timedelta(days=WINDOW - 1)
    user = current_user()
    habits = Habit.query.filter_by(user_id=user.id).order_by(Habit.id).all()

    # Per-habit day lists only; the page derives the combined graph from them, so
    # there's one source of truth for "was this done".
    rows = []
    for h in habits:
        days = {log.day for log in h.logs}
        current, longest = compute_streaks(days, h.created_on, today)
        rows.append(
            {
                "id": h.id,
                "name": h.name,
                "created_on": h.created_on.isoformat(),
                "done": today in days,
                "current": current,
                "longest": longest,
                "total": sum(1 for d in days if d >= h.created_on),
                "days": sorted(d.isoformat() for d in days if d >= start),
            }
        )

    return render_template("index.html", habits=rows, today=today.isoformat(), user=user)


@app.post("/habits")
@login_required
def add_habit():
    name = (request.form.get("name") or "").strip()[:60]
    if name:
        db.session.add(Habit(user_id=current_user().id, name=name))
        db.session.commit()
    return redirect("/")


@app.post("/habits/<int:habit_id>/delete")
@login_required
def delete_habit(habit_id):
    habit = db.session.get(Habit, habit_id)
    if habit and habit.user_id == current_user().id:
        db.session.delete(habit)  # cascade takes the logs with it
        db.session.commit()
    return redirect("/")


@app.post("/toggle")
@login_required
def toggle():
    data = request.get_json(silent=True) or {}
    habit = db.session.get(Habit, data.get("habit_id"))
    if not habit or habit.user_id != current_user().id:
        abort(404)
    try:
        day = date.fromisoformat(data["day"])
    except (KeyError, TypeError, ValueError):
        abort(400)
    today = date.today()
    if day > today or day < habit.created_on:
        abort(400)

    log = Log.query.filter_by(habit_id=habit.id, day=day).first()
    if log:
        db.session.delete(log)
    else:
        db.session.add(Log(habit_id=habit.id, day=day))
    db.session.commit()

    days = {l.day for l in habit.logs}
    current, longest = compute_streaks(days, habit.created_on, today)
    return jsonify(
        habit_id=habit.id,
        day=day.isoformat(),
        done=day in days,
        current=current,
        longest=longest,
        total=sum(1 for d in days if d >= habit.created_on),
    )


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
