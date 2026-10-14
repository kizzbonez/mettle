---
title: "Data Formats: JSON, CSV and Time"
summary: Exchange data correctly. Read and write JSON (and what it cannot represent), CSV with quoting and dialects, dates and times that know their time zone, and money with decimal.Decimal instead of float, plus exact fractions.
minutes: 40
objectives:
  - Convert between Python values and JSON, including types JSON lacks, and report malformed input
  - Read and write CSV with csv.DictReader and csv.DictWriter, opening files with newline=""
  - Work with aware datetimes, convert between time zones with zoneinfo, and parse and format dates
  - Calculate money with Decimal, rounding to cents with quantize, and know when Fraction fits
---

## Outline

1. JSON
2. CSV
3. Dates and times
4. Time zones with `zoneinfo`
5. Money with `decimal`
6. Exact fractions

## JSON

**JSON** (JavaScript Object Notation) is the text format of web APIs and many configuration files.
It has objects, arrays, strings, numbers, `true`, `false` and `null`, which map to `dict`, `list`,
`str`, `int`/`float`, `True`, `False` and `None`. `json.dumps` turns a value into JSON text and
`json.loads` parses text back (`json.dump` and `json.load` do the same with an open file):

```python
import json
from datetime import date
from decimal import Decimal

booking = {"guest": "Zoë", "nights": 3, "rooms": (12, 14), "paid": None, 7: "lucky"}
text = json.dumps(booking)
print(text)
back = json.loads(text)
print(back)
print(back == booking)


def to_json(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, date):
        return value.isoformat()
    raise TypeError(f"cannot store {type(value).__name__} as JSON")


invoice = {"total": Decimal("249.90"), "due": date(2026, 11, 1)}
print(json.dumps(invoice, default=to_json, indent=2, ensure_ascii=False))

try:
    json.loads('{"total": 249.90,}')
except json.JSONDecodeError as error:
    print(f"line {error.lineno}, column {error.colno}: {error.msg}")
print(json.loads('{"total": 249.90}', parse_float=Decimal))
```

```text
{"guest": "Zoë", "nights": 3, "rooms": [12, 14], "paid": null, "7": "lucky"}
{'guest': 'Zoë', 'nights': 3, 'rooms': [12, 14], 'paid': None, '7': 'lucky'}
False
{
  "total": "249.90",
  "due": "2026-11-01"
}
line 1, column 17: Illegal trailing comma before end of object
{'total': Decimal('249.90')}
```

The round trip is not exact: the tuple came back as a list and the key `7` as the string `"7"`,
because JSON keys are always strings. Non-ASCII text is escaped unless you pass
`ensure_ascii=False`. JSON has no dates or decimals, so `dumps` raises `TypeError` for them unless
a `default` function converts them; choose ISO 8601 strings for dates and strings for exact
amounts. `parse_float=Decimal` reads numbers without passing through `float`.
`json.JSONDecodeError` is a `ValueError` that says where the text broke. From a shell,
`python -m json file.json` pretty-prints a file.

## CSV

**CSV** (comma-separated values) is what spreadsheets export. It looks trivial until a field
contains a comma, a quote or a line break; then it is quoted, with quotes inside doubled. Never
split CSV lines with `str.split(",")`. Use the `csv` module, and open the file with
`newline=""`, because the module does its own line-ending handling:

```python
import csv
from pathlib import Path

Path("rooms.csv").write_text(
    'room,guest,rate\n'
    '12,"Okafor, Ada",89.50\n'
    '14,Lin Wei,105.00\n'
    '15,"The ""Blue"" Suite",210\n',
    encoding="utf-8",
)

with open("rooms.csv", newline="", encoding="utf-8") as file:
    rows = list(csv.DictReader(file))
for row in rows:
    print(row)

with open("report.csv", "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=["room", "guest"], extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
print(Path("report.csv").read_bytes())
```

```text
{'room': '12', 'guest': 'Okafor, Ada', 'rate': '89.50'}
{'room': '14', 'guest': 'Lin Wei', 'rate': '105.00'}
{'room': '15', 'guest': 'The "Blue" Suite', 'rate': '210'}
b'room,guest\r\n12,"Okafor, Ada"\r\n14,Lin Wei\r\n15,"The ""Blue"" Suite"\r\n'
```

- `csv.reader` gives each row as a list; `DictReader` uses the header row as keys.
- **Every value is a string.** Convert `room` and `rate` yourself, and handle a `ValueError`.
- A row with too few fields gets `None` for the missing keys; check for it.
- `DictWriter` needs `fieldnames`; keys not listed raise `ValueError` unless
  `extrasaction="ignore"`. The default `"excel"` **dialect** ends lines with `\r\n` and quotes only
  where needed (`QUOTE_MINIMAL`). Pass `delimiter=";"` or `dialect="excel-tab"` for other formats.

## Dates and times

The `datetime` module has `date`, `time`, `datetime` and `timedelta` (a duration). A `datetime`
is **naive** if it has no time zone (`tzinfo` is `None`) and **aware** if it has one. A naive
value means nothing precise: 15:00 *where*? Store and compare aware values, normally in UTC, and
convert to a local zone only to show them.

- `datetime.now(UTC)` is the current moment, aware. `datetime.utcnow()` is deprecated: it returns
  a naive value, which other code then takes for local time.
- `isoformat()` and `datetime.fromisoformat()` write and read ISO 8601, such as
  `2026-10-24T14:00:00+00:00`. Prefer it for files and APIs.
- `strftime(format)` formats for people, `datetime.strptime(text, format)` parses a known layout,
  with codes like `%Y` (year), `%m`, `%d`, `%H`, `%M`, `%A` (weekday name) and `%B` (month name).

## Time zones with `zoneinfo`

`zoneinfo.ZoneInfo("Europe/Lisbon")` loads a zone from the IANA time zone database, including
its daylight saving time (DST) rules. The data comes from the operating system; Windows has none,
so declare a dependency on the `tzdata` package from PyPI in projects that must run there. (The lab
sandbox, a slim Linux image, has the system database.)

```python
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

check_in = datetime(2026, 10, 24, 15, 0, tzinfo=ZoneInfo("Europe/Lisbon"))
print(check_in, check_in.tzname())
print(check_in.astimezone(UTC))
print(check_in.astimezone(ZoneInfo("Asia/Tokyo")))

check_out = check_in + timedelta(days=2)
print(check_out, check_out.tzname())
print(check_out - check_in)
print(check_out.astimezone(UTC) - check_in.astimezone(UTC))

stamp = "2026-10-24T14:00:00+00:00"
parsed = datetime.fromisoformat(stamp)
print(parsed == check_in, parsed.isoformat())
print(check_in.strftime("%A %d %B %Y, %H:%M"))
print(datetime.strptime("24/10/2026 15:00", "%d/%m/%Y %H:%M"))

naive = datetime(2026, 10, 24, 15, 0)
try:
    print(check_in - naive)
except TypeError as error:
    print("TypeError:", error)
```

```text
2026-10-24 15:00:00+01:00 WEST
2026-10-24 14:00:00+00:00
2026-10-24 23:00:00+09:00
2026-10-26 15:00:00+00:00 WET
2 days, 0:00:00
2 days, 1:00:00
True 2026-10-24T14:00:00+00:00
Saturday 24 October 2026, 15:00
2026-10-24 15:00:00
TypeError: can't subtract offset-naive and offset-aware datetimes
```

Lisbon leaves summer time on 25 October 2026. Adding two days to a datetime in a zone is
**wall-clock** arithmetic: check-out is again 15:00, now at offset +00:00. Subtracting two values
in the same zone also ignores the offsets and says 2 days, while the real elapsed time, computed in
UTC, is 2 days and 1 hour. When you need elapsed time, convert to UTC first. Aware and naive values
cannot be mixed. `strptime` gave a naive result, because the text had no offset.

Python 3.15 change: a `strptime` format with `%d` but no year now raises `ValueError`, because
without a year 29 February cannot be parsed. Add a year to the text and the format.

## Money with `decimal`

A `float` stores binary fractions, so most cent amounts are approximations (basic level, lesson
4). Sums drift and comparisons fail. `decimal.Decimal` stores decimal digits exactly:

```python
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

print(0.1 + 0.2, sum([0.10] * 3) == 0.30)
print(Decimal("0.1") + Decimal("0.2"), sum([Decimal("0.10")] * 3) == Decimal("0.30"))
print(Decimal(0.1))

CENT = Decimal("0.01")
tax = Decimal("89.50") * 3 * Decimal("0.065")
print(tax, tax.quantize(CENT))
print(Decimal("2.665").quantize(CENT), Decimal("2.665").quantize(CENT, rounding=ROUND_HALF_UP))
print(f"{Decimal('1234.5'):,.2f}")

try:
    Decimal("89.50") * 1.1
except TypeError as error:
    print("TypeError:", error)
try:
    Decimal("12,50")
except InvalidOperation as error:
    print("InvalidOperation:", error)
```

```text
0.30000000000000004 False
0.3 True
0.1000000000000000055511151231257827021181583404541015625
17.45250 17.45
2.66 2.67
1,234.50
TypeError: unsupported operand type(s) for *: 'Decimal' and 'float'
InvalidOperation: Invalid literal for Decimal: '12,50'
```

- **Create decimals from strings**, `Decimal("0.1")`. `Decimal(0.1)` faithfully copies the float's
  error.
- `quantize(Decimal("0.01"))` rounds to cents. The default rounding is `ROUND_HALF_EVEN`
  ("banker's rounding": a tie goes to the even digit, so 2.665 becomes 2.66); many invoices
  require `ROUND_HALF_UP`. Round at the points your rules say, usually once per line or total.
- Mixing with `float` in arithmetic raises `TypeError`, which protects you. Integers mix freely.
- A bad string raises `decimal.InvalidOperation`, which is not a `ValueError`; catch it by name.

## Exact fractions

`fractions.Fraction` stores a numerator and denominator exactly: `Fraction(1, 3) * 3 == 1` is
`True`, and `Fraction("0.125")` is `1/8`. Use it for exact ratios (recipe scaling, probabilities,
splitting into thirds). Use `Decimal` for money, which is written and rounded in decimal digits.

## Common mistakes

- **Splitting CSV by hand.** `'12,"Okafor, Ada",89.50'.split(",")` gives four fields. Use `csv`.
- **Opening CSV without `newline=""`.** On Windows, written files get an extra `\r` and show blank
  rows in spreadsheets.
- **Naive datetimes in stored data.** They break on DST changes and between servers. Store UTC, aware.
- **`Decimal(19.99)`** gives `19.989999999999998436805981327779591083526611328125`. Use a string.
- **Assuming JSON round-trips.** Tuples, integer keys, dates and decimals all change or fail.

## Practice

1. Parse `"2026-03-29T00:30:00+00:00"`, convert it to `Europe/Lisbon`, and add 2 hours there.
   What do you get, and how much real time passed?
2. Sum the `rate` column of `rooms.csv` exactly.
3. Dump `{"when": datetime(2026, 1, 1, tzinfo=UTC)}` to JSON.

### Answers

```python
import csv
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

start = datetime.fromisoformat("2026-03-29T00:30:00+00:00").astimezone(ZoneInfo("Europe/Lisbon"))
later = start + timedelta(hours=2)
print(start, later, later.astimezone(UTC) - start.astimezone(UTC))

with open("rooms.csv", newline="", encoding="utf-8") as file:
    print(sum(Decimal(row["rate"]) for row in csv.DictReader(file)))

print(json.dumps({"when": datetime(2026, 1, 1, tzinfo=UTC)}, default=datetime.isoformat))
```

```text
2026-03-29 00:30:00+00:00 2026-03-29 02:30:00+01:00 1:00:00
404.50
{"when": "2026-01-01T00:00:00+00:00"}
```

Clocks in Lisbon jump from 01:00 to 02:00 that night, so "2 hours later" on the wall clock is only
1 hour of real time. `default=datetime.isoformat` works because it is called with the value.

## Key takeaways

- JSON keys are strings; dates and decimals need a `default` function and a chosen text form.
- Read CSV with `csv` and `newline=""`; every field arrives as a string.
- Keep datetimes aware, store UTC, and convert with `ZoneInfo` for display.
- Arithmetic within one zone is wall-clock time; compute elapsed time in UTC.
- Money is `Decimal` built from strings, rounded with `quantize`.

## Further reading

- [json: JSON encoder and decoder](https://docs.python.org/3.15/library/json.html)
- [csv: CSV file reading and writing](https://docs.python.org/3.15/library/csv.html)
- [datetime and zoneinfo](https://docs.python.org/3.15/library/zoneinfo.html)
- [decimal: Decimal fixed-point and floating-point arithmetic](https://docs.python.org/3.15/library/decimal.html)
