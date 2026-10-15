---
title: MultiIndex and Advanced Indexing
summary: Work with an index of several levels. See where a MultiIndex comes from, select rows with tuples, cross-sections and `pd.IndexSlice`, keep the index sorted, reorder levels with `swaplevel`, and get back to flat columns with `unstack`, `reset_index` and joined column names.
minutes: 35
objectives:
  - Explain what a MultiIndex is and create one with `set_index`, `groupby` or `agg`
  - Select rows with full and partial tuple keys in `loc`, and with `xs` on any level
  - Slice several levels with `pd.IndexSlice` after sorting the index
  - Reorder levels with `swaplevel` and `sort_index`
  - Flatten a MultiIndex with `unstack`, `reset_index` and joined column names
---

## Outline

1. What a MultiIndex is
2. Selecting with tuples
3. Cross-sections with `xs`
4. Slicing with `pd.IndexSlice` and sorting
5. Reordering levels
6. Back to flat columns

## What a MultiIndex is

A **MultiIndex** (or hierarchical index) is an index whose labels are tuples, one value per **level**. You have already made them: `groupby` on two keys, `pivot_table` with several `aggfunc` values and `concat` with `keys` all return one. It lets a single table hold data keyed by two things at once, here a campus's monthly energy use by building:

```python
import pandas as pd

usage = pd.DataFrame({
    "building": ["pool", "gym", "library"] * 3,
    "month": ["2026-01"] * 3 + ["2026-02"] * 3 + ["2026-03"] * 3,
    "kwh": [5200, 3100, 1800, 4900, 2950, 1750, 5100, 3300, 1600],
    "cost": [1300.0, 775.0, 450.0, 1225.0, 737.5, 437.5, 1275.0, 825.0, 400.0],
})
meters = usage.set_index(["building", "month"])
print(meters.head(4))
print(meters.index[:2])
```

```text
                   kwh    cost
building month                
pool     2026-01  5200  1300.0
gym      2026-01  3100   775.0
library  2026-01  1800   450.0
pool     2026-02  4900  1225.0
MultiIndex([('pool', '2026-01'),
            ( 'gym', '2026-01')],
           names=['building', 'month'])
```

`set_index` with a list makes each column a level, outermost first. When printed, a repeated outer label is shown once per block, and each level has a name, used by `xs`, `unstack` and `groupby(level=...)`.

## Selecting with tuples

In `loc`, a **tuple** is one key with a value for each level. Giving only the first level is a **partial** key, which returns every row under it and drops that level from the result:

```python
print(meters.loc[("gym", "2026-02")])
print(meters.loc[("gym", "2026-02"), "kwh"])
print(meters.loc["gym"])
print(meters.loc[[("gym", "2026-01"), ("pool", "2026-03")]])
```

```text
kwh     2950.0
cost     737.5
Name: (gym, 2026-02), dtype: float64
2950
          kwh   cost
month               
2026-01  3100  775.0
2026-02  2950  737.5
2026-03  3300  825.0
                   kwh    cost
building month                
gym      2026-01  3100   775.0
pool     2026-03  5100  1275.0
```

A full key selects one row, returned as a Series (with `kwh` converted to float to share a dtype with `cost`). Adding a column label after the tuple gives one value. A **list** of tuples selects several rows. Remember the difference: a tuple is one key, a list is several keys.

## Cross-sections with `xs`

A partial key works only on the first level. To select by an inner level, such as one month for every building, use `xs` (cross-section) with the level's name:

```python
print(meters.xs("2026-02", level="month"))
```

```text
           kwh    cost
building              
pool      4900  1225.0
gym       2950   737.5
library   1750   437.5
```

The selected level is dropped; `drop_level=False` keeps it, which helps when you will combine the result with other cross-sections.

## Slicing with `pd.IndexSlice` and sorting

To slice several levels at once, such as "gym to library, from February on", `loc` needs a slice per level. `pd.IndexSlice` lets you write them with the usual colon syntax. A MultiIndex must be **sorted** for this, and `meters` is in the order the rows arrived:

```python
idx = pd.IndexSlice
try:
    meters.loc[idx["gym":"library", "2026-02":], :]
except Exception as error:
    print(type(error).__name__, error)

tidy = meters.sort_index()
print(tidy.loc[idx["gym":"library", "2026-02":], "kwh"])
print(tidy.loc[idx[:, "2026-03"], :])
```

```text
UnsortedIndexError 'MultiIndex slicing requires the index to be lexsorted: slicing on levels [0, 1], lexsort depth 0'
building  month  
gym       2026-02    2950
          2026-03    3300
library   2026-02    1750
          2026-03    1600
Name: kwh, dtype: int64
                   kwh    cost
building month                
gym      2026-03  3300   825.0
library  2026-03  1600   400.0
pool     2026-03  5100  1275.0
```

**Lexsorted** means sorted by the first level, then the second within it, as `sort_index()` does. As everywhere in `loc`, label slices include both ends. `idx[:, "2026-03"]` means "every building, March only", the slicing equivalent of `xs`. Give the column part too (`:` for all); the pandas guide recommends always specifying both axes with a MultiIndex. Sorting also makes every lookup faster, and `tidy.index.is_monotonic_increasing` tells you whether it is sorted.

## Reordering levels

`swaplevel` exchanges two levels, so the month becomes the outer one. The rows keep their order, so sort again:

```python
by_month = meters.swaplevel("building", "month").sort_index()
print(by_month.head(4))
```

```text
                   kwh    cost
month   building              
2026-01 gym       3100   775.0
        library   1800   450.0
        pool      5200  1300.0
2026-02 gym       2950   737.5
```

Now `by_month.loc["2026-01"]` is a partial key. Grouping by a level needs no reset either: `meters.groupby(level="month")["kwh"].sum()` totals each month.

## Back to flat columns

Many tasks need plain columns again: writing CSV, merging, or simply reading. Three tools do it. `unstack` moves a level into the columns (lesson 3), `reset_index` turns all levels into ordinary columns, and a MultiIndex in the **columns**, which `agg` with lists makes, can be flattened by joining each tuple into one name:

```python
print(meters["kwh"].unstack("month"))

stats = usage.groupby("building").agg({"kwh": ["sum", "max"], "cost": ["sum"]})
print(stats.columns.tolist())
stats.columns = ["_".join(pair) for pair in stats.columns]
print(stats.reset_index())
```

```text
month     2026-01  2026-02  2026-03
building                           
gym          3100     2950     3300
library      1800     1750     1600
pool         5200     4900     5100
[('kwh', 'sum'), ('kwh', 'max'), ('cost', 'sum')]
  building  kwh_sum  kwh_max  cost_sum
0      gym     9350     3300    2337.5
1  library     5150     1800    1287.5
2     pool    15200     5200    3800.0
```

Iterating over a MultiIndex gives its tuples, so a comprehension builds the new names. Named aggregation from lesson 1 avoids the problem from the start.

## Common mistakes

- **Slicing an unsorted MultiIndex.** It raises `UnsortedIndexError: 'MultiIndex slicing requires the index to be lexsorted: ...'`. Call `sort_index()` once, early.
- **A list where a tuple is meant.** `meters.loc[["gym", "2026-02"]]` asks for two outer keys, `"gym"` and `"2026-02"`, and fails with `KeyError` for the second. Use a tuple for one key.
- **Expecting a partial key to work on an inner level.** `meters.loc["2026-02"]` looks in the first level only. Use `xs(..., level="month")` or `idx[:, "2026-02"]`.
- **Forgetting to sort after `swaplevel`.** The levels change but the rows do not, so a sorted index usually stops being sorted, and slicing it raises `UnsortedIndexError`. Follow `swaplevel` with `sort_index()`.

## Practice

1. Get the library's cost in March as a single number.
2. List every building's kWh in January, the largest first.
3. Total the kWh of each month straight from `meters`.

### Answers

```python
print(tidy.loc[("library", "2026-03"), "cost"])
print(meters.xs("2026-01", level="month")["kwh"].sort_values(ascending=False))
print(meters.groupby(level="month")["kwh"].sum())
```

```text
400.0
building
pool       5200
gym        3100
library    1800
Name: kwh, dtype: int64
month
2026-01    10100
2026-02     9600
2026-03    10000
Name: kwh, dtype: int64
```

A full tuple plus a column label is one value. `xs` selects on the inner level and leaves `building` as the index. `groupby(level=...)` groups by an index level without `reset_index`.

## Key takeaways

- A MultiIndex holds tuple labels, one value per named level; `groupby`, `set_index`, `pivot_table` and `concat(keys=...)` create them.
- In `loc`, a tuple is one key and a partial key selects by the first level.
- `xs(value, level=name)` selects on any level.
- Sort with `sort_index()` before slicing with `pd.IndexSlice`; slices include both ends.
- `swaplevel`, `unstack`, `reset_index` and joined column names reshape or flatten it.

## Further reading

- [pandas user guide: MultiIndex / advanced indexing](https://pandas.pydata.org/docs/user_guide/advanced.html)
- [API reference: DataFrame.xs](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.xs.html)
- [API reference: pandas.IndexSlice](https://pandas.pydata.org/docs/reference/api/pandas.IndexSlice.html)
