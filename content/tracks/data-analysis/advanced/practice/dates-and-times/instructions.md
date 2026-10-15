Write the four functions of `solution.py`. None of them may change its input, and each Series
or DataFrame they return keeps the index of the input. The station is in London: its log holds
**naive London clock times**, which belong to the `Europe/London` time zone. When the clocks go
forward, a London time that never happened (such as 01:30 on 29 March 2026) moves forward to the
first time that exists; no time in the log falls in the hour that repeats when the clocks go back.

1. `parse_log(text)` takes a text Series written `DD/MM/YYYY HH:MM`, day first, and returns the
   times as `datetime64[us]`, with the same index and name. Anything else (an impossible date,
   another layout, seconds, an empty or missing value) becomes `NaT`.
2. `show_table(shows)` takes a DataFrame with the datetime columns `start` and `end` (naive
   London clock times, never missing) and returns a DataFrame with two columns: `day`, the name
   of the start's weekday (`"Monday"` ...), and `minutes`, the **real** time from start to end
   in minutes (`float64`). A show running through the night the clocks go forward lasts an hour
   less than the clock suggests, and one through the night they go back an hour more.
3. `listener_times(starts, zone)` takes a Series of naive London clock times and returns the
   same moments on the clock of the time zone `zone` (such as `"America/New_York"`), so the
   dtype is `datetime64[us, <zone>]`.
4. `weekly_slots(first, count)` takes an aware `Timestamp` in `Europe/London` and returns a
   `DatetimeIndex` of `count` dates, starting with `first`, one week apart, all at the same
   **London clock time**, even across a clock change.

Example:

```python
shows = pd.read_csv("data/shows.csv")
shows["start"] = parse_log(shows["start"])
shows["end"] = parse_log(shows["end"])
print(show_table(shows))
print(listener_times(shows["start"], "America/New_York"))
print(weekly_slots(pd.Timestamp("2026-03-21 20:00", tz="Europe/London"), 3))
```

```text
        day  minutes
0    Friday    120.0
1  Saturday    180.0
2    Sunday     90.0
3    Monday     90.0
0   2026-03-27 03:00:00-04:00
1   2026-03-28 19:00:00-04:00
2   2026-03-29 14:30:00-04:00
3   2026-03-30 13:45:00-04:00
Name: start, dtype: datetime64[us, America/New_York]
DatetimeIndex(['2026-03-21 20:00:00+00:00', '2026-03-28 20:00:00+00:00',
               '2026-04-04 20:00:00+01:00'],
              dtype='datetime64[us, Europe/London]', freq='7D')
```

Night Owls runs from 23:00 on 28 March to 03:00 on the clock, but the clocks went forward at
01:00, so it lasts 180 minutes, not 240. New York is only four hours behind London for the first two
shows, because the US clocks changed three weeks earlier, and five hours behind again once
London's clocks have gone forward.

**Tips.** Give `pd.to_datetime` the exact `format` with `errors="coerce"`. `tz_localize`
declares the zone and takes `nonexistent="shift_forward"`; subtract aware times to get real
durations, and `dt.total_seconds()` makes them numbers. A `freq` of `"7D"` steps by calendar
days, while `pd.Timedelta(days=7)` is exactly 168 hours.
