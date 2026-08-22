# Streak counts Rest Day coverage; Total Days doesn't

A Rest Day silently covers a missed day and increments Current/Longest Streak as if
that day happened, while Total Days counts only real Logs. This is deliberate: an
unbroken streak that lied about actual completions would defeat the point of a
streak-continuation mechanic, but Total Days staying honest is what keeps genuine
completions from being inflated by the days a Rest Day covered.
