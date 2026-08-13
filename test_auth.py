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


if __name__ == "__main__":
    test_signup_rejects_bad_email()
    test_signup_accepts_valid_email()
    test_login_locks_out_after_max_attempts()
    test_login_success_resets_failed_attempts()
    print("ok")
