---
title: apply, map and Vectorization
summary: Know what `apply`, `Series.map`, `DataFrame.map`, `iterrows` and `itertuples` do, measure why row-by-row Python is slow, and replace it with vectorised code built from arithmetic, `map`, `np.where`, `np.select`, `.str` and `.dt`. Learn the cases where `apply` is the right tool.
minutes: 40
objectives:
  - Use `DataFrame.apply` over columns and rows, and predict the shape of its result
  - Use `Series.map` with a dict or a function, and `DataFrame.map` for element-wise work
  - Explain why `iterrows`, `itertuples` and `apply(axis=1)` are slow, and measure the difference
  - Rewrite row-wise logic with arithmetic, `np.where` and `np.select`
  - Recognise when `apply` is acceptable
---

## Outline

1. `apply` over columns and rows
2. `Series.map` and `DataFrame.map`
3. Looping over rows
4. Why row-by-row code is slow
5. Vectorised replacements
6. When `apply` is fine

## `apply` over columns and rows

`DataFrame.apply(func)` calls a Python function on each **column** (the default, `axis=0`) or each **row** (`axis=1`), passing it as a Series. A courier prices parcels by zone, weight and speed:

```python
import numpy as np
import pandas as pd

parcels = pd.DataFrame({
    "weight_kg": [0.8, 2.5, 5.0, 1.2, 3.4],
    "zone": ["local", "national", "abroad", "national", "local"],
    "express": [False, True, False, False, True],
})
BASE = {"local": 3.50, "national": 5.00, "abroad": 12.00}


def fee(row):
    price = BASE[row["zone"]] + max(row["weight_kg"] - 2, 0) * 0.80
    if row["express"]:
        price *= 2
    return round(price, 2)


print(parcels[["weight_kg"]].apply(lambda column: column.max() - column.min()))
parcels["fee"] = parcels.apply(fee, axis=1)
print(parcels)
```

```text
weight_kg    4.2
dtype: float64
   weight_kg      zone  express    fee
0        0.8     local    False   3.50
1        2.5  national     True  10.80
2        5.0    abroad    False  14.40
3        1.2  national    False   5.00
4        3.4     local     True   9.24
```

The rule is a base price for the zone, 80 cents per kilogram over 2 kg, and double for express. With `axis=1` the function sees one row at a time and returns one number, so the result is a Series with one value per row. If the function returned a Series, the result would be a DataFrame. This is the most natural way to write the rule, and, as we will measure, the slowest way to run it.

## `Series.map` and `DataFrame.map`

`Series.map` transforms each value of one column. Given a **dict** it looks each value up, with `NaN` for missing keys; given a **function** it calls it on each value. `DataFrame.map` calls a function on every single cell (it was called `applymap` before pandas 3, and that name is gone):

```python
print(parcels["zone"].map(BASE).tolist())
print(parcels["zone"].map({"local": "L", "national": "N"}).tolist())
print(parcels[["weight_kg", "fee"]].map(lambda value: f"{value:.2f}"))
```

```text
[3.5, 5.0, 12.0, 5.0, 3.5]
['L', 'N', nan, 'N', 'L']
  weight_kg    fee
0      0.80   3.50
1      2.50  10.80
2      5.00  14.40
3      1.20   5.00
4      3.40   9.24
```

Mapping with a dict is fast, because pandas does the lookups itself. Mapping with a function runs Python once per value, which is fine for formatting a report and slow for a million rows.

## Looping over rows

`iterrows()` yields `(label, row)` pairs with each row as a Series; `itertuples()` yields lightweight named tuples with the columns as attributes:

```python
for row in parcels.head(2).itertuples():
    print(row)
for label, row in parcels.head(1).iterrows():
    print(label, row["weight_kg"], row.dtype)
```

```text
Pandas(Index=0, weight_kg=0.8, zone='local', express=False, fee=3.5)
Pandas(Index=1, weight_kg=2.5, zone='national', express=True, fee=10.8)
0 0.8 object
```

A Series has one dtype, so a row of mixed columns becomes `object` and loses its column types; the pandas docs recommend `itertuples` for that reason and because it is faster. Writing to `row` inside the loop does not change the DataFrame, since the row is a copy.

## Why row-by-row code is slow

A **vectorised** operation, such as `df["weight_kg"] - 2`, runs one loop in compiled NumPy code over the whole column. Row-by-row code runs Python bytecode for every row, creates a Python object for each value, and for `iterrows` and `apply(axis=1)` builds a whole Series per row. Here is the same fee three ways on 100,000 parcels:

```python
import time


def fee_vectorised(df):
    price = df["zone"].map(BASE) + (df["weight_kg"] - 2).clip(lower=0) * 0.80
    return pd.Series(np.where(df["express"], price * 2, price), index=df.index).round(2)


rng = np.random.default_rng(1)
n = 100_000
big = pd.DataFrame({"weight_kg": rng.uniform(0.1, 10, n).round(1),
                    "zone": rng.choice(list(BASE), n),
                    "express": rng.random(n) < 0.2})

start = time.perf_counter()
looped = [fee(row._asdict()) for row in big.itertuples()]
middle = time.perf_counter()
applied = big.apply(fee, axis=1)
end = time.perf_counter()
fast = fee_vectorised(big)
done = time.perf_counter()

print(f"itertuples loop: {middle - start:.3f} s")
print(f"apply(axis=1):   {end - middle:.3f} s")
print(f"vectorised:      {done - end:.3f} s")
print(np.allclose(looped, fast), np.allclose(applied, fast))
```

```text
itertuples loop: 0.320 s
apply(axis=1):   0.860 s
vectorised:      0.015 s
True True
```

These times come from one run in the course sandbox; yours will differ, but the ratio, here about 50 times, is typical. Note that `apply(axis=1)` was even slower than a plain loop: it is a loop too, plus a Series per row. `apply` is not vectorisation.

## Vectorised replacements

Each piece of the row function has a column-wide equivalent:

- `BASE[row["zone"]]` becomes `df["zone"].map(BASE)`.
- `max(x, 0)` becomes `.clip(lower=0)`; `abs`, `round` and arithmetic work on whole columns.
- `if ... else` with two outcomes becomes `np.where(condition, if_true, if_false)`.
- `if/elif/else` with several outcomes becomes `np.select(conditions, choices, default=...)`, which takes the first condition that is true for each row.
- String and date logic becomes `.str` and `.dt` (lessons 4 and 5).

```python
base = parcels["zone"].map(BASE)
extra = (parcels["weight_kg"] - 2).clip(lower=0) * 0.80
price = base + extra
parcels["fee_fast"] = np.where(parcels["express"], price * 2, price).round(2)

conditions = [parcels["weight_kg"] < 1, parcels["weight_kg"] < 3]
parcels["size"] = np.select(conditions, ["small", "medium"], default="large")
print(parcels[["weight_kg", "fee", "fee_fast", "size"]])
```

```text
   weight_kg    fee  fee_fast    size
0        0.8   3.50      3.50   small
1        2.5  10.80     10.80  medium
2        5.0  14.40     14.40   large
3        1.2   5.00      5.00  medium
4        3.4   9.24      9.24   large
```

The order of `conditions` matters: 0.8 kg is also below 3, but the first true condition wins. `np.where` returns a NumPy array, so it has no index; assigning it as a column is fine, and `pd.Series(..., index=df.index)` turns it back into a Series when you need one.

## When `apply` is fine

`apply` is the right tool when no vectorised form exists and the data is small: calling a function from another library that only accepts one value, parsing a few hundred odd records, or a one-off exploration where clarity matters more than a second. Column-wise `apply` (the default axis) runs once per column, so it is usually cheap. Measure before optimising, and when a row function will run on large or growing data, rewrite it with the tools above.

## Common mistakes

- **Writing `if` on a whole column.** A function that does `if kg < 1:` works in `apply` but fails when given a column: `ValueError: The truth value of a Series is ambiguous. ...`. That error is a sign to use `np.where` or `np.select`.
- **Using the old name.** `df.applymap(...)` raises `AttributeError: 'DataFrame' object has no attribute 'applymap'` in pandas 3; use `df.map(...)`.
- **Changing rows inside `iterrows`.** `row["fee"] = 0` changes a copy, never the DataFrame. Compute a column instead.
- **Reaching for `apply` to look things up.** `df["zone"].apply(lambda z: BASE[z])` raises `KeyError` on an unknown zone and is slower than `df["zone"].map(BASE)`, which gives `NaN`.

## Practice

1. Taxi fares are 2.50 plus 1.20 per km, times 1.5 at night. Vectorise them for `trips = pd.DataFrame({"km": [3.2, 12.5, 0.8, 25.0], "night": [False, True, True, False]})`, rounded to 2 places.
2. Label each trip `walkable` (under 1 km), `short` (under 10), `medium` (under 20) or `long`.
3. Replace `codes.apply(lambda c: c.upper().split("-")[0])` for `codes = pd.Series(["ab-12", "CD-7"])`.

### Answers

```python
trips["fare"] = (2.50 + trips["km"] * 1.20) * np.where(trips["night"], 1.5, 1.0)
print(trips["fare"].round(2).tolist())

conditions = [trips["km"] < 1, trips["km"] < 10, trips["km"] < 20]
print(np.select(conditions, ["walkable", "short", "medium"], default="long").tolist())

print(codes.str.upper().str.split("-").str[0].tolist())
```

```text
[6.34, 26.25, 5.19, 32.5]
['short', 'medium', 'walkable', 'long']
['AB', 'CD']
```

`np.where` makes a column of multipliers, so one expression covers day and night. The conditions are checked in order, so `short` only needs `< 10`. `.str[0]` takes the first item of each list.

## Key takeaways

- `apply(axis=1)` and row loops run Python per row; they are clear but slow, often 50 times or more.
- `Series.map(dict)` looks values up quickly; `DataFrame.map` (formerly `applymap`) works cell by cell.
- Prefer `itertuples` to `iterrows`, and both only when nothing else will do.
- Replace row logic with arithmetic, `clip`, `map`, `np.where`, `np.select`, `.str` and `.dt`.
- `apply` is fine on small data or with functions that only take single values; measure first.

## Further reading

- [pandas user guide: Essential basic functionality, Function application and Iteration](https://pandas.pydata.org/docs/user_guide/basics.html#function-application)
- [API reference: DataFrame.apply](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.apply.html)
- [API reference: DataFrame.iterrows](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.iterrows.html)
- [NumPy reference: numpy.select](https://numpy.org/doc/stable/reference/generated/numpy.select.html)
