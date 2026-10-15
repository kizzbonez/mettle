---
title: Parquet and Arrow
summary: Store data in Parquet, the columnar file format that keeps dtypes and reads only what you ask for. Write and read it with pyarrow, select columns and filter rows at read time, choose a compression, write partitioned datasets, and move between pandas and Arrow tables, including `DataFrame.from_arrow` from pandas 3.0.
minutes: 40
objectives:
  - Explain what a columnar file is and what CSV loses that Parquet keeps
  - Write and read Parquet with `to_parquet` and `read_parquet`, using `columns`, `filters` and `compression`
  - Write and read a dataset partitioned by a column with `partition_cols`
  - Read Parquet into Arrow-backed dtypes and convert between Arrow tables and DataFrames
---

## Outline

1. Why a columnar file
2. What survives a round trip
3. Reading less: `columns` and `filters`
4. Compression and file size
5. Partitioned datasets
6. Arrow tables and `dtype_backend="pyarrow"`

## Why a columnar file

A CSV file stores rows: to read one column, a program must parse every line. **Parquet** is an
open file format designed for analysis that stores each **column** together, in blocks of rows
called **row groups**, with the column's type and statistics (minimum, maximum, null count)
written alongside. That layout lets a reader take only the columns it needs and skip blocks whose
statistics rule them out, and storing similar values next to each other makes compression work
well.

pandas reads and writes Parquet through an **engine**; with `pyarrow` installed (version 26 in
the sandbox) it is used automatically. **Apache Arrow** is the in-memory columnar format that
pyarrow implements; pandas 3 already uses it for the `str` dtype.

## What survives a round trip

Weather stations report observations with a station name, a time zone, gaps and a nullable
integer. Writing them to CSV and to Parquet and reading both back shows the difference:

```python
import numpy as np
import pandas as pd

obs = pd.DataFrame({
    "station": pd.Categorical(["Bergen", "Tromsø", "Bergen"]),
    "time": pd.to_datetime(["2026-01-10 06:00", "2026-01-10 06:00", "2026-01-10 07:00"]).tz_localize("Europe/Oslo"),
    "temp_c": [3.4, -11.2, 3.9],
    "rain_mm": [1.2, np.nan, 0.0],
    "gust_kph": pd.array([41, None, 38], dtype="Int64"),
    "checked": [True, False, True],
})
obs.to_csv("obs.csv", index=False)
obs.to_parquet("obs.parquet")
from_csv = pd.read_csv("obs.csv")
from_parquet = pd.read_parquet("obs.parquet")
print(pd.DataFrame({"original": obs.dtypes, "csv": from_csv.dtypes, "parquet": from_parquet.dtypes}))
print(from_parquet.equals(obs))
```

```text
                             original      csv                      parquet
station                      category      str                     category
time      datetime64[us, Europe/Oslo]      str  datetime64[us, Europe/Oslo]
temp_c                        float64  float64                      float64
rain_mm                       float64  float64                      float64
gust_kph                        Int64  float64                        Int64
checked                          bool     bool                         bool
True
```

CSV is text, so every type has to be guessed again on reading: the categorical came back as
plain text, the time zone and the datetime type were lost, and the nullable integer became a
float because of its gap. Parquet stores pandas' dtypes in the file, so the frame comes back
equal, including the index. A default `RangeIndex` is stored as a little metadata; any other
index is written as a column and restored. Pass `index=False` to leave the index out, which other
tools reading the file will thank you for. Parquet refuses columns of arbitrary Python objects
and requires string column names.

## Reading less: `columns` and `filters`

A year of hourly observations from five stations, `hourly`, makes 43,800 rows. `columns` reads only the
named columns. `filters` keeps only rows matching conditions written as `(column, operator,
value)` tuples, with operators `==`, `!=`, `<`, `<=`, `>`, `>=`, `in` and `not in`:

```python
rng = np.random.default_rng(3)
stations = ["Bergen", "Bodø", "Oslo", "Stavanger", "Tromsø"]
hours = pd.date_range("2025-01-01", periods=24 * 365, freq="h")
hourly = pd.DataFrame({
    "station": pd.Categorical(np.repeat(stations, len(hours))),
    "time": np.tile(hours, len(stations)),
    "temp_c": rng.normal(6, 7, len(stations) * len(hours)).round(1),
    "rain_mm": rng.exponential(0.4, len(stations) * len(hours)).round(1),
})
hourly.to_parquet("hourly.parquet")
wet = pd.read_parquet(
    "hourly.parquet",
    columns=["station", "time", "rain_mm"],
    filters=[("station", "in", ["Bergen", "Oslo"]), ("rain_mm", ">=", 3.0)],
)
print(wet.shape)
print(wet.head(3))
```

```text
(6, 3)
  station                time  rain_mm
0  Bergen 2025-05-08 21:00:00      3.6
1  Bergen 2025-05-22 20:00:00      3.3
2  Bergen 2025-07-29 09:00:00      3.1
```

The tuples in one list are combined with **and**. For **or**, pass a list of such lists:
`[[("station", "==", "Tromsø"), ("temp_c", "<", -15)], [("temp_c", ">", 27)]]` means "Tromsø
below -15, or anywhere above 27". With the pyarrow engine the filter is applied row by row, and
whole row groups whose statistics cannot match are never decoded.

## Compression and file size

Parquet compresses each column. pyarrow uses **Snappy** by default, which is fast; `gzip` and
`zstd` make smaller files at more CPU cost, and `None` turns compression off:

```python
import os

hourly.to_csv("hourly.csv", index=False)
print(f"{len(hourly)} rows; csv {os.path.getsize('hourly.csv') / 1e6:.2f} MB")
for codec in ["snappy", "gzip", "zstd", None]:
    hourly.to_parquet(f"hourly-{codec}.parquet", compression=codec)
    print(f"{str(codec):7} {os.path.getsize(f'hourly-{codec}.parquet') / 1e6:.2f} MB")
```

```text
43800 rows; csv 1.56 MB
snappy  0.21 MB
gzip    0.16 MB
zstd    0.17 MB
None    0.24 MB
```

Even uncompressed, the Parquet file is a sixth of the CSV: the five station names are stored once
in a dictionary with small codes, and numbers are stored in binary instead of as text. The
default Snappy is a good choice unless storage or transfer cost matters more than speed.

## Partitioned datasets

`partition_cols` splits a frame into a folder tree with one subfolder per value of the given
columns, named `column=value` (the **Hive** layout many tools understand). Reading the folder
reassembles the dataset, and a filter on the partition column skips whole folders:

```python
hourly.to_parquet("by_station", partition_cols=["station"])
for folder, _, files in sorted(os.walk("by_station")):
    print(folder, len(files), "file(s)")
oslo = pd.read_parquet("by_station", filters=[("station", "==", "Oslo")])
print(oslo.shape, oslo["station"].dtype)
```

```text
by_station 0 file(s)
by_station/station=Bergen 1 file(s)
by_station/station=Bod%C3%B8 1 file(s)
by_station/station=Oslo 1 file(s)
by_station/station=Stavanger 1 file(s)
by_station/station=Troms%C3%B8 1 file(s)
(8760, 4) category
```

The partition column lives in the folder names, not inside the files, so it comes back as a
`category` placed after the other columns, and characters such as `ø` are percent-encoded in the
folder name. Partition by a column you often filter on that has few values (station, year,
month); partitioning by a column with thousands of values creates thousands of tiny files.
Writing again into the same folder adds files beside the old ones, so delete the folder first
when you mean to replace it.

## Arrow tables and `dtype_backend="pyarrow"`

By default `read_parquet` converts to the usual NumPy-backed dtypes. `dtype_backend="pyarrow"`
keeps every column in Arrow form instead, where missing values are a real null in every type.
`pyarrow.parquet.read_table` returns a pyarrow `Table`, the Arrow equivalent of a DataFrame, and
`pd.DataFrame.from_arrow`, new in pandas 3.0, turns any Arrow-compatible table into a DataFrame:

```python
import pyarrow.parquet as pq

obs.to_parquet("obs.parquet")  # the three observations of the first example
print(pd.read_parquet("obs.parquet", dtype_backend="pyarrow").dtypes)
table = pq.read_table("obs.parquet", columns=["station", "temp_c", "gust_kph"])
print(type(table).__name__, table.num_rows)
print(pd.DataFrame.from_arrow(table))
```

```text
station     dictionary<values=string, indices=int8, ordere...
time                   timestamp[us, tz=Europe/Oslo][pyarrow]
temp_c                                        double[pyarrow]
rain_mm                                       double[pyarrow]
gust_kph                                       int64[pyarrow]
checked                                         bool[pyarrow]
dtype: object
Table 3
  station  temp_c  gust_kph
0  Bergen     3.4        41
1  Tromsø   -11.2      <NA>
2  Bergen     3.9        38
```

You need the Arrow form when another Arrow-based tool hands you a table, or when you want nulls
in every column type. For everyday pandas work the default dtypes are fine.

## Common mistakes

- **Keeping CSV as the storage format between steps.** Every read guesses the types again; store
  intermediate results in Parquet.
- **Reading everything, then selecting.** `pd.read_parquet(path)[["a", "b"]]` decodes every
  column first; pass `columns=`.
- **Writing a meaningless index.** After filtering, the index has gaps, so it is written as an
  extra column, `__index_level_0__`. Use `index=False` or `reset_index(drop=True)` first.
- **Partitioning by a high-cardinality column.** One folder per customer id makes reading slow.
- **Expecting `filters` to accept pandas expressions.** It takes tuples, not `"temp_c > 27"`.

## Practice

1. Read only `station` and `temp_c` for Tromsø from `hourly.parquet`.
2. Why does `gust_kph` come back from CSV as `float64`?
3. You will often load one month of a ten-year sensor archive. How would you partition it?

### Answers

```python
cold = pd.read_parquet("hourly.parquet", columns=["station", "temp_c"], filters=[("station", "==", "Tromsø")])
print(cold.shape)
```

```text
(8760, 2)
```

1. `columns` and `filters` together read the least data.
2. The CSV has an empty field; `read_csv` reads a gap in an integer column as NaN, which only a
   float column can hold, unless you ask for `dtype={"gust_kph": "Int64"}`.
3. Add `year` and `month` columns and pass `partition_cols=["year", "month"]`, then filter on
   both: about 120 folders, each read on its own.

## Key takeaways

- Parquet stores columns with their types, so dtypes, categoricals, time zones and nullable
  integers survive; CSV loses them.
- `columns=` and `filters=` read only what you need; filters are tuples, combined with and,
  and lists of lists for or.
- Snappy is the default compression; `gzip` and `zstd` trade speed for size.
- `partition_cols` writes a `column=value` folder tree; filter on it to skip folders.
- `dtype_backend="pyarrow"`, `pq.read_table` and `DataFrame.from_arrow` move between pandas and Arrow.

## Further reading

- [pandas IO tools: Parquet](https://pandas.pydata.org/docs/user_guide/io.html#parquet)
- [pandas: read_parquet](https://pandas.pydata.org/docs/reference/api/pandas.read_parquet.html)
- [Apache Arrow: Reading and writing Parquet files](https://arrow.apache.org/docs/python/parquet.html)
- [pandas: DataFrame.from_arrow](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.from_arrow.html)
