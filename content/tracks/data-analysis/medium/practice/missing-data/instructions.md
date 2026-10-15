Write the four functions of `solution.py`. `log` is a DataFrame with one row per day, in date
order, and the columns `day` (text), `steps`, `sleep_h`, `resting_hr` and `workouts`: four
**readings**, all `float64`, with NaN on a day the watch did not record. No function changes `log`.

1. `gap_shares(log)` returns a Series with one entry per column of `log`, in column order: the
   share of the rows where that column is missing, rounded to 3 decimals.
2. `step_summary(log)` returns a dict about `steps`:
   - `"total"`: the sum of the steps recorded, or NaN when no day has steps;
   - `"mean"`: the mean over the days **with** steps (NaN when there are none);
   - `"days"`: how many days have steps.
3. `usable_days(log)` returns the days with **at least 3** of the four readings present, in their
   order, with their index labels and every column.
4. `fill_log(log)` returns a new frame with the same columns, where:
   - `steps` gaps lie on a straight line between the recorded days around them (`interpolate`),
     rounded to whole steps (still `float64`); a gap after the last recorded day takes that day's
     value, and a gap before the first recorded day stays NaN;
   - `sleep_h` gaps take the previous day's value, but only for **one** day in a row: a second
     gap in a row stays NaN;
   - `workouts` gaps are `0` (no workout recorded means none), and the column becomes `Int64`;
   - `day` and `resting_hr` are unchanged.

Example:

```python
log = pd.DataFrame(
    {
        "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "steps": [8200, None, None, 11000, 6400, None, 9100],
        "sleep_h": [7.5, 6.0, None, None, 8.0, 7.0, None],
        "resting_hr": [58, 60, None, 57, None, 59, 61],
        "workouts": [1, None, 0, 2, None, 1, 0],
    }
)
gap_shares(log).tolist()            # [0.0, 0.429, 0.429, 0.286, 0.286]
step_summary(log)                   # {'total': 34700.0, 'mean': 8675.0, 'days': 4}
usable_days(log)["day"].tolist()    # ['Mon', 'Thu', 'Sat', 'Sun']
print(fill_log(log))
```

```text
   day    steps  sleep_h  resting_hr  workouts
0  Mon   8200.0      7.5        58.0         1
1  Tue   9133.0      6.0        60.0         0
2  Wed  10067.0      6.0         NaN         0
3  Thu  11000.0      NaN        57.0         2
4  Fri   6400.0      8.0         NaN         0
5  Sat   7750.0      7.0        59.0         1
6  Sun   9100.0      7.0        61.0         0
```

**Tips.** The mean of a boolean mask is the share of `True`. `sum` skips gaps and returns 0 for
nothing at all unless you pass `min_count=1`; `count` counts the values present. `dropna` has
`subset` and `thresh`. `ffill` takes `limit`. Build the new columns with `assign`, never with
`inplace=True` on a column.
