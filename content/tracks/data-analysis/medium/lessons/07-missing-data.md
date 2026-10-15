---
title: Missing Data
summary: Recognise how pandas marks missing values (NaN, None, NaT and pd.NA), find and count them, see how they change sums, means and counts, remove them with `dropna`, fill them with `fillna`, `ffill`, `bfill` and `interpolate`, and keep integer columns whole with nullable dtypes.
minutes: 40
objectives:
  - Name the missing-value marker each dtype uses and test for it with `isna` and `notna`
  - Count missing values per column and find the rows that have any
  - Predict how `sum`, `mean` and `count` treat missing values
  - Remove rows with `dropna` (`subset`, `how`, `thresh`) and fill gaps with `fillna`, `ffill`, `bfill` and `interpolate`
  - Use nullable dtypes such as `Int64` and `boolean`, and explain how pandas 3 treats NaN in them
---

## Outline

1. How pandas marks a missing value
2. Finding and counting gaps
3. What gaps do to sums, means and counts
4. Dropping rows with `dropna`
5. Filling gaps
6. Nullable dtypes and `pd.NA`

## How pandas marks a missing value

A school puts a CO₂ and temperature sensor in every classroom. Two sensors lost their connection,
and one room did not report its pupil count:

```python
import numpy as np
import pandas as pd

sensors = pd.DataFrame(
    {
        "room": ["A1", "A2", "B1", "B2", "C1", "C2"],
        "co2_ppm": [820, None, 1240, 960, None, 700],
        "temp_c": [21.5, 22.0, None, 20.5, None, 21.0],
        "pupils": [28, 30, None, 25, None, 27],
    }
)
print(sensors)
print(sensors.dtypes)
```

```text
  room  co2_ppm  temp_c  pupils
0   A1    820.0    21.5    28.0
1   A2      NaN    22.0    30.0
2   B1   1240.0     NaN     NaN
3   B2    960.0    20.5    25.0
4   C1      NaN     NaN     NaN
5   C2    700.0    21.0    27.0
room           str
co2_ppm    float64
temp_c     float64
pupils     float64
dtype: object
```

Python's `None` did not survive. In a number column pandas stores a missing value as **NaN**, the
floating-point "not a number" from NumPy Foundations, and since NaN is a float, the whole
`co2_ppm` and `pupils` columns became `float64` although every real value is whole. The `str`
dtype also uses NaN: `pd.Series(["A1", None])` holds `'A1'` and `nan`. Dates use **NaT**, "not a
time". The last section adds a fourth marker, `pd.NA`.

## Finding and counting gaps

NaN is not equal to anything, itself included (`np.nan == np.nan` is `False`), so never look for
it with `==`. `isna()` returns a mask that is `True` where a value is missing, whatever the marker;
`notna()` is its opposite:

```python
print(sensors.isna().sum())
print(sensors["co2_ppm"].isna().mean())
print(sensors[sensors.isna().any(axis=1)])
```

```text
room       0
co2_ppm    2
temp_c     2
pupils     2
dtype: int64
0.3333333333333333
  room  co2_ppm  temp_c  pupils
1   A2      NaN    22.0    30.0
2   B1   1240.0     NaN     NaN
4   C1      NaN     NaN     NaN
```

- `isna()` on a frame gives a frame of booleans; `.sum()` counts the `True` values in each column.
- The mean of a boolean mask is the **share** of `True`: a third of the CO₂ readings are missing.
- `any(axis=1)` is `True` for a row with at least one gap, as `np.any` along axis 1 was for an
  array. Use it to look at the incomplete rows before deciding what to do with them.

## What gaps do to sums, means and counts

pandas aggregations **skip** missing values by default:

```python
co2 = sensors["co2_ppm"]
print(co2.sum(), co2.mean(), co2.count(), len(co2))
print(co2.sum(skipna=False), co2.fillna(0).mean())
empty = pd.Series([np.nan, np.nan])
print(empty.sum(), empty.sum(min_count=1), empty.mean())
```

```text
3720.0 930.0 4 6
nan 620.0
0.0 nan nan
```

- `mean` is 3720 / 4 = 930: the sum of the values present divided by **how many are present**,
  not by six rows. `count()` gives that 4; `len` counts rows.
- `skipna=False` makes one gap spoil the result, as in NumPy, where `np.sum` returns NaN and you
  needed `np.nansum` to skip it. pandas behaves like the `nan` functions by default.
- Filling with 0 before averaging gave 620, a different and wrong answer: the sensors did not
  measure zero. How you treat a gap is a decision about the data, not a formality.
- The sum of nothing is 0, even when every value is missing. `min_count=1` asks for NaN unless at
  least one value is present.

## Dropping rows with `dropna`

```python
print(sensors.dropna())
print(sensors.dropna(subset=["co2_ppm"])["room"].tolist())
print(sensors.dropna(how="all", subset=["co2_ppm", "temp_c"])["room"].tolist())
print(sensors.dropna(thresh=3)["room"].tolist())
```

```text
  room  co2_ppm  temp_c  pupils
0   A1    820.0    21.5    28.0
3   B2    960.0    20.5    25.0
5   C2    700.0    21.0    27.0
['A1', 'B1', 'B2', 'C2']
['A1', 'A2', 'B1', 'B2', 'C2']
['A1', 'A2', 'B2', 'C2']
```

- With no options, any gap in any column drops the row: half the rooms are gone.
- `subset` looks only at the columns that matter for the question. For a CO₂ report, B1 is fine
  although it has no temperature.
- `how="all"` drops a row only when **all** the listed columns are missing: only C1, which has
  neither reading.
- `thresh=3` keeps rows with at least three values present.

`dropna(axis=1)` drops **columns** with gaps instead. Like most methods, `dropna` returns a new frame.

## Filling gaps

`fillna` replaces gaps with a value, or with a different value per column through a dict:

```python
filled = sensors.fillna({"co2_ppm": sensors["co2_ppm"].mean(), "pupils": 0})
print(filled[["room", "co2_ppm", "pupils"]])
```

```text
  room  co2_ppm  pupils
0   A1    820.0    28.0
1   A2    930.0    30.0
2   B1   1240.0     0.0
3   B2    960.0    25.0
4   C1    930.0     0.0
5   C2    700.0    27.0
```

Readings taken one after another, such as a room's temperature each day, are better filled from
their neighbours. `ffill` carries the last known value forward, `bfill` carries the next one back,
and `interpolate` draws a straight line between known values:

```python
temps = pd.Series([20.5, None, None, 22.0, 21.0, None],
                  index=["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])
print(pd.DataFrame({"ffill": temps.ffill(), "bfill": temps.bfill(), "interp": temps.interpolate()}))
```

```text
     ffill  bfill  interp
Mon   20.5   20.5    20.5
Tue   20.5   22.0    21.0
Wed   20.5   22.0    21.5
Thu   22.0   22.0    22.0
Fri   21.0   21.0    21.0
Sat   21.0    NaN    21.0
```

`bfill` has nothing after Saturday, so Saturday stays NaN. `interpolate` stepped from 20.5 to 22.0
in equal steps, and after the last known value it repeats it. `ffill(limit=1)` fills at most one
gap in a row, so a long outage stays visible.

## Nullable dtypes and `pd.NA`

To keep whole numbers whole, use a **nullable dtype**: `Int64` (capital I), `Float64`, `boolean`.
They store a separate mask of missing positions and show the missing marker **`pd.NA`** as `<NA>`:

```python
pupils = sensors["pupils"].astype("Int64")
print(pupils.tolist())
print((pupils > 26).tolist())
rates = pd.Series([0.0, np.nan, 2.5], dtype="Float64")
print((rates / 0).tolist())
```

```text
[28, 30, <NA>, 25, <NA>, 27]
[True, True, <NA>, False, <NA>, True]
[<NA>, <NA>, inf]
```

- `pd.NA` spreads through arithmetic and comparisons: "is a missing count above 26?" is unknown,
  so the result is `<NA>` in a `boolean` column, not `False`.
- In pandas 3, NaN **is** a missing value in nullable dtypes. `np.nan` became `<NA>`, and `0.0 / 0`,
  which is NaN in NumPy, also became `<NA>`. Before pandas 3 it stayed a NaN that `isna()` did not
  report. Division of a real number by zero is still `inf`.
- `read_csv(..., dtype={"pupils": "Int64"})` reads a column with gaps as integers directly.

The default dtypes (`float64` with NaN) are what you will meet most; reach for `Int64` when an
integer column must stay integer.

## Common mistakes

- **`== np.nan`.** `sensors["temp_c"] == np.nan` is `False` in every row. Use `isna()`.
- **`fillna(0)` by reflex.** It turns "unknown" into a measurement and drags means down. Fill only
  when the value is truly known (no visitors means 0), otherwise drop or leave the gap.
- **`inplace` on a column.** `sensors["co2_ppm"].fillna(0, inplace=True)` changes a temporary
  object, not `sensors`, and warns `ChainedAssignmentError: A value is being set on a copy of a
  DataFrame or Series through chained assignment using an inplace method.` Write
  `sensors["co2_ppm"] = sensors["co2_ppm"].fillna(0)`.
- **`if value:` on `pd.NA`.** `bool(pd.NA)` raises `TypeError: boolean value of NA is ambiguous`.
  Test with `pd.isna(value)`.

## Practice

1. Which rooms have a temperature but no CO₂ reading?
2. Compute the mean temperature, then the mean you would wrongly get by filling gaps with 0.
3. The caretaker confirms that B1 and C1 were empty that day. Fill their `pupils` with 0 and make
   the column `Int64`.

### Answers

```python
print(sensors.loc[sensors["temp_c"].notna() & sensors["co2_ppm"].isna(), "room"].tolist())
print(sensors["temp_c"].mean(), sensors["temp_c"].fillna(0).mean())
pupils = sensors["pupils"].fillna(0).astype("Int64")
print(pupils.tolist())
```

```text
['A2']
21.25 14.166666666666666
[28, 30, 0, 25, 0, 27]
```

Filling with 0 is right in exercise 3 because zero is now a known fact, unlike in exercise 2.
`astype("Int64")` accepts only whole numbers: on a value such as 27.5 it raises
`TypeError: cannot safely cast non-equivalent float64 to int64` instead of cutting the fraction off.

## Key takeaways

- Number and `str` columns mark gaps with NaN, dates with NaT, nullable dtypes with `pd.NA`; test
  with `isna`/`notna`, never `==`.
- `df.isna().sum()` counts gaps per column; `any(axis=1)` finds incomplete rows.
- `sum`, `mean` and the rest skip gaps; `count` counts values present; a fill changes the answer.
- `dropna(subset=..., how=..., thresh=...)` removes rows; `fillna`, `ffill`, `bfill` and
  `interpolate` fill them.
- `Int64` and `boolean` keep their type with gaps; in pandas 3, NaN in them is `<NA>`.

## Further reading

- [pandas user guide: Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
- [pandas.DataFrame.dropna](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.dropna.html)
- [pandas.DataFrame.fillna](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.fillna.html)
- [What's new in 3.0.0: NaN as NA in nullable dtypes](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
