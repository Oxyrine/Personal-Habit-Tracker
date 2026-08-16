import os
from datetime import datetime, timedelta

import app as app_module

app_module.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
app_module.app.config["TESTING"] = True


def fresh_client():
    with app_module.app.app_context():
        app_module.db.drop_all()
        app_module.db.create_all()
    return app_module.app.test_client()


def test_signup_rejects_bad_email():
    c = fresh_client()
    r = c.post("/api/signup", json={"name": "A", "email": "not-an-email", "password": "longenough"})
    assert r.status_code == 400


def test_signup_accepts_valid_email():
    c = fresh_client()
    r = c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "longenough"})
    assert r.status_code == 200
    assert r.get_json()["success"] is True


def test_login_locks_out_after_max_attempts():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
    c.post("/api/logout")

    for _ in range(app_module.LOGIN_MAX_ATTEMPTS):
        r = c.post("/api/login", json={"email": "a@example.com", "password": "wrong"})
        assert r.status_code == 400

    # locked now, even with the correct password
    r = c.post("/api/login", json={"email": "a@example.com", "password": "correcthorse"})
    assert r.status_code == 429


def test_login_success_resets_failed_attempts():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
    c.post("/api/logout")

    c.post("/api/login", json={"email": "a@example.com", "password": "wrong"})
    r = c.post("/api/login", json={"email": "a@example.com", "password": "correcthorse"})
    assert r.status_code == 200

    with app_module.app.app_context():
        user = app_module.User.query.filter_by(email="a@example.com").first()
        assert user.failed_attempts == 0
        assert user.locked_until is None


def test_rename_rejects_other_users_habit():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
    c.post("/api/habits", json={"name": "Original"})
    with app_module.app.app_context():
        habit_id = app_module.Habit.query.filter_by(name="Original").first().id
    c.post("/api/logout")

    c.post("/api/signup", json={"name": "B", "email": "b@example.com", "password": "correcthorse"})
    r = c.post(f"/api/habits/{habit_id}/rename", json={"name": "Hijacked"})
    assert r.status_code == 404

    with app_module.app.app_context():
        habit = app_module.db.session.get(app_module.Habit, habit_id)
        assert habit.name == "Original"


def test_rename_updates_owners_habit():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
    c.post("/api/habits", json={"name": "Original"})
    with app_module.app.app_context():
        habit_id = app_module.Habit.query.filter_by(name="Original").first().id

    r = c.post(f"/api/habits/{habit_id}/rename", json={"name": "Renamed"})
    assert r.status_code == 200
    assert r.get_json()["name"] == "Renamed"


def test_signup_rejects_without_invite_code():
    c = fresh_client()
    os.environ["SIGNUP_INVITE_CODE"] = "letmein"
    try:
        r = c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
        assert r.status_code == 403

        r = c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse", "invite": "wrong"})
        assert r.status_code == 403

        r = c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse", "invite": "letmein"})
        assert r.status_code == 200
    finally:
        del os.environ["SIGNUP_INVITE_CODE"]


def test_login_unlocks_after_expiry_instead_of_relocking():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})
    c.post("/api/logout")

    with app_module.app.app_context():
        user = app_module.User.query.filter_by(email="a@example.com").first()
        user.failed_attempts = app_module.LOGIN_MAX_ATTEMPTS
        user.locked_until = datetime.utcnow() - timedelta(seconds=1)  # expired
        app_module.db.session.commit()

    # One wrong attempt after expiry should reset the counter, not re-lock on the spot.
    r = c.post("/api/login", json={"email": "a@example.com", "password": "wrong"})
    assert r.status_code == 400

    r = c.post("/api/login", json={"email": "a@example.com", "password": "correcthorse"})
    assert r.status_code == 200


def test_login_required_clears_session_for_deleted_user():
    c = fresh_client()
    c.post("/api/signup", json={"name": "A", "email": "a@example.com", "password": "correcthorse"})

    with app_module.app.app_context():
        app_module.User.query.filter_by(email="a@example.com").delete()
        app_module.db.session.commit()

    r = c.get("/api/habits")
    assert r.status_code == 401


if __name__ == "__main__":
    test_signup_rejects_bad_email()
    test_signup_accepts_valid_email()
    test_login_locks_out_after_max_attempts()
    test_login_success_resets_failed_attempts()
    test_rename_rejects_other_users_habit()
    test_rename_updates_owners_habit()
    test_signup_rejects_without_invite_code()
    test_login_unlocks_after_expiry_instead_of_relocking()
    test_login_required_clears_session_for_deleted_user()
    print("ok")
