The starter declares the day's timetable. Every time is a number of **minutes after midnight**,
so `10*60 + 20` is 10:20 and `t/60` and `t%60` give a time's hour and minutes.

- `first` is when the first bus leaves, and a bus leaves every `every` minutes after it.
- `last` is the latest time a bus may leave: a bus exactly at `last` runs, a later one does not.
- `lunch` is an hour of the day (0 to 23). A bus that would leave in that hour, from `lunch`:00
  to `lunch`:59, does not run, but the buses after lunch keep the same rhythm.
- `now` is when a passenger reaches the stop.

Write `main` so that it prints three lines. The tests give the variables other values and run
`main` again. Write every time as `HH:MM`, with two digits each: `fmt.Sprintf("%02d:%02d", t/60,
t%60)`.

1. Use a three-part `for` loop that starts at `first` and adds `every` each time, while the time
   is not after `last`. Skip the buses of the lunch hour with `continue`.
2. **Line 1:** the departures that run, separated by single spaces, with no space at the end.
   If no bus runs at all, print `no buses` instead.
3. **Line 2:** `buses: ` and how many buses run.
4. **Line 3:** `next after `, `now` as `HH:MM`, `: `, then the first bus that runs at or after
   `now` (a bus leaving exactly at `now` counts), or `none` if there is no such bus.

With the starter's values (first bus 10:20, every 25 minutes, last 13:30, lunch at 12, the
passenger at 11:12):

```text
10:20 10:45 11:10 11:35 13:15
buses: 5
next after 11:12: 11:35
```

The buses at 12:00, 12:25 and 12:50 fall in the lunch hour, and the next one, 13:40, would be
after 13:30. A passenger at 11:40 would get `next after 11:40: 13:15`.
