---
title: Performance and Vectorization
summary: Make slow pandas code fast by measuring first. Time code with `timeit`, find the hot spot with `cProfile`, replace row loops and `apply` with column operations, drop to NumPy with `to_numpy` where pandas' overhead shows, and look values up through an index or `map` instead of scanning or merging.
minutes: 40
objectives:
  - Time pandas code fairly with `timeit` and find where the time goes with `cProfile`
  - Replace `iterrows`, `itertuples` and `apply(axis=1)` with vectorised column operations
  - Use `to_numpy` when pandas' per-call overhead dominates small, repeated operations
  - Choose between a boolean scan, an index lookup, `map` and `merge` for lookups, and know when `eval` and `query` help
---

## Outline

1. Measure before you optimise
2. Row loops against column operations
3. Finding the hot spot with `cProfile`
4. NumPy under pandas: `to_numpy`
5. Fast lookups and the right join
6. `eval` and `query`

## Measure before you optimise

Slow data code is usually slow in one place, and rarely the place you would guess. Work in this
order: make the code correct (with tests, lesson 2), measure, change the slow part, and measure
again. The standard library's `timeit` module runs a statement many times and reports the total;
`timeit.repeat` does that several times, and you keep the **minimum**, because larger values
come from other programs disturbing the measurement, not from your code. Passing
`globals=globals()` lets the statement use your variables.

Every timing in this lesson was measured in the course sandbox. Yours will differ: compare the
ratios, not the milliseconds.

## Row loops against column operations

A ride-hailing company prices each trip at 2.50 plus 1.20 per kilometre and 0.30 per minute,
times 1.5 between 07:00 and 09:59. Here are four ways to price 50,000 trips:

```python
import timeit

import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 50_000
trips = pd.DataFrame({
    "km": rng.uniform(0.5, 25, n).round(1),
    "minutes": rng.integers(3, 60, n),
    "hour": rng.integers(0, 24, n),
})


def fare_row(row):
    fare = 2.50 + 1.20 * row["km"] + 0.30 * row["minutes"]
    if 7 <= row["hour"] <= 9:
        fare *= 1.5
    return round(fare, 2)


def fares_iterrows(df):
    return pd.Series([fare_row(row) for _, row in df.iterrows()], index=df.index)


def fares_apply(df):
    return df.apply(fare_row, axis=1)


def fares_itertuples(df):
    fares = []
    for trip in df.itertuples(index=False):
        fare = 2.50 + 1.20 * trip.km + 0.30 * trip.minutes
        fares.append(round(fare * 1.5 if 7 <= trip.hour <= 9 else fare, 2))
    return pd.Series(fares, index=df.index)


def fares_vectorised(df):
    fare = 2.50 + 1.20 * df["km"] + 0.30 * df["minutes"]
    surge = df["hour"].between(7, 9)
    return fare.where(~surge, fare * 1.5).round(2)


for name in ["fares_iterrows", "fares_apply", "fares_itertuples", "fares_vectorised"]:
    number = 100 if name == "fares_vectorised" else 1
    best = min(timeit.repeat(f"{name}(trips)", number=number, repeat=3, globals=globals())) / number
    print(f"{name:18} {best * 1000:9.2f} ms")
print(fares_vectorised(trips).equals(fares_apply(trips)))
```

```text
fares_iterrows       1759.19 ms
fares_apply           657.39 ms
fares_itertuples       55.02 ms
fares_vectorised        1.07 ms
True
```

All four give the same fares; the vectorised one is about 600 times faster than `apply` and 1,600
times faster than `iterrows`. The reason is the same as in NumPy: a column operation runs one
loop in compiled code over a block of numbers, while a row loop runs Python code for every row.
`iterrows` is worst because it builds a new Series for each row. `apply(axis=1)` does much the
same. `itertuples` builds light named tuples, so it is the least bad loop when you truly need
one. The `if` became a boolean mask and `where`: keep the plain fare where there is no surge,
use `fare * 1.5` elsewhere. For more than two cases, `np.select` takes a list of conditions.

## Finding the hot spot with `cProfile`

`timeit` tells you how long; a **profiler** tells you where. `cProfile` records every function
call and how long it took (in Python 3.15 it is an alias of the new `profiling.tracing` module).
Its `Profile` works as a context manager, and the `pstats` module sorts and prints the results:

```python
import cProfile
import pstats

with cProfile.Profile() as profiler:
    trips.apply(fare_row, axis=1)
stats = pstats.Stats(profiler).strip_dirs().sort_stats("tottime")
stats.print_stats(5)
```

```text
         2800635 function calls (2800584 primitive calls) in 1.582 seconds

   Ordered by: internal time
   List reduced from 208 to 5 due to restriction <5>

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
    50000    0.267    0.000    0.267    0.000 {built-in method builtins.round}
   150000    0.180    0.000    0.876    0.000 series.py:945(__getitem__)
   150000    0.158    0.000    0.395    0.000 series.py:1029(_get_value)
   950123    0.148    0.000    0.192    0.000 {built-in method builtins.isinstance}
   150000    0.122    0.000    0.156    0.000 base.py:3601(get_loc)
```

`ncalls` is how often a function ran, `tottime` the time inside it alone, and `cumtime` the time
including what it called. 2.8 million calls to price 50,000 trips is the story: three
`row["..."]` lookups per row became 150,000 calls to `Series.__getitem__`, each doing index work.
The profiler slows the code down (1.6 s instead of 0.66 s), so use it to find the hot spot and
`timeit` to measure the fix.

## NumPy under pandas: `to_numpy`

Each pandas operation does some bookkeeping before the arithmetic: checking dtypes, aligning
indexes, building a result with an index. On a large column that cost disappears in the work. On
small pieces processed many times, it dominates. `to_numpy()` returns the values as a NumPy array,
usually without copying, so the hot loop can skip pandas:

```python
waits = pd.Series(np.arange(100.0))
array = waits.to_numpy()
for label, stmt in [("Series.sum", "waits.sum()"), ("ndarray.sum", "array.sum()")]:
    best = min(timeit.repeat(stmt, number=10_000, repeat=5, globals=globals())) / 10_000
    print(f"{label:12} {best * 1e6:6.2f} µs per call")
print(type(array), array.dtype, np.shares_memory(array, waits))
```

```text
Series.sum    10.81 µs per call
ndarray.sum    0.64 µs per call
<class 'numpy.ndarray'> float64 True
```

On 100 values the array is 17 times faster per call; on a million values the difference would
vanish. Reach for `to_numpy` inside code that is called thousands of times, and remember that
plain arrays do not align by index: you take over that responsibility.

## Fast lookups and the right join

Two lookups come up constantly: adding a column from a table keyed by an id, and fetching single
values by key. With 200,000 trips and 5,000 drivers:

```python
rng = np.random.default_rng(11)
drivers = pd.DataFrame({"driver_id": np.arange(5_000), "rating": rng.uniform(3, 5, 5_000).round(2)})
trips = pd.DataFrame({"driver_id": rng.integers(0, 5_000, 200_000), "km": rng.uniform(0.5, 25, 200_000)})
rating_by_id = drivers.set_index("driver_id")["rating"]


def with_merge():
    return trips.merge(drivers, on="driver_id", how="left", validate="many_to_one")


def with_map():
    return trips.assign(rating=trips["driver_id"].map(rating_by_id))


wanted = rng.integers(0, 5_000, 1_000)


def scan_lookups():
    return [drivers.loc[drivers["driver_id"] == key, "rating"].iloc[0] for key in wanted]


def index_lookups():
    return [rating_by_id.loc[key] for key in wanted]


for name in ["with_merge", "with_map", "scan_lookups", "index_lookups"]:
    best = min(timeit.repeat(f"{name}()", number=3, repeat=3, globals=globals())) / 3
    print(f"{name:14} {best * 1000:8.2f} ms")
```

```text
with_merge        26.95 ms
with_map           7.22 ms
scan_lookups     259.35 ms
index_lookups      4.75 ms
```

- To add **one** column from a table with unique keys, `map` with a Series indexed by the key is
  about four times faster than `merge` here. Use `merge` when you need several columns, and
  always with `validate=` so a duplicated key fails instead of multiplying rows.
- A boolean mask scans every row for every key. An index is a hash table for unique labels, so
  `.loc[key]` finds one value without scanning: 55 times faster for 1,000 lookups. Set the index
  once and reuse it.
- A **sorted** index (`sort_index()`, check with `index.is_monotonic_increasing`) also lets
  `loc` slice ranges, such as a week of a DatetimeIndex, by binary search instead of a mask.

## `eval` and `query`

`df.eval("1.20 * km + 0.30 * minutes")` and `df.query("hour >= 7 and hour <= 9")` take an
expression as a string. They help speed only with the optional `numexpr` package installed and
large frames: the pandas guide's rule of thumb is more than 10,000 rows for `eval`, and about
100,000 for `numexpr` to pay off. The sandbox has no `numexpr`, so here they are a matter of
readability, not speed. Measure before relying on them.

## Common mistakes

- **Timing once.** A single `time.perf_counter()` around a call measures noise as well. Use
  `timeit.repeat` and keep the minimum.
- **`apply(axis=1)` for arithmetic.** It is a row loop in disguise. Write the formula on columns.
- **`np.vectorize` to "vectorise".** The NumPy docs say it is a convenience, essentially a loop.
- **Merging to look up one column.** It copies every column of both frames; `map` adds one.
- **Optimising without a test.** Check the fast version gives the same result, as
  `fares_vectorised(trips).equals(fares_apply(trips))` did above.

## Practice

1. Vectorise `lambda row: "long" if row["km"] > 10 else "short"` applied with `axis=1`.
2. A function calls `df[df["code"] == code]["price"].iloc[0]` for 10,000 codes. Make it fast.
3. Why might `fares_vectorised` be only a little faster than `fares_apply` on a frame of 5 rows?

### Answers

```python
size = pd.Series(np.where(trips["km"] > 10, "long", "short"), index=trips.index)

menu = pd.DataFrame({"code": ["A1", "B2", "C3"], "price": [2.5, 3.0, 4.25]})
codes = pd.Series(["B2", "A1", "B2"])
price_by_code = menu.set_index("code")["price"]
print(codes.map(price_by_code).tolist())
```

```text
[3.0, 2.5, 3.0]
```

1. `np.where` chooses between two values for the whole column at once.
2. Build the indexed Series once, then use `price_by_code.loc[code]` per code, or better,
   `map` the whole column of codes in one call, as above.
3. On tiny frames pandas' fixed cost per operation dominates; vectorising pays off as rows grow.

## Key takeaways

- Measure with `timeit.repeat` (keep the minimum) and profile with `cProfile` before changing code.
- Row loops (`iterrows`, `apply(axis=1)`, even `itertuples`) are hundreds of times slower than
  column operations; use arithmetic, `where`, `np.where` and `np.select`.
- `to_numpy` removes pandas' overhead in hot loops over small pieces.
- Look values up through an index or with `map`; `merge` with `validate=` when you need many columns.
- `eval` and `query` only speed up large frames with `numexpr` installed.

## Further reading

- [pandas: Enhancing performance](https://pandas.pydata.org/docs/user_guide/enhancingperf.html)
- [Python: timeit](https://docs.python.org/3/library/timeit.html)
- [Python: the profilers](https://docs.python.org/3/library/profile.html)
- [pandas: Series.map](https://pandas.pydata.org/docs/reference/api/pandas.Series.map.html)
