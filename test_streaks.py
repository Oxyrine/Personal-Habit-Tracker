from datetime import date, timedelta

from app import compute_streaks

TODAY = date(2026, 8, 6)
OLD = TODAY - timedelta(days=30)


def d(n):
    return TODAY - timedelta(days=n)


def test_streaks():
    assert compute_streaks(set(), OLD, TODAY) == (0, 0)
    assert compute_streaks({d(0)}, OLD, TODAY) == (1, 1)
    # today not ticked yet, but yesterday+ chain is still live
    assert compute_streaks({d(1), d(2)}, OLD, TODAY) == (2, 2)
    # missed yesterday and today -> current dead, longest remembered
    assert compute_streaks({d(2), d(3)}, OLD, TODAY) == (0, 2)
    assert compute_streaks({d(0), d(1), d(3), d(4), d(5)}, OLD, TODAY) == (2, 3)
    # logs older than the habit's creation date don't count
    assert compute_streaks({d(0), d(1), d(2)}, d(1), TODAY) == (2, 2)


if __name__ == "__main__":
    test_streaks()
    print("ok")
