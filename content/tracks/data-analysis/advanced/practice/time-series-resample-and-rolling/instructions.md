Write the three functions of `solution.py`. None of them may change its input. The sample is
`data/meter.csv`: the smart meter's readings, each the kWh used since the reading before, at
irregular times. The meter's Wi-Fi drops now and then, so a whole day can be missing.

1. `daily_use(readings)` takes a DataFrame with the columns `time` (naive datetimes, rows in
   any order) and `kwh`. It returns a Series named `kwh` with one entry for **every** date from
   the first reading's date to the last one's: the total kWh of the readings from that midnight
   up to, but not including, the next, rounded to 2 decimals. A date without any reading is
   **missing**, not `0` (a date whose readings are all `0.0` is `0.0`). The index is a
   `DatetimeIndex` of each date's midnight, named `time`.
2. `compare_days(daily)` takes a Series like the result of step 1, whose index of midnights is
   sorted but may **skip dates** altogether. It returns a DataFrame with one row for every date
   from the first to the last (a skipped date has `kwh` missing), the same index name, and the
   columns:
   - `kwh`: the day's kWh;
   - `change`: the day's kWh minus the **calendar day before**'s, rounded to 2 (missing when
     either is missing);
   - `pct`: that change as a fraction of the day before's kWh, rounded to 3 (missing likewise).
3. `smooth(daily)` takes the same kind of Series and returns a DataFrame with the **same rows**
   (do not add skipped dates) and the columns:
   - `kwh`: the day's kWh;
   - `week_avg`: the mean of the values present in the 7 **calendar days** ending on that date
     (that date and the six before it), rounded to 2;
   - `record`: the largest kWh of any date up to and including this one, missing values ignored.

Example:

```python
readings = pd.read_csv("data/meter.csv", parse_dates=["time"])
daily = daily_use(readings)
print(daily)
print(compare_days(daily))
print(smooth(daily))
```

```text
time
2026-03-01    7.6
2026-03-02    8.1
2026-03-03    7.5
2026-03-04    NaN
2026-03-05    9.0
2026-03-06    5.6
2026-03-07    8.7
Freq: D, Name: kwh, dtype: float64
            kwh  change    pct
time                          
2026-03-01  7.6     NaN    NaN
2026-03-02  8.1     0.5  0.066
2026-03-03  7.5    -0.6 -0.074
2026-03-04  NaN     NaN    NaN
2026-03-05  9.0     NaN    NaN
2026-03-06  5.6    -3.4 -0.378
2026-03-07  8.7     3.1  0.554
            kwh  week_avg  record
time                             
2026-03-01  7.6      7.60     7.6
2026-03-02  8.1      7.85     8.1
2026-03-03  7.5      7.73     8.1
2026-03-04  NaN      7.73     8.1
2026-03-05  9.0      8.05     9.0
2026-03-06  5.6      7.56     9.0
2026-03-07  8.7      7.75     9.0
```

The meter sent nothing on 4 March, so that day is missing rather than 0, and 5 March has no
day before to compare with.

**Tips.** `sum(min_count=1)` keeps an empty bin missing. `diff` and `pct_change` compare
**rows**, so put the series on a daily grid with `asfreq("D")` first. `rolling(7)` counts rows,
while `rolling("7D")` measures time, and the two differ once dates are skipped. `expanding()`
grows from the first row.
