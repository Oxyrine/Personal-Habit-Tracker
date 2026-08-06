import os
from datetime import date, timedelta

from flask import Flask, abort, jsonify, redirect, render_template, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
# Absolute, so the DB lands next to app.py no matter where you launch from.
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    app.root_path, "habits.db"
)
db = SQLAlchemy(app)

DEFAULT_USER = "me"
WINDOW = 365


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)


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
    user = User.query.filter_by(name=DEFAULT_USER).first()
    if not user:
        user = User(name=DEFAULT_USER)
        db.session.add(user)
        db.session.commit()
    return user


@app.get("/")
def dashboard():
    today = date.today()
    start = today - timedelta(days=WINDOW - 1)
    habits = Habit.query.filter_by(user_id=current_user().id).order_by(Habit.id).all()

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

    return render_template("index.html", habits=rows, today=today.isoformat())


@app.post("/habits")
def add_habit():
    name = (request.form.get("name") or "").strip()[:60]
    if name:
        db.session.add(Habit(user_id=current_user().id, name=name))
        db.session.commit()
    return redirect("/")


@app.post("/toggle")
def toggle():
    data = request.get_json(silent=True) or {}
    habit = db.session.get(Habit, data.get("habit_id"))
    if not habit:
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
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
