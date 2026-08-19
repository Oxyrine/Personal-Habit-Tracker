from datetime import date, timedelta

from app import compute_streaks

TODAY = date(2026, 8, 6)
OLD = TODAY - timedelta(days=30)


def d(n):
    return TODAY - timedelta(days=n)


def test_streaks():
    assert compute_streaks(set(), OLD, TODAY) == (0, 0, 0)
    assert compute_streaks({d(0)}, OLD, TODAY) == (1, 1, 0)
    # today not ticked yet, but yesterday+ chain is still live
    assert compute_streaks({d(1), d(2)}, OLD, TODAY) == (2, 2, 0)
    # missed yesterday and today -> current dead, longest remembered
    assert compute_streaks({d(2), d(3)}, OLD, TODAY) == (0, 2, 0)
    
    # 7 days earns 1 freeze, which saves d(4) missing
    # Let's set up a chain that earns a freeze.
    # d(12) to d(6) = 7 days -> 1 freeze.
    # missing d(5), freeze used.
    # d(4) to d(1) = 4 days. Total streak = 7 + 1 + 4 = 12.
    assert compute_streaks({d(i) for i in range(6, 13)} | {d(i) for i in range(1, 5)}, OLD, TODAY) == (12, 12, 0)
    
    # logs older than the habit's creation date don't count
    assert compute_streaks({d(0), d(1), d(2)}, d(1), TODAY) == (2, 2, 0)


if __name__ == "__main__":
    test_streaks()
    print("ok")
