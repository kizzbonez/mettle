---
title: Memory and Large Datasets
summary: Work with data that strains or exceeds memory. Measure a frame with `memory_usage(deep=True)`, shrink it with downcast numbers, categoricals and real datetimes, read only the columns and types you need, and process a file too big to load in chunks, aggregating as you go.
minutes: 40
objectives:
  - Measure how much memory a DataFrame and each of its columns use
  - Shrink a frame with `pd.to_numeric(downcast=...)`, `category` and parsed datetimes, and know when a categorical does not help
  - Read less with `usecols` and `dtype` at read time
  - Process a large CSV with `chunksize`, combining per-chunk results correctly
---

## Outline

1. How big is a DataFrame?
2. Smaller types: downcasting, categoricals and datetimes
3. Read less: `usecols` and `dtype`
4. Files bigger than memory: `chunksize`
5. The pandas guide to scaling

## How big is a DataFrame?

pandas holds the whole frame in memory, and operations make temporary copies, so a frame that
takes a third of your RAM can already fail. A city's transit cards produce one row per tap at a
station gate. This script writes half a million taps to `taps.csv`, about 24 MB of text:

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 500_000
stations = [f"Station {number:02d}" for number in range(40)]
taps = pd.DataFrame({
    "card_id": rng.integers(1_000_000, 1_400_000, n),
    "station": rng.choice(stations, n),
    "line": rng.choice(["Red", "Blue", "Green", "Amber", "Violet", "Teal"], n),
    "fare_pence": rng.choice([150, 180, 220, 260, 310], n),
    "tapped_at": pd.Timestamp("2026-04-01 05:00") + pd.to_timedelta(rng.integers(0, 30 * 86400, n), unit="s"),
})
taps.to_csv("taps.csv", index=False)
```

Read back with the defaults, it looks like this:

```python
taps = pd.read_csv("taps.csv")
before = taps.memory_usage(deep=True)
print(taps.head(3))
print(f"{before.sum() / 1e6:.1f} MB")
```

```text
   card_id     station    line  fare_pence            tapped_at
0  1035700  Station 34   Amber         260  2026-04-22 10:15:23
1  1309582  Station 09    Teal         220  2026-04-15 03:29:50
2  1261828  Station 05  Violet         180  2026-04-12 17:55:47
36.8 MB
```

`memory_usage` returns the bytes of each column (and the index) as a Series. `deep=True` asks
pandas to count the text itself, not just the pointers to it. In pandas 3 the default `str`
dtype keeps text in compact Arrow buffers, which `memory_usage` measures fully either way, but a
column of Python objects (`object` dtype, for mixed data) would be undercounted by about seven
times here without `deep=True`, so always pass it. `df.info(memory_usage="deep")` prints the
same total with the dtypes.

## Smaller types: downcasting, categoricals and datetimes

Every column here is stored in a wider type than it needs:

- `pd.to_numeric(column, downcast="integer")` picks the smallest signed integer type that holds
  every value (`"unsigned"` for unsigned types, `"float"` for `float32`). Fares up to 310 fit an
  `int16`; card numbers up to 1.4 million fit a `uint32`.
- A **categorical** stores each distinct value once and a small integer code per row. Forty
  station names repeated half a million times are the ideal case.
- Timestamps read from CSV arrive as text, 27 bytes a row. A `datetime64` is 8 bytes and supports
  date arithmetic.

```python
small = taps.assign(
    card_id=pd.to_numeric(taps["card_id"], downcast="unsigned"),
    station=taps["station"].astype("category"),
    line=taps["line"].astype("category"),
    fare_pence=pd.to_numeric(taps["fare_pence"], downcast="integer"),
    tapped_at=pd.to_datetime(taps["tapped_at"], format="%Y-%m-%d %H:%M:%S"),
)
after = small.memory_usage(deep=True)
print(pd.DataFrame({"before": before, "after": after, "dtype": small.dtypes}).loc[taps.columns])
print(f"{before.sum() / 1e6:.1f} MB -> {after.sum() / 1e6:.1f} MB")
print(taps["card_id"].nunique(), taps["card_id"].astype("category").memory_usage(deep=True))
```

```text
              before    after           dtype
card_id      4000000  2000000          uint32
station      9000000   500725        category
line         6250071   500076        category
fare_pence   4000000  1000000           int16
tapped_at   13500000  4000000  datetime64[us]
36.8 MB -> 8.0 MB
285288 4282436
```

The frame shrank from 36.8 MB to 8.0 MB, a 78% saving, with the same information. Each category
code is one byte here because there are fewer than 128 categories. The last line is the
counter-example: 285,288 different card numbers as a category take **more** room than the
original `int64`, because each distinct value is stored once plus a code per row. Categoricals
pay off when the number of distinct values is small compared with the number of rows.

Small types have limits. An `int16` holds at most 32,767. pandas' `sum` and `mean` work in 64
bits, so `pd.Series([30_000, 30_000], dtype="int16").sum()` is 60000, but element-wise arithmetic
keeps the small type: adding that Series to itself gives `[-5536, -5536]` without any warning
(lesson 6). `float32` keeps only about seven significant digits. Downcast for storage, and cast
back up before calculating with columns that might grow.

## Read less: `usecols` and `dtype`

Shrinking after reading still needs the full frame in memory first. `read_csv` can do both at
once: `usecols` parses only the columns you name, and `dtype` gives their types as they are read,
so the wide version never exists:

```python
fares = pd.read_csv(
    "taps.csv",
    usecols=["station", "fare_pence"],
    dtype={"station": "category", "fare_pence": "int16"},
)
print(fares.dtypes)
print(f"{fares.memory_usage(deep=True).sum() / 1e6:.1f} MB")
```

```text
station       category
fare_pence       int16
dtype: object
1.5 MB
```

1.5 MB instead of 36.8 MB, for an analysis that needs only two columns. The pandas docs note that
`usecols` also makes parsing faster with the default C parser. Choosing the types up front has a
second benefit: if a value does not fit (`"n/a"` in an `int16` column), the read fails loudly
instead of quietly producing a text column.

## Files bigger than memory: `chunksize`

When even the needed columns do not fit, read the file in pieces. With `chunksize=N`, `read_csv`
returns a `TextFileReader` instead of a DataFrame; used in a `with` statement and iterated, it
yields DataFrames of up to `N` rows, one at a time, and closes the file at the end. You keep only
a small running result:

```python
fares = pd.Series(dtype="int64")
riders = pd.Series(dtype="int64")
chunks = 0
with pd.read_csv("taps.csv", chunksize=100_000, usecols=["line", "fare_pence"]) as reader:
    for chunk in reader:
        chunks += 1
        by_line = chunk.groupby("line")["fare_pence"]
        fares = fares.add(by_line.sum(), fill_value=0)
        riders = riders.add(by_line.size(), fill_value=0)
summary = pd.DataFrame({"taps": riders, "revenue": fares, "mean_fare": fares / riders})
summary = summary.astype({"taps": "int64", "revenue": "int64"})
print(chunks, "chunks")
print(summary.round(2))
whole = pd.read_csv("taps.csv").groupby("line")["fare_pence"].mean()
print((summary["mean_fare"] - whole).abs().max())
```

```text
5 chunks
         taps   revenue  mean_fare
line                              
Amber   83803  18764410     223.91
Blue    83117  18645300     224.33
Green   83649  18752350     224.18
Red     83303  18641720     223.78
Teal    83167  18625820     223.96
Violet  82961  18596370     224.16
0.0
```

Peak memory is one chunk plus two small Series. `Series.add(other, fill_value=0)` aligns on the
line names and treats a line missing from one side as 0, so a line that appears only in some
chunks is still counted. The mean is computed **at the end** from the summed revenue and counts;
the last line confirms it matches reading the whole file. This works for any aggregation that
can be built from parts: sums, counts, minimums, maximums, and means as sum over count. Medians
and distinct counts cannot be combined this way.

## The pandas guide to scaling

The pandas user guide's page on scaling to large datasets gives the same advice in this order:
load less data (only the columns you need), use efficient dtypes, and process in chunks. Its
fourth step is to move to a library built for out-of-core or parallel work when the analysis
outgrows chunking. Lesson 5 adds one more tool: Parquet files, which can read a few columns
without parsing the rest.

## Common mistakes

- **Measuring without `deep=True`.** An `object` column then reports only its pointers.
- **Categories for unique values.** IDs, timestamps and free text get bigger as categoricals.
- **Averaging chunk means.** Chunks hold different numbers of rows per group, so the mean of
  means is wrong. Sum and count per chunk, divide once.
- **Concatenating every chunk.** `pd.concat(list(reader))` rebuilds the whole frame and defeats
  the purpose. Reduce each chunk before moving on.
- **Downcasting before arithmetic.** `int8` and `float32` columns can overflow or lose digits in
  calculations; downcast for storage.

## Practice

1. Which columns of a frame of 2 million survey answers would you make categorical: respondent
   id, country (190 values), answer text, rating (1 to 5)?
2. Read only `card_id` and `tapped_at` from `taps.csv`, with `card_id` as `uint32`.
3. Using chunks, find the busiest station (most taps).

### Answers

```python
cards = pd.read_csv("taps.csv", usecols=["card_id", "tapped_at"], dtype={"card_id": "uint32"})
counts = pd.Series(dtype="int64")
with pd.read_csv("taps.csv", chunksize=100_000, usecols=["station"]) as reader:
    for chunk in reader:
        counts = counts.add(chunk["station"].value_counts(), fill_value=0)
print(counts.idxmax(), int(counts.max()))
```

```text
Station 04 12746
```

1. Country and rating: few distinct values over many rows. Respondent id and free text are
   nearly unique, so a categorical would grow them.
2. `dtype` applies while reading, so the `int64` version never exists.
3. Counting is a sum, so per-chunk `value_counts` add up exactly.

## Key takeaways

- Measure with `memory_usage(deep=True)` before optimising.
- Downcast integers and floats, make low-cardinality text categorical, and parse datetimes.
- Pass `usecols` and `dtype` to `read_csv` so wide data is never built.
- With `chunksize`, reduce each chunk to a small result and combine sums and counts at the end.

## Further reading

- [pandas: Scaling to large datasets](https://pandas.pydata.org/docs/user_guide/scale.html)
- [pandas: DataFrame.memory_usage](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.memory_usage.html)
- [pandas: to_numeric](https://pandas.pydata.org/docs/reference/api/pandas.to_numeric.html)
- [pandas IO tools: iterating through files chunk by chunk](https://pandas.pydata.org/docs/user_guide/io.html#iterating-through-files-chunk-by-chunk)
