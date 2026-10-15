---
title: Dates and Times
summary: Parse text into datetimes with `pd.to_datetime`, take them apart with the `.dt` accessor, do arithmetic with `Timestamp` and `Timedelta`, attach and convert time zones, and generate regular dates with `date_range`, all as pandas 3 does it.
minutes: 40
objectives:
  - Parse dates with `pd.to_datetime` using `format`, `errors="coerce"` and `dayfirst`, and explain the `datetime64[us]` dtype
  - Extract parts of dates such as the weekday and hour with the `.dt` accessor
  - Compute durations by subtracting datetimes and shift dates with `Timedelta`
  - Attach a time zone with `tz_localize` and convert with `tz_convert`, and handle a time lost to daylight saving
  - Generate dates with `date_range` and the `D`, `h`, `ME`, `QE` and `YE` aliases, and tell a calendar `Day` from 24 hours
---

## Outline

1. From text to datetimes
2. The `.dt` accessor
3. `Timestamp`, `Timedelta` and date arithmetic
4. Time zones
5. Regular dates with `date_range`
6. A calendar day is not always 24 hours

## From text to datetimes

Dates arrive as text, and text cannot be sorted by time, subtracted or grouped by month. `pd.to_datetime` parses it into a **datetime** column. `errors="coerce"` turns anything it cannot parse into **`NaT`** ("not a time"), the missing value for dates, instead of raising:

```python
import pandas as pd

raw = pd.Series(["2026-03-28 09:15", "2026-03-28 17:40", "not recorded", "2026-03-29 08:05"])
taken = pd.to_datetime(raw, errors="coerce")
print(taken)
```

```text
0   2026-03-28 09:15:00
1   2026-03-28 17:40:00
2                   NaT
3   2026-03-29 08:05:00
dtype: datetime64[us]
```

The dtype `datetime64[us]` stores each moment as a count of **microseconds**. Before pandas 3 parsed dates were always nanoseconds (`[ns]`); pandas 3 uses microseconds unless the text itself has more precision. The values are the same, but code that converts dates to integers gets numbers 1000 times smaller than before.

Without `format`, pandas guesses the format from the first value and applies it to all; a value in another layout raises a `ValueError` that suggests `format=`. When you know the layout, say it with the codes from Python's `datetime.strptime`. Numeric dates are ambiguous: `"04/05/2026"` is 5 April in the US and 4 May in Britain. `dayfirst=True` prefers the British reading, and an explicit `format` removes the doubt:

```python
print(pd.to_datetime(["04/05/2026"]), pd.to_datetime(["04/05/2026"], dayfirst=True))
uk = pd.Series(["28/03/2026 09:15", "29/03/2026 08:05"])
print(pd.to_datetime(uk, format="%d/%m/%Y %H:%M").tolist())
```

```text
DatetimeIndex(['2026-04-05'], dtype='datetime64[us]', freq=None) DatetimeIndex(['2026-05-04'], dtype='datetime64[us]', freq=None)
[Timestamp('2026-03-28 09:15:00'), Timestamp('2026-03-29 08:05:00')]
```

`read_csv(..., parse_dates=["start"])` from pandas Foundations parses columns the same way while reading.

## The `.dt` accessor

As `.str` does for text, the **`.dt` accessor** gives a datetime column the parts and methods of each date. A bike-hire scheme logs rentals:

```python
rentals = pd.DataFrame({
    "bike": ["B07", "B12", "B07", "B03"],
    "start": pd.to_datetime(["2026-03-27 08:55", "2026-03-27 17:20",
                             "2026-03-28 10:05", "2026-03-29 23:40"]),
    "end": pd.to_datetime(["2026-03-27 09:20", "2026-03-27 18:45",
                           "2026-03-28 13:35", "2026-03-30 00:10"]),
})
print(rentals["start"].dt.day_name().tolist())
print(rentals["start"].dt.hour.tolist(), rentals["start"].dt.dayofweek.tolist())
```

```text
['Friday', 'Friday', 'Saturday', 'Sunday']
[8, 17, 10, 23] [4, 4, 5, 6]
```

`dayofweek` counts from Monday as 0, so weekends are `>= 5`. Others include `year`, `month`, `day`, `minute`, `quarter`, `date` (the date without the time), `normalize()` (the same moment at midnight) and `floor("h")` (rounded down to the hour). They make natural groupby keys: `rentals.groupby(rentals["start"].dt.day_name())`.

## `Timestamp`, `Timedelta` and date arithmetic

One value of a datetime column is a **`Timestamp`**, pandas' version of Python's `datetime`. Subtracting two gives a **`Timedelta`**, a length of time, and a column of them has a `timedelta64` dtype:

```python
rentals["duration"] = rentals["end"] - rentals["start"]
print(rentals[["bike", "duration"]])
print(rentals["duration"].dt.total_seconds().div(60).tolist())
print(rentals["duration"].mean())

start = pd.Timestamp("2026-03-27 08:55")
print(start + pd.Timedelta(hours=2, minutes=30))
print(pd.Timestamp("2026-04-01") - start)
```

```text
  bike        duration
0  B07 0 days 00:25:00
1  B12 0 days 01:25:00
2  B07 0 days 03:30:00
3  B03 0 days 00:30:00
[25.0, 85.0, 210.0, 30.0]
0 days 01:27:30
2026-03-27 11:25:00
4 days 15:05:00
```

The rental that crossed midnight is still 30 minutes, which subtracting clock times by hand gets wrong. `dt.total_seconds()` turns durations into plain numbers, and means and sums of durations are durations.

## Time zones

The datetimes so far are **naive**: they carry no time zone, so 18:30 means 18:30 somewhere. `tz_localize` declares which zone a naive time is in, making it **aware**. `tz_convert` then shows the same moment on another zone's clock. pandas 3 uses Python's own `zoneinfo` time zones, named like `"Europe/London"`:

```python
departures = pd.Series(pd.to_datetime(["2026-03-28 18:30", "2026-03-29 18:30"]))
london = departures.dt.tz_localize("Europe/London")
print(london)
print(london.dt.tz_convert("America/New_York"))
```

```text
0   2026-03-28 18:30:00+00:00
1   2026-03-29 18:30:00+01:00
dtype: datetime64[us, Europe/London]
0   2026-03-28 14:30:00-04:00
1   2026-03-29 13:30:00-04:00
dtype: datetime64[us, America/New_York]
```

British clocks went forward overnight, so London's offset from UTC changed from `+00:00` to `+01:00`. US clocks had changed three weeks earlier, so 18:30 in London was 14:30 in New York on Saturday but 13:30 on Sunday. The zone database knows every such rule, so never add offsets by hand.

On the night clocks go forward, 01:30 in London never happens, and localizing it raises `ValueError: 2026-03-29 01:30:00 is a nonexistent time due to daylight savings time. Try using the 'nonexistent' argument.` Passing `nonexistent="shift_forward"` moves it to 02:00. `tz_localize(None)` makes an aware column naive again.

## Regular dates with `date_range`

`pd.date_range` builds evenly spaced datetimes from a start and either an end or a number of `periods`, at a frequency given by an **offset alias**:

```python
print(pd.date_range("2026-01-30", periods=4, freq="D"))
print(pd.date_range("2026-01-01", periods=4, freq="QE"))
print(pd.date_range("2026-03-28 22:00", periods=3, freq="h"))
try:
    pd.date_range("2026-01-01", periods=3, freq="M")
except ValueError as error:
    print(error)
```

```text
DatetimeIndex(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'], dtype='datetime64[us]', freq='D')
DatetimeIndex(['2026-03-31', '2026-06-30', '2026-09-30', '2026-12-31'], dtype='datetime64[us]', freq='QE-DEC')
DatetimeIndex(['2026-03-28 22:00:00', '2026-03-28 23:00:00',
               '2026-03-29 00:00:00'],
              dtype='datetime64[us]', freq='h')
Invalid frequency: M. Failed to parse with error message: ValueError("'M' is no longer supported for offsets. Please use 'ME' instead.")
```

The aliases to know: `D` (calendar day), `h` (hour), `min`, `s`, `W` (week), `MS` and `ME` (month start and **month end**), `QE` (quarter end) and `YE` (year end). pandas 3 removed the old `M`, `Q`, `Y`, `H` and `T`, which you will still see in older tutorials.

## A calendar day is not always 24 hours

A `Timedelta(days=1)` is exactly 24 hours. The offset `pd.offsets.Day(1)`, which `freq="D"` uses, is a **calendar day**: the same clock time on the next date. In pandas 3 the two differ across a clock change:

```python
noon = pd.Timestamp("2026-03-28 12:00", tz="Europe/London")
print(noon + pd.offsets.Day(1))
print(noon + pd.Timedelta(days=1))
```

```text
2026-03-29 12:00:00+01:00
2026-03-29 13:00:00+01:00
```

Sunday 29 March in London lasted only 23 hours. A daily reminder at noon should use `Day`; a 24-hour timer should use `Timedelta`.

## Common mistakes

- **Comparing naive and aware times.** `pd.Timestamp("2026-03-28 18:30", tz="Europe/London") > pd.Timestamp("2026-03-28 18:00")` raises `TypeError: Cannot compare tz-naive and tz-aware timestamps`. Localize both, or neither.
- **Converting instead of localizing.** `tz_convert` on a naive column raises `TypeError: Cannot convert tz-naive timestamps, use tz_localize to localize`. Declare the zone first with `tz_localize`.
- **Leaving day and month to chance.** Without `format` or `dayfirst`, `"04/05/2026"` becomes 5 April. Give the format whenever you know it.
- **Old aliases.** `freq="M"` raises in pandas 3; write `"ME"` (and `"h"` for hours).

## Practice

1. Parse `logged = pd.Series(["31/12/2025 23:30", "31/02/2026 10:00", "01/03/2026 07:45"])`, turning impossible dates into `NaT`.
2. A video call is at 16:00 on 26 October 2026 in Tokyo. What time is it in London and in Los Angeles?
3. Generate the last day of each quarter of 2026.

### Answers

```python
print(pd.to_datetime(logged, format="%d/%m/%Y %H:%M", errors="coerce"))
call = pd.Timestamp("2026-10-26 16:00", tz="Asia/Tokyo")
print(call.tz_convert("Europe/London"), call.tz_convert("America/Los_Angeles"))
print(pd.date_range("2026-01-01", "2026-12-31", freq="QE"))
```

```text
0   2025-12-31 23:30:00
1                   NaT
2   2026-03-01 07:45:00
dtype: datetime64[us]
2026-10-26 07:00:00+00:00 2026-10-26 00:00:00-07:00
DatetimeIndex(['2026-03-31', '2026-06-30', '2026-09-30', '2026-12-31'], dtype='datetime64[us]', freq='QE-DEC')
```

There is no 31 February, so `coerce` gives `NaT`. London has left summer time by 26 October and is at `+00:00`, while Los Angeles changes a week later and is still at `-07:00`. A `Timestamp` created with `tz=` is aware at once.

## Key takeaways

- `pd.to_datetime` parses text; use `format`, `errors="coerce"` and `dayfirst` deliberately. pandas 3 stores microseconds (`datetime64[us]`).
- `.dt` exposes parts such as `day_name()`, `hour` and `dayofweek`, and methods such as `floor`.
- Datetime minus datetime is a `Timedelta`; `dt.total_seconds()` makes it a number.
- `tz_localize` declares a zone and `tz_convert` changes the clock; pandas 3 uses `zoneinfo`.
- Use `ME`, `QE`, `YE` and `h`; `Day` is a calendar day, `Timedelta(days=1)` is 24 hours.

## Further reading

- [pandas user guide: Time series / date functionality](https://pandas.pydata.org/docs/user_guide/timeseries.html)
- [API reference: pandas.to_datetime](https://pandas.pydata.org/docs/reference/api/pandas.to_datetime.html)
- [What's new in pandas 3.0.0: datetime resolution, zoneinfo and offset aliases](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
- [Python: zoneinfo, IANA time zone support](https://docs.python.org/3.15/library/zoneinfo.html)
