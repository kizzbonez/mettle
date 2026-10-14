Write four functions in `solution.py`. The shift file is CSV with the header
`name,start,end,zone`: a name, the start and the end as **local wall-clock times** written
`YYYY-MM-DD HH:MM`, and the IANA time zone of the branch, such as `Europe/Lisbon`.

1. `read_shifts(path)` reads the file with `csv.DictReader` (open it with `newline=""`) and
   returns a list with one `dict` per row, in file order: `{"name": ..., "start": ..., "end": ...}`,
   where `start` and `end` are **aware** `datetime`s in the row's zone. Parse the text with
   `datetime.strptime(text, "%Y-%m-%d %H:%M")`, which gives a naive value, then attach the zone
   with `.replace(tzinfo=ZoneInfo(zone))`.
2. `minutes_worked(start, end)` returns the **real** time between two aware datetimes, in whole
   minutes, as an `int`. Convert both to UTC before subtracting: two values in the same zone
   subtract as wall-clock time and miss a daylight saving change.
3. `to_json(value)` is a `default` function for `json.dumps`. It returns an aware `datetime` as
   ISO 8601 text **in UTC** (`value.astimezone(UTC).isoformat()`, so it ends in `+00:00`) and a
   `Decimal` as `str(value)`. For anything else it raises `TypeError`.
4. `payroll(path, rate)` reads the shifts and returns JSON **text**: a list with one object per
   shift, in file order, with the keys `"name"`, `"start"` (the start `datetime`, written by
   `to_json`), `"minutes"` (from `minutes_worked`) and `"pay"`. The pay is
   `Decimal(rate) * minutes / 60`, rounded to cents with `quantize(Decimal("0.01"),
   rounding=ROUND_HALF_UP)`, and written by `to_json` as a string. `rate` is a string such as
   `"18.50"`. Call `json.dumps(..., default=to_json, ensure_ascii=False)` so names such as `Inês`
   stay readable.

**Example.** `data/shifts.csv`:

```text
name,start,end,zone
Inês,2026-10-24 22:00,2026-10-25 06:00,Europe/Lisbon
Inês,2026-10-25 22:00,2026-10-26 06:00,Europe/Lisbon
Marcus,2026-10-31 22:00,2026-11-01 06:00,America/New_York
```

```python
shifts = read_shifts("data/shifts.csv")
shifts[0]["start"]          # datetime(2026, 10, 24, 22, 0, tzinfo=ZoneInfo("Europe/Lisbon"))
minutes_worked(shifts[0]["start"], shifts[0]["end"])   # 540, not 480
to_json(Decimal("166.50"))  # '166.50'
print(payroll("data/shifts.csv", "18.50"))
```

```text
[{"name": "Inês", "start": "2026-10-24T21:00:00+00:00", "minutes": 540, "pay": "166.50"}, {"name": "Inês", "start": "2026-10-25T22:00:00+00:00", "minutes": 480, "pay": "148.00"}, {"name": "Marcus", "start": "2026-11-01T02:00:00+00:00", "minutes": 540, "pay": "166.50"}]
```

Lisbon's clocks go back an hour in the night of 24 to 25 October 2026 and New York's in the
night of 31 October to 1 November, so those two nights last nine hours. On 24 October Lisbon is
still on summer time (UTC+1), so 22:00 there is 21:00 UTC.

**Tip.** The imports you need: `csv`, `json`, `from datetime import UTC, datetime`,
`from decimal import ROUND_HALF_UP, Decimal` and `from zoneinfo import ZoneInfo`.
