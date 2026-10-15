---
title: "Time Series: Resample and Rolling"
summary: Treat data indexed by time as a time series. Select by date, change its frequency with `resample` and `asfreq`, find gaps, compare each value with the one before using `shift`, `diff` and `pct_change`, and smooth it with rolling, expanding and exponentially weighted windows.
minutes: 40
objectives:
  - Build a series with a DatetimeIndex and select rows by partial date strings
  - Downsample with `resample` and aggregations, and expose missing periods with `asfreq`
  - Compare values with earlier ones using `shift`, `diff` and `pct_change`
  - Compute rolling statistics over a number of rows and over a span of time, and explain how they differ when data is missing
  - Use `expanding` for running statistics and `ewm` for exponential smoothing
---

## Outline

1. A DatetimeIndex
2. `resample`: changing the frequency
3. Gaps: `asfreq` and filling
4. `shift`, `diff` and `pct_change`
5. Rolling windows by rows and by time
6. `expanding` and `ewm`

## A DatetimeIndex

A **time series** is a sequence of values in time order. In pandas it is a Series or DataFrame whose index is a **DatetimeIndex**, an index of datetimes. That index unlocks selecting by date, resampling and time-based windows. A river gauge reports the water level every six hours:

```python
import pandas as pd

readings = pd.DataFrame({
    "time": pd.date_range("2026-02-01", periods=12, freq="6h"),
    "level_m": [1.21, 1.25, 1.40, 1.62, 1.88, 2.05, 2.11, 1.97, 1.80, 1.66, 1.52, 1.45],
})
levels = readings.set_index("time")["level_m"]
print(levels.loc["2026-02-02"])
```

```text
time
2026-02-02 00:00:00    1.88
2026-02-02 06:00:00    2.05
2026-02-02 12:00:00    2.11
2026-02-02 18:00:00    1.97
Name: level_m, dtype: float64
```

A **partial date string** selects everything inside it: `"2026-02-02"` is the whole day, `"2026-02"` the whole month, and `levels.loc["2026-02-01 12:00":"2026-02-02 06:00"]` a range with both ends included. Time-series methods expect the index sorted, so call `sort_index()` first when the rows arrive out of order.

## `resample`: changing the frequency

`resample(rule)` is a `groupby` on time: it cuts the index into regular bins, such as days, and aggregates each one. Fewer, larger bins is **downsampling**:

```python
print(levels.resample("D").agg(["mean", "max"]))
```

```text
              mean   max
time                    
2026-02-01  1.3700  1.62
2026-02-02  2.0025  2.11
2026-02-03  1.6075  1.80
```

Any aggregation works: `sum`, `mean`, `max`, `count`, `first`, `last`, or several through `agg`. Each bin is labelled by its start, and `"D"` bins hold from midnight up to, but not including, the next midnight. For `"W"`, `"ME"`, `"QE"` and `"YE"` the defaults are the other way round: bins include their right edge and carry the **end** date as their label, so `resample("ME")` labels February with 28 February. With a datetime column instead of an index, pass it with `on=`: `readings.resample("D", on="time")["level_m"].max()`.

## Gaps: `asfreq` and filling

A rain gauge records daily totals, and its record for 5 February is missing:

```python
days = pd.date_range("2026-02-01", periods=8, freq="D")
rain = pd.Series([0.0, 4.2, 12.5, 3.1, 6.0, 0.0, 7.8, 15.2], index=days, name="rain_mm")
rain = rain.drop(pd.Timestamp("2026-02-05"))

print(rain.asfreq("D"))
print(rain.resample("D").sum().loc["2026-02-04":"2026-02-06"])
```

```text
2026-02-01     0.0
2026-02-02     4.2
2026-02-03    12.5
2026-02-04     3.1
2026-02-05     NaN
2026-02-06     0.0
2026-02-07     7.8
2026-02-08    15.2
Freq: D, Name: rain_mm, dtype: float64
2026-02-04    3.1
2026-02-05    0.0
2026-02-06    0.0
Freq: D, Name: rain_mm, dtype: float64
```

`asfreq("D")` puts the series on a regular daily grid without aggregating, so the missing day appears as `NaN`. Notice what `resample("D").sum()` did with it: the sum of an empty bin is 0, so it claims there was no rain. `sum(min_count=1)` returns `NaN` for a bin with no values. Once the gap is visible you can decide how to fill it: `ffill()` repeats the last value, `interpolate()` draws a straight line (1.55 here), and `fillna(0)` asserts there was none.

## `shift`, `diff` and `pct_change`

`shift(1)` moves every value one row later, so each row can see the previous one. `diff()` is the value minus the previous value, and `pct_change()` is the change as a fraction of the previous value:

```python
daily = levels.resample("D").max()
print(pd.DataFrame({
    "level_m": daily,
    "previous": daily.shift(1),
    "change": daily.diff(),
    "pct": daily.pct_change().round(3),
}))
```

```text
            level_m  previous  change    pct
time                                        
2026-02-01     1.62       NaN     NaN    NaN
2026-02-02     2.11      1.62    0.49  0.302
2026-02-03     1.80      2.11   -0.31 -0.147
```

The first row has no predecessor, hence `NaN`. All three work on **rows**, not on time: after a gap, the "previous" row may be two days back. Use `asfreq` first if that matters, or `shift(1, freq="D")`, which moves the index by a day instead of moving values between rows.

## Rolling windows by rows and by time

A **rolling window** computes a statistic over a sliding window ending at each row. With an integer the window is a number of **rows**; with an offset such as `"3D"` it is a span of **time**:

```python
print(pd.DataFrame({
    "rain_mm": rain,
    "last_3_rows": rain.rolling(3).sum(),
    "last_3_days": rain.rolling("3D").sum(),
}))
```

```text
            rain_mm  last_3_rows  last_3_days
2026-02-01      0.0          NaN          0.0
2026-02-02      4.2          NaN          4.2
2026-02-03     12.5         16.7         16.7
2026-02-04      3.1         19.8         19.8
2026-02-06      0.0         15.6          3.1
2026-02-07      7.8         10.9          7.8
2026-02-08     15.2         23.0         23.0
```

The two agree until the gap. On 6 February, three rows reach back to 3 February, four days, while the 3-day window covers only 4, 5 and 6 February. A count window needs a full window by default (`min_periods` equals the window), hence the first two `NaN`; a time window needs only one value. `center=True` labels each window at its middle instead of its end, which suits smoothing a chart.

## `expanding` and `ewm`

An **expanding** window starts at the first row and grows, so `expanding().max()` is the highest level so far. An **exponentially weighted** mean, `ewm`, weights recent values more and older ones less and less; `span` sets how quickly the weights fade:

```python
print(pd.DataFrame({
    "level_m": levels,
    "highest_so_far": levels.expanding().max(),
    "smoothed": levels.ewm(span=3).mean().round(3),
}).head(8))
```

```text
                     level_m  highest_so_far  smoothed
time                                                  
2026-02-01 00:00:00     1.21            1.21     1.210
2026-02-01 06:00:00     1.25            1.25     1.237
2026-02-01 12:00:00     1.40            1.40     1.330
2026-02-01 18:00:00     1.62            1.62     1.485
2026-02-02 00:00:00     1.88            1.88     1.689
2026-02-02 06:00:00     2.05            2.05     1.872
2026-02-02 12:00:00     2.11            2.11     1.992
2026-02-02 18:00:00     1.97            2.11     1.981
```

The smoothed line follows the rise with a lag but without the jitter. Window results are always floats, and `rolling`, `expanding` and `ewm` all chain after `groupby` to work per group, for example per gauge.

## Common mistakes

- **Resampling without a DatetimeIndex.** `readings.resample("D").mean()` raises `TypeError: Only valid with DatetimeIndex, TimedeltaIndex or PeriodIndex, but got an instance of 'RangeIndex'`. Use `set_index("time")` or `on="time"`.
- **An unsorted index.** A time-based window on unsorted rows raises `ValueError: index values must be monotonic`. Call `sort_index()` first.
- **Reading a resampled 0 as a measurement.** Empty bins sum to 0. Check with `asfreq` or `count`, or pass `min_count=1`.
- **Count windows over gappy data.** `rolling(3)` means three rows, not three days. Use `rolling("3D")` when the question is about time.

## Practice

1. When did the river rise the most between two readings, and by how much?
2. Compute the 12-hour rolling mean level.
3. Which day had the highest mean level?

### Answers

```python
rise = levels.diff()
print(rise.idxmax(), round(rise.max(), 2))
print(levels.rolling("12h").mean().round(3).head(3))
print(levels.resample("D").mean().idxmax())
```

```text
2026-02-02 00:00:00 0.26
time
2026-02-01 00:00:00    1.210
2026-02-01 06:00:00    1.230
2026-02-01 12:00:00    1.325
Name: level_m, dtype: float64
2026-02-02 00:00:00
```

`diff` gives each rise, and `idxmax` returns the label of the largest. A `"12h"` window ending at 12:00 includes 06:00 and 12:00 but not 00:00: time windows include their right end only. `resample` then `idxmax` names the day.

## Key takeaways

- A DatetimeIndex allows selection by partial dates, `resample` and time windows; keep it sorted.
- `resample` aggregates into regular bins; `asfreq` reveals missing periods instead of hiding them.
- `shift`, `diff` and `pct_change` work on rows; mind gaps.
- `rolling(n)` counts rows, `rolling("3D")` measures time; they differ when data is missing.
- `expanding` gives running statistics; `ewm` gives a smoothed series weighted towards recent values.

## Further reading

- [pandas user guide: Time series / date functionality, Resampling](https://pandas.pydata.org/docs/user_guide/timeseries.html#resampling)
- [pandas user guide: Windowing operations](https://pandas.pydata.org/docs/user_guide/window.html)
- [API reference: DataFrame.resample](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.resample.html)
