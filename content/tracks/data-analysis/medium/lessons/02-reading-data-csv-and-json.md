---
title: Reading Data from CSV and JSON
summary: Load tables with `read_csv` and `read_json`, choose the options that make pandas read a file correctly the first time (separator, header, columns, types, dates, missing markers, number formats, encoding), and read JSON records and JSON Lines.
minutes: 35
objectives:
  - Read a CSV file or CSV text with `pd.read_csv` and check the dtypes it inferred
  - Use `sep`, `header`, `names`, `usecols`, `index_col` and `skiprows` to match a file's layout
  - Use `dtype`, `parse_dates`, `na_values`, `thousands`, `decimal` and `encoding` to read values correctly
  - Read a JSON array of records and a JSON Lines file with `pd.read_json`
  - Recognise the signs of a file read with the wrong options
---

## Outline

1. `read_csv` with its defaults
2. Choosing columns, types and dates
3. A file from another country
4. Files without a header
5. Encodings
6. JSON records and JSON Lines

## `read_csv` with its defaults

`pd.read_csv` reads comma-separated values into a DataFrame. Give it a file path, or any object
with a `read` method. In a lesson the data must travel with the code, so the examples wrap CSV
text in `io.StringIO`, which makes a string behave like an open file:

```python
import io

import pandas as pd

csv_text = """date,route,stop,delay_min,passengers
2026-03-02,12,Market Square,4,31
2026-03-02,7A,Hospital,n/a,18
2026-03-03,12,Market Square,11,40
2026-03-03,31,Station,0,
"""
delays = pd.read_csv(io.StringIO(csv_text))
print(delays)
print(delays.dtypes)
```

```text
         date route           stop  delay_min  passengers
0  2026-03-02    12  Market Square        4.0        31.0
1  2026-03-02    7A       Hospital        NaN        18.0
2  2026-03-03    12  Market Square       11.0        40.0
3  2026-03-03    31        Station        0.0         NaN
date              str
route             str
stop              str
delay_min     float64
passengers    float64
dtype: object
```

With no options, pandas took the first line as the **header** (the column names), split on commas,
and **inferred** a dtype for each column from its values:

- `n/a` and the empty field became NaN. pandas treats a list of common markers as missing by
  default, including the empty string, `NA`, `N/A`, `n/a`, `NULL`, `null`, `NaN` and `None`.
- Because NaN is a float, `delay_min` and `passengers` are `float64` although every number is whole.
  Lesson 7 shows the integer type that can hold a gap.
- `route` holds `7A`, so the column is text (`str`). `date` is also just text: pandas does not
  guess dates unless asked.

**Always look at `dtypes` after reading.** A number column read as `str` is the first sign that an
option is missing.

## Choosing columns, types and dates

Three options fix most surprises. `usecols` reads only the columns you name. `dtype` sets the type
of chosen columns instead of letting pandas guess, and `parse_dates` converts columns to dates:

```python
delays = pd.read_csv(
    io.StringIO(csv_text), usecols=["date", "route", "delay_min"], parse_dates=["date"]
)
print(delays.dtypes)

stops = "stop,name\n007,Mill Road\n012,Station\n"
print(pd.read_csv(io.StringIO(stops))["stop"].tolist())
print(pd.read_csv(io.StringIO(stops), dtype={"stop": "str"})["stop"].tolist())
```

```text
date         datetime64[us]
route                   str
delay_min           float64
dtype: object
[7, 12]
['007', '012']
```

- `datetime64[us]` is a date and time stored to the microsecond, the default resolution pandas 3
  gives parsed text. The advanced level works with dates in depth.
- `usecols` saves memory on wide files, because the other columns are never stored.
- Stop `007` looked like a number, so pandas read it as the integer 7. `dtype={"stop": "str"}`
  keeps it as written. Codes such as stops, postcodes and phone numbers are labels, not
  quantities, and must stay text.

## A file from another country

Exports from European software often use `;` between fields, `,` as the decimal point and `.` to
group thousands. This river gauge export also starts with two lines of notes and marks a failed
reading with `-`:

```python
export = """River gauge export, generated 01.04.2026
Units: metres and cubic metres per second
site;reading_date;level_m;flow_m3s;status
North Bridge;01.03.2026;1,42;1.204,5;ok
North Bridge;02.03.2026;1,57;1.388,0;ok
Weir Lane;01.03.2026;-;980,2;sensor fault
Weir Lane;02.03.2026;0,98;1.012,7;ok
"""
levels = pd.read_csv(
    io.StringIO(export),
    sep=";",
    skiprows=2,
    decimal=",",
    thousands=".",
    na_values=["-"],
    parse_dates=["reading_date"],
    date_format="%d.%m.%Y",
)
print(levels)
```

```text
           site reading_date  level_m  flow_m3s        status
0  North Bridge   2026-03-01     1.42    1204.5            ok
1  North Bridge   2026-03-02     1.57    1388.0            ok
2     Weir Lane   2026-03-01      NaN     980.2  sensor fault
3     Weir Lane   2026-03-02     0.98    1012.7            ok
```

`skiprows=2` skipped the notes, so the third line became the header. `na_values` **adds** `-` to
the default missing markers. `date_format` uses the `strftime` codes from Python's `datetime`
module and makes sure `01.03.2026` is the first of March, not the third of January. Both number
columns came out as `float64`.

## Files without a header

When the first line is already data, give the column names yourself with `names`. `index_col`
makes a column the row index instead of a RangeIndex:

```python
no_header = """N01,North Bridge,river
W02,Weir Lane,canal
"""
sites = pd.read_csv(io.StringIO(no_header), names=["code", "name", "water"], index_col="code")
print(sites)
print(sites.loc["W02", "name"])
```

```text
              name  water
code                     
N01   North Bridge  river
W02      Weir Lane  canal
Weir Lane
```

Passing `names` implies `header=None`, so no line is used up as a header. `header=None` alone
would name the columns 0, 1 and 2. `sites.loc[row, column]` looks up by labels; lesson 4 explains it.

## Encodings

A file is bytes; the **encoding** says how bytes become characters. pandas assumes UTF-8. Files from
older Windows programs are often in `cp1252`, where `é` is one byte that is not valid UTF-8:

```python
from pathlib import Path

Path("stops.csv").write_text("stop,zone\nCafé Corner,2\nGare du Nord,3\n", encoding="cp1252")
try:
    pd.read_csv("stops.csv")
except UnicodeDecodeError as error:
    print("UnicodeDecodeError:", error)
print(pd.read_csv("stops.csv", encoding="cp1252"))
```

```text
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 13: invalid continuation byte
           stop  zone
0   Café Corner     2
1  Gare du Nord     3
```

## JSON records and JSON Lines

`pd.read_json` reads JSON. An API usually returns an array of **records**, one object per row.
**JSON Lines** puts one object on each line with no surrounding array, and needs `lines=True`:

```python
records = """[
  {"bus": "B14", "route": "12", "km": 182.4, "checked_at": "2026-03-02 06:10"},
  {"bus": "B22", "route": "7A", "km": 96.0, "checked_at": "2026-03-02 06:25"}
]"""
print(pd.read_json(io.StringIO(records)))

lines = """{"bus": "B14", "fault": "door sensor", "minutes_lost": 12}
{"bus": "B31", "fault": "ramp", "minutes_lost": null}
"""
print(pd.read_json(io.StringIO(lines), lines=True))
```

```text
   bus route     km          checked_at
0  B14    12  182.4 2026-03-02 06:10:00
1  B22    7A   96.0 2026-03-02 06:25:00
   bus        fault  minutes_lost
0  B14  door sensor          12.0
1  B31         ramp           NaN
```

JSON `null` became NaN. `checked_at` became a datetime on its own: by default `read_json` converts
columns whose names look like dates (ending in `_at` or `_time`, starting with `timestamp`, or named
`date` or `modified`).

## Common mistakes

- **The wrong separator.** Reading `site;level` data with the default `sep=","` gives a single
  column named `'site;level'`. If `shape` shows one column, check `sep`.
- **Data read as the header.** Without `names`, a headerless file loses its first row to the column
  names (`N01`, `North Bridge`, `river`). Pass `names=` or `header=None`.
- **Thousands separators.** `"1,204.5"` with the default options stays text, so the column is `str`.
  Add `thousands=","`.
- **Codes losing their zeros.** `read_json` infers types aggressively: `"007"` becomes the integer
  `7` even though JSON had it in quotes. Pass `dtype={"stop": "str"}`, as with `read_csv`.
- **A JSON string instead of a file.** `pd.read_json('[{"stop": "007"}]')` raises
  `FileNotFoundError` in pandas 3, because a string is taken as a path. Wrap it in `io.StringIO`.

## Practice

1. Read `"name,score\nAda,91\nGrace,n/a\nLin,78\n"` and print the dtype of `score`. Why is it not
   `int64`?
2. A file has lines like `Hall 3|2026-05-01|1.234,50` (venue, date, takings in euros) and no
   header. Write the `read_csv` call that gives columns `venue`, `day` (a datetime) and `takings`
   (a float).
3. Read the JSON Lines text `'{"id": "0042", "ok": true}\n{"id": "0107", "ok": false}\n'` so that
   `id` keeps its leading zeros.

### Answers

```python
import io

import pandas as pd

scores = pd.read_csv(io.StringIO("name,score\nAda,91\nGrace,n/a\nLin,78\n"))
print(scores["score"].dtype)

takings = pd.read_csv(
    io.StringIO("Hall 3|2026-05-01|1.234,50\nHall 1|2026-05-01|980,00\n"),
    sep="|",
    names=["venue", "day", "takings"],
    parse_dates=["day"],
    decimal=",",
    thousands=".",
)
print(takings.dtypes.to_dict())

checks = pd.read_json(io.StringIO('{"id": "0042", "ok": true}\n{"id": "0107", "ok": false}\n'),
                      lines=True, dtype={"id": "str"})
print(checks["id"].tolist())
```

```text
float64
{'venue': <StringDtype(na_value=nan)>, 'day': dtype('<M8[us]'), 'takings': dtype('float64')}
['0042', '0107']
```

`n/a` is a default missing marker, and NaN needs a float column. In the second answer the dtypes
print in their long form: `StringDtype(na_value=nan)` is the `str` dtype and `<M8[us]` is
`datetime64[us]`. Without `dtype=`, the ids would become `42` and `107`.

## Key takeaways

- `read_csv` infers the header, separator-split columns and dtypes; always check `dtypes` afterwards.
- Match the layout with `sep`, `skiprows`, `header`, `names`, `usecols` and `index_col`.
- Read values correctly with `dtype`, `parse_dates` (plus `date_format`), `na_values`, `decimal`,
  `thousands` and `encoding`.
- Keep codes such as routes and ids as text with `dtype={"col": "str"}`.
- `read_json` reads records; add `lines=True` for JSON Lines, and wrap literal text in `io.StringIO`.

## Further reading

- [pandas.read_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html)
- [pandas.read_json](https://pandas.pydata.org/docs/reference/api/pandas.read_json.html)
- [IO tools: CSV and text files](https://pandas.pydata.org/docs/user_guide/io.html#io-read-csv-table)
- [Python: strftime and strptime format codes](https://docs.python.org/3.15/library/datetime.html#strftime-and-strptime-format-codes)
