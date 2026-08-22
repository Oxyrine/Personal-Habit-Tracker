# Deep Work Ledger

A personal daily-tracking app: a single user checks off Habits per calendar day and
watches streaks build. "Deep Work Ledger" and its "session" language are product
branding, not domain vocabulary — see **Habit** below.

## Language

**Habit**:
A single trackable daily activity, identified by a name, that a user checks off per
calendar day.
_Avoid_: Session, Ledger entry

**Log**:
A record that a Habit was completed on one specific calendar day.
_Avoid_: Entry, check-in

**Rest Day**:
A streak-continuation allowance, earned automatically — one is banked for every 7
consecutive days actually completed within the current streak, and spent
automatically on the next missed day with no manual control. Usage is visible after
the fact: a covered day renders distinctly on the habit detail heatmap.
_Avoid_: Freeze, streak freeze

**Current Streak**:
The number of consecutive days, up to today, a Habit has been completed or covered
by a Rest Day — a Rest Day counts as completion for this purpose. See ADR-0001.
_Avoid_: Streak (ambiguous with Longest Streak)

**Longest Streak**:
The highest Current Streak a Habit has ever reached, including any days a Rest Day
covered.

**Total Days**:
The count of days a Habit was actually completed — real Logs only. Unlike Current
Streak and Longest Streak, a Rest Day does not add to this count. See ADR-0001.
