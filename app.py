import os
import re
from datetime import date, datetime, timedelta
from functools import wraps

from flask import (
    Flask,
    abort,
    jsonify,
    request,
    session,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)

db_url = os.environ.get("DATABASE_URL")
IS_PRODUCTION = bool(db_url)

# Fail loudly if SECRET_KEY is missing in production rather than silently signing
# sessions with a fallback that's sitting in this public repo -- a misconfigured
# deploy should 500, not quietly become forgeable by anyone who reads the source.
if IS_PRODUCTION:
    app.secret_key = os.environ["SECRET_KEY"]
else:
    app.secret_key = os.environ.get("SECRET_KEY", "dev-only-not-secret")

if db_url:
    db_url = db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = "sqlite:///" + os.path.join(app.root_path, "habits.db")
app.config["SQLALCHEMY_DATABASE_URI"] = db_url

# Secure only in production (Vercel is HTTPS-only there); local http://localhost
# dev would silently drop the session cookie if this were always True.
app.config["SESSION_COOKIE_SECURE"] = IS_PRODUCTION
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

db = SQLAlchemy(app)

WINDOW = 365
MIN_PASSWORD_LEN = 8
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    failed_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(60), nullable=False)
    created_on = db.Column(db.Date, nullable=False, default=date.today)
    logs = db.relationship("Log", backref="habit", cascade="all, delete-orphan", lazy="selectin")

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey("habit.id"), nullable=False)
    day = db.Column(db.Date, nullable=False, index=True)
    __table_args__ = (db.UniqueConstraint("habit_id", "day"),)

with app.app_context():
    db.create_all()

def compute_streaks(days, created_on, today):
    days = {d for d in days if d >= created_on}
    if not days:
        return 0, 0
    longest = run = 0
    prev = None
    for d in sorted(days):
        run = run + 1 if prev and (d - prev).days == 1 else 1
        longest = max(longest, run)
        prev = d
    cursor = today if today in days else today - timedelta(days=1)
    current = 0
    while cursor in days:
        current += 1
        cursor -= timedelta(days=1)
    return current, longest

def current_user():
    return db.session.get(User, session["user_id"])

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session or current_user() is None:
            session.clear()
            return jsonify({"error": "Unauthorized"}), 401
        return view(*args, **kwargs)
    return wrapped

@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    if "user_id" not in session:
        return jsonify({"authenticated": False})
    user = current_user()
    if not user:
        session.clear()
        return jsonify({"authenticated": False})
    return jsonify({"authenticated": True, "user": {"id": user.id, "name": user.name, "email": user.email}})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()

    if user and user.locked_until:
        if user.locked_until > datetime.utcnow():
            return jsonify({"error": "Too many failed attempts. Try again in a few minutes."}), 429
        user.failed_attempts = 0
        user.locked_until = None

    if not user or not check_password_hash(user.password_hash, password):
        if user:
            user.failed_attempts += 1
            if user.failed_attempts >= LOGIN_MAX_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
            db.session.commit()
        return jsonify({"error": "Wrong email or password"}), 400

    user.failed_attempts = 0
    user.locked_until = None
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"success": True})

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    # Personal single-user app: closed unless SIGNUP_INVITE_CODE is unset (local dev).
    # Checked first so a stranger without the code never reaches the email-exists
    # oracle below, and never burns a scrypt hash.
    invite = os.environ.get("SIGNUP_INVITE_CODE")
    if invite and data.get("invite") != invite:
        return jsonify({"error": "Signups are closed"}), 403

    name = (data.get("name") or "").strip()[:120]
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Enter your name and a valid email"}), 400
    if len(password) < MIN_PASSWORD_LEN:
        return jsonify({"error": f"Password must be at least {MIN_PASSWORD_LEN} characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists"}), 400

    user = User(email=email, name=name, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"success": True})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route("/api/habits", methods=["GET"])
@login_required
def get_habits():
    today = date.today()
    start = today - timedelta(days=WINDOW - 1)
    user = current_user()
    habits = Habit.query.filter_by(user_id=user.id).order_by(Habit.id).all()

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
    return jsonify({"habits": rows, "today": today.isoformat()})

@app.route("/api/habits", methods=["POST"])
@login_required
def add_habit():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()[:60]
    if name:
        db.session.add(Habit(user_id=current_user().id, name=name))
        db.session.commit()
    return jsonify({"success": True})

@app.route("/api/habits/<int:habit_id>/delete", methods=["POST"])
@login_required
def delete_habit(habit_id):
    habit = db.session.get(Habit, habit_id)
    if habit and habit.user_id == current_user().id:
        db.session.delete(habit)
        db.session.commit()
    return jsonify({"success": True})

@app.route("/api/habits/<int:habit_id>/rename", methods=["POST"])
@login_required
def rename_habit(habit_id):
    habit = db.session.get(Habit, habit_id)
    if not habit or habit.user_id != current_user().id:
        abort(404)
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()[:60]
    if not name:
        return jsonify({"error": "Name cannot be empty"}), 400
    habit.name = name
    db.session.commit()
    return jsonify({"success": True, "name": name})

@app.route("/api/toggle", methods=["POST"])
@login_required
def toggle():
    data = request.get_json(silent=True) or {}
    try:
        habit_id = int(data.get("habit_id"))
    except (TypeError, ValueError):
        abort(400)
    habit = db.session.get(Habit, habit_id)
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
