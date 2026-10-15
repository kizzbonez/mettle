---
title: Writing Data Out
summary: Save results with `to_csv` and `to_json`, control the index, number and date formats, missing values and encoding, hand data to plain Python and NumPy with `to_dict` and `to_numpy`, and know what a CSV round trip loses and how to restore it.
minutes: 30
objectives:
  - Write a DataFrame to CSV with the right `index`, `float_format`, `date_format`, `na_rep` and `encoding`
  - Write JSON records and JSON Lines with `to_json`, with ISO dates
  - Convert a frame or column to Python dicts and NumPy arrays with `to_dict` and `to_numpy`
  - List what a CSV round trip loses (dtypes, the index) and read the file back to the same frame
---

## Outline

1. `to_csv`
2. Formatting what is written
3. What a CSV round trip loses
4. `to_json`
5. `to_dict` and `to_numpy`

## `to_csv`

A small museum counts visitors and takings per room each day. After the lessons so far, a frame like
this one, with a meaningful index and chosen dtypes, is typical:

```python
import io

import pandas as pd

visits_csv = """room,day,gallery,visitors,takings
F1,2026-05-01,Fossils,412,2061.5
M1,2026-05-01,Maps,,0
F2,2026-05-02,Fossils,389,1945.25
"""
visits = pd.read_csv(
    io.StringIO(visits_csv),
    index_col="room",
    parse_dates=["day"],
    dtype={"gallery": "category", "visitors": "Int64"},
)
print(visits)
print(visits.to_csv())
```

```text
            day  gallery  visitors  takings
room                                       
F1   2026-05-01  Fossils       412  2061.50
M1   2026-05-01     Maps      <NA>     0.00
F2   2026-05-02  Fossils       389  1945.25
room,day,gallery,visitors,takings
F1,2026-05-01,Fossils,412,2061.5
M1,2026-05-01,Maps,,0.0
F2,2026-05-02,Fossils,389,1945.25

```

`to_csv(path)` writes a file; with no path it **returns** the text, which is handy for looking at
the result, as here. By default it writes the header, the index as the first column (`room`), and
an empty field for a missing value. The file is UTF-8.

## Formatting what is written

The options mirror those of `read_csv`:

```python
print(visits.to_csv(index=False, float_format="%.2f", date_format="%d/%m/%Y", na_rep="NA"))
```

```text
day,gallery,visitors,takings
01/05/2026,Fossils,412,2061.50
01/05/2026,Maps,NA,0.00
02/05/2026,Fossils,389,1945.25

```

- `index=False` leaves the index out. Use it whenever the index is just row numbers 0, 1, 2:
  otherwise every file gains a useless first column.
- `float_format="%.2f"` writes every float with two decimals, in the `%` formatting codes of
  Python strings. It changes only the text; the frame keeps its full precision.
- `date_format` uses the same `strftime` codes as `read_csv`'s `date_format`.
- `na_rep` is the text for missing values. Choose one the reader of the file understands.

Two more for other readers: `sep=";", decimal=","` writes the European style from lesson 2, and
`encoding="utf-8-sig"` adds a byte-order mark, three bytes at the start of the file that Excel
uses to recognise a CSV file as UTF-8, so accents survive. Write files with `index=False` and these options from the
start; fixing a shared file later is harder than writing it right.

## What a CSV round trip loses

A CSV file holds only text. Write `visits` and read it back with no options:

```python
visits.to_csv("visits.csv")
back = pd.read_csv("visits.csv")
print(back.dtypes)
print(back.index)
```

```text
room            str
day             str
gallery         str
visitors    float64
takings     float64
dtype: object
RangeIndex(start=0, stop=3, step=1)
```

Everything that was not text in the file is gone:

- `day` was `datetime64[us]` and is now `str`: CSV has no date type.
- `gallery` was a categorical and is now `str`: the categories (and an order, if any) are gone.
- `visitors` was `Int64` and is now `float64`, because of the gap.
- The index is an ordinary `room` column, and a new RangeIndex took its place. Had the index had no
  name, the column would be called `Unnamed: 0`.

Restore it with the reading options you already know, and check with `equals`, which compares
values, dtypes and labels:

```python
restored = pd.read_csv(
    "visits.csv",
    index_col="room",
    parse_dates=["day"],
    dtype={"gallery": "category", "visitors": "Int64"},
)
print(restored.equals(visits))
```

```text
True
```

Keep the reading options next to the code that writes the file, or in one function used by both
sides. The professional level shows Parquet, a file format that stores dtypes and needs none of
this.

## `to_json`

`to_json` writes the same orients `read_json` reads. **records** is the usual choice for other
programs, and `lines=True` with `orient="records"` writes JSON Lines. Pass `date_format="iso"`:

```python
print(visits.to_json(orient="records", date_format="iso"))
print(visits.reset_index().to_json(orient="records", lines=True, date_format="iso"))
```

```text
[{"day":"2026-05-01T00:00:00.000","gallery":"Fossils","visitors":412,"takings":2061.5},{"day":"2026-05-01T00:00:00.000","gallery":"Maps","visitors":null,"takings":0.0},{"day":"2026-05-02T00:00:00.000","gallery":"Fossils","visitors":389,"takings":1945.25}]
{"room":"F1","day":"2026-05-01T00:00:00.000","gallery":"Fossils","visitors":412,"takings":2061.5}
{"room":"M1","day":"2026-05-01T00:00:00.000","gallery":"Maps","visitors":null,"takings":0.0}
{"room":"F2","day":"2026-05-02T00:00:00.000","gallery":"Fossils","visitors":389,"takings":1945.25}

```

- Missing values became JSON `null`.
- `records` does not write the index, so the first call lost the room codes. `reset_index()` first
  makes `room` an ordinary column that is written. `orient="split"` keeps the index separately.
- Without `date_format="iso"`, dates are written as milliseconds since 1970 (`1777593600000`), and
  pandas 3 warns: `Pandas4Warning: The default 'epoch' date format is deprecated and will be
  removed in a future version, please use 'iso' date format instead.`

## `to_dict` and `to_numpy`

To hand data to plain Python code, such as a template or a web framework, use `to_dict`. For NumPy
functions, use `to_numpy`:

```python
print(visits["takings"].to_dict())
print(visits.reset_index().to_dict(orient="records")[0])
print(visits.to_dict(orient="list")["visitors"])
print(repr(visits["visitors"].to_numpy()))
```

```text
{'F1': 2061.5, 'M1': 0.0, 'F2': 1945.25}
{'room': 'F1', 'day': Timestamp('2026-05-01 00:00:00'), 'gallery': 'Fossils', 'visitors': 412, 'takings': 2061.5}
[412, None, 389]
array([412.,  nan, 389.])
```

- A Series becomes `{label: value}`. `orient="records"` gives a list of row dicts, the inverse of
  building a frame from records in lesson 1; `orient="list"` gives `{column: [values]}`.
- Values come out as Python objects: numbers, `None` for `<NA>`, and pandas `Timestamp` objects
  for dates.
- `to_numpy()` on an `Int64` column with a gap gives a `float64` array with NaN, since a NumPy
  integer array cannot hold a gap. On several columns of different types it gives one array of
  dtype `object`, which loses NumPy's speed; select the numeric columns first.

## Common mistakes

- **Forgetting `index=False`.** Each round trip adds an `Unnamed: 0` column, and the files fill up
  with old row numbers.
- **Assuming dtypes survive a CSV.** Dates, categories and nullable integers come back as text or
  floats. Read the file back with `parse_dates`, `dtype` and `index_col`.
- **Writing into a folder that does not exist.** `visits.to_csv("reports/visits.csv")` raises
  `OSError: Cannot save file into a non-existent directory: 'reports'`. Create it first with
  `Path("reports").mkdir(exist_ok=True)`.
- **JSON records without the index.** If the index carries information, `reset_index()` first.
- **Epoch dates in JSON.** Pass `date_format="iso"`; readers will thank you.

## Practice

1. Write `visits` to a CSV text without the index, with missing values as `0`.
2. Write `visits` as JSON Lines with the room code and ISO dates, then read it back with
   `read_json(..., lines=True)`. Which columns lost their dtype?
3. Give the list of takings as a plain Python list, then as a NumPy array.

### Answers

```python
print(visits.to_csv(index=False, na_rep="0"))
visits.reset_index().to_json("visits.jsonl", orient="records", lines=True, date_format="iso")
print(pd.read_json("visits.jsonl", lines=True).dtypes)
print(visits["takings"].tolist(), visits["takings"].to_numpy())
```

```text
day,gallery,visitors,takings
2026-05-01,Fossils,412,2061.5
2026-05-01,Maps,0,0.0
2026-05-02,Fossils,389,1945.25

room            str
day             str
gallery         str
visitors    float64
takings     float64
dtype: object
[2061.5, 0.0, 1945.25] [2061.5     0.   1945.25]
```

JSON loses the same things as CSV here. `day` stays text because `read_json` only converts columns whose names look
like dates (lesson 2); pass `convert_dates=["day"]`. `gallery` and `visitors` need `dtype`.

## Key takeaways

- `to_csv` writes the index by default; pass `index=False` unless the index carries data.
- `float_format`, `date_format`, `na_rep`, `sep`, `decimal` and `encoding` shape the text written.
- A CSV keeps only text: dtypes and the index must be restored with `read_csv` options.
- `to_json(orient="records", lines=True, date_format="iso")` writes JSON Lines; `records` drops the
  index.
- `to_dict` gives Python structures; `to_numpy` gives an array (float with NaN for gaps).

## Further reading

- [pandas.DataFrame.to_csv](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_csv.html)
- [pandas.DataFrame.to_json](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_json.html)
- [pandas.DataFrame.to_dict](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_dict.html)
- [pandas user guide: IO tools](https://pandas.pydata.org/docs/user_guide/io.html)
