---
title: GroupBy in Depth
summary: Go beyond one aggregate per group. Name the columns of an aggregation, give every row its group's value with `transform`, keep or drop whole groups with `filter`, know what `apply` costs, group by things that are not columns, and number and rank rows within their group.
minutes: 40
objectives:
  - Aggregate several columns with a dict and with named aggregations
  - Use `transform` to add group totals, shares and group-mean fills to every row
  - Keep whole groups with `filter`, and replace a slow `apply` with built-in methods
  - Group by a Series or a function, and control unused categories and missing keys with `observed` and `dropna`
  - Compute running totals, row numbers and ranks within each group
---

## Outline

1. Several aggregations at once
2. `transform`: a group value on every row
3. `filter`: keep or drop whole groups
4. `apply` and what it costs
5. Grouping by a Series or a function
6. Categories and missing keys: `observed` and `dropna`
7. Running totals and ranks within groups

## Several aggregations at once

pandas Foundations ended with **split-apply-combine**: `groupby` splits the rows into groups, a function runs on each group, and the results are combined into one table. This lesson uses one small table of bus trips throughout:

```python
import pandas as pd

trips = pd.DataFrame({
    "route": ["harbour", "harbour", "campus", "campus", "campus", "airport", "airport"],
    "day": ["Mon", "Tue", "Mon", "Tue", "Wed", "Mon", "Tue"],
    "riders": [310, 285, 120, 98, 143, 502, 478],
    "delay": [4.0, 6.5, 1.0, None, 2.5, 9.0, 11.5],
})
```

Each example below starts again from this table.

`agg` takes a dict from column to function, so each column gets its own aggregation. **Named aggregation** goes further: each keyword is an output column, and its value is a `(column, function)` tuple, so you choose the names and can use one column twice.

```python
print(trips.groupby("route").agg({"riders": "sum", "delay": "mean"}))

summary = trips.groupby("route").agg(
    riders=("riders", "sum"),
    worst_delay=("delay", "max"),
    days=("day", "size"),
    reports=("delay", "count"),
)
print(summary)
```

```text
         riders  delay
route                 
airport     980  10.25
campus      361   1.75
harbour     595   5.25
         riders  worst_delay  days  reports
route                                      
airport     980         11.5     2        2
campus      361          2.5     3        2
harbour     595          6.5     2        2
```

`size` counts rows and `count` counts non-missing values, so campus has three days but only two delay reports. Prefer named aggregation for anything you will read later: the column names say what was computed.

## `transform`: a group value on every row

An aggregation returns one row per group. `transform` returns a result **the same length as the input**, aligned to the original rows, so it can become a new column. Given the name of a reduction such as `"sum"` or `"mean"`, it repeats the group's value on every row of the group.

```python
by_route = trips.groupby("route")
trips["share"] = (trips["riders"] / by_route["riders"].transform("sum")).round(2)
route_mean = by_route["delay"].transform("mean")
trips["delay_filled"] = trips["delay"].fillna(route_mean)
trips["vs_route"] = trips["delay_filled"] - route_mean
print(trips)
```

```text
     route  day  riders  delay  share  delay_filled  vs_route
0  harbour  Mon     310    4.0   0.52          4.00     -1.25
1  harbour  Tue     285    6.5   0.48          6.50      1.25
2   campus  Mon     120    1.0   0.33          1.00     -0.75
3   campus  Tue      98    NaN   0.27          1.75      0.00
4   campus  Wed     143    2.5   0.40          2.50      0.75
5  airport  Mon     502    9.0   0.51          9.00     -1.25
6  airport  Tue     478   11.5   0.49         11.50      1.25
```

Three common jobs in five lines: each day's share of its route's riders, a missing delay filled with **its own route's** mean (1.75 for campus, not the overall mean), and each delay compared with its route's mean, a **group-wise normalisation**. Dividing by `transform("std")` as well would give a z-score within each group.

## `filter`: keep or drop whole groups

`filter` calls a function once per group. The function returns one `True` or `False`, and the result keeps every row of the groups that passed, in their original order:

```python
late = trips.groupby("route").filter(lambda group: group["delay"].mean() > 3)
print(late)

mask = trips.groupby("route")["delay"].transform("mean") > 3
print(trips[mask].equals(late))
```

```text
     route  day  riders  delay
0  harbour  Mon     310    4.0
1  harbour  Tue     285    6.5
5  airport  Mon     502    9.0
6  airport  Tue     478   11.5
True
```

The second form, a boolean mask built with `transform`, gives the same rows. The pandas guide notes that a built-in reduction in `transform` is usually faster than a Python function in `filter`, which matters with thousands of groups.

## `apply` and what it costs

`apply` hands each group to your function as a whole DataFrame and combines whatever comes back. It is the most flexible tool and the slowest. In pandas 3 the grouping columns are **not** part of the frame your function receives; they appear only in the result's index.

```python
def busiest_day(group):
    return group.nlargest(1, "riders")


print(trips.groupby("route").apply(busiest_day))
print(trips.loc[trips.groupby("route")["riders"].idxmax()])
```

```text
           day  riders  delay
route                        
airport 5  Mon     502    9.0
campus  4  Wed     143    2.5
harbour 0  Mon     310    4.0
     route  day  riders  delay
5  airport  Mon     502    9.0
4   campus  Wed     143    2.5
0  harbour  Mon     310    4.0
```

`idxmax` returns the row label of each group's largest value, and `loc` picks those rows: same answer, flat index, no Python function. The cost shows on bigger data, here 200,000 readings from 2,000 sensors:

```python
import time

import numpy as np

rng = np.random.default_rng(7)
readings = pd.DataFrame({"sensor": rng.integers(0, 2_000, size=200_000),
                         "level": rng.normal(50, 10, size=200_000)})
by_sensor = readings.groupby("sensor")["level"]

start = time.perf_counter()
spread_apply = by_sensor.apply(lambda levels: levels.max() - levels.min())
middle = time.perf_counter()
spread_builtin = by_sensor.max() - by_sensor.min()
end = time.perf_counter()
print(spread_apply.equals(spread_builtin))
print(f"apply:    {middle - start:.3f} s")
print(f"built-in: {end - middle:.3f} s")
```

```text
True
apply:    0.132 s
built-in: 0.002 s
```

The times come from one run, and yours will differ. `apply` runs a Python function 2,000 times; `max` and `min` each run once over all groups in compiled code. Reach for `apply` only when no combination of built-in methods expresses the step.

## Grouping by a Series or a function

`groupby("route")` is shorthand for grouping by the Series `trips["route"]`. Any Series aligned with the rows works, even one that is not a column, and so does a function, which is called on each **index label**:

```python
print(trips.groupby(trips["riders"] >= 300)["delay"].mean())

prices = pd.Series([4.5, 3.0, 6.25, 3.5, 2.75],
                   index=["TEA-01", "CAKE-02", "SOUP-01", "TEA-02", "CAKE-07"])
print(prices.groupby(lambda code: code.split("-")[0]).mean())
```

```text
riders
False    3.333333
True     8.166667
Name: delay, dtype: float64
CAKE    2.875
SOUP    6.250
TEA     4.000
dtype: float64
```

## Categories and missing keys: `observed` and `dropna`

When the key is a categorical, pandas 3 shows only the categories that occur (`observed=True` is now the default). `observed=False` lists every category, so a shift with no calls appears with a sum of 0. Separately, rows whose key is missing are dropped from the groups unless you pass `dropna=False`:

```python
calls = pd.DataFrame({
    "shift": pd.Categorical(["early", "late", "early", None],
                            categories=["early", "late", "night"]),
    "calls": [12, 7, 9, 4],
})
print(calls.groupby("shift", observed=False)["calls"].sum())
print(calls.groupby("shift", dropna=False)["calls"].sum())
```

```text
shift
early    21
late      7
night     0
Name: calls, dtype: int64
shift
early    21
late      7
NaN       4
Name: calls, dtype: int64
```

With the defaults, the result would have just `early` and `late`: the 4 calls with no shift silently vanish from the totals.

## Running totals and ranks within groups

Cumulative methods restart in every group. `cumcount` numbers the rows of each group from 0, and `rank` ranks within each group (tie rules come in lesson 10):

```python
by_route = trips.groupby("route")["riders"]
trips["running"] = by_route.cumsum()
trips["day_no"] = trips.groupby("route").cumcount() + 1
trips["rank"] = by_route.rank(ascending=False)
print(trips[["route", "riders", "running", "day_no", "rank"]])
```

```text
     route  riders  running  day_no  rank
0  harbour     310      310       1   1.0
1  harbour     285      595       2   2.0
2   campus     120      120       1   2.0
3   campus      98      218       2   3.0
4   campus     143      361       3   1.0
5  airport     502      502       1   1.0
6  airport     478      980       2   2.0
```

## Common mistakes

- **Aggregating when you meant to transform.** `trips["riders"] / trips.groupby("route")["riders"].sum()` aligns row labels 0 to 6 with route names, and every value is `NaN`. Use `transform("sum")`.
- **Using the grouping column inside `apply`.** `lambda g: g["route"].iloc[0]` raises `KeyError: 'route'` in pandas 3, and `include_groups=True` raises `ValueError: include_groups=True is no longer allowed.` Read the key from the result's index instead.
- **A `filter` function that returns a Series.** `lambda g: g["delay"] > 3` raises `TypeError: filter function returned a Series, but expected a scalar bool`. Reduce it: `(g["delay"] > 3).any()`.
- **Losing rows with missing keys.** Check `df["key"].isna().sum()` before grouping, or pass `dropna=False`.

## Practice

1. For each route, compute `mean_riders` and `busy_days` (days with more than 200 riders).
2. Add `pct_of_best`: each day's riders as a percentage of its route's best day, to one decimal.
3. Keep only the trips of routes that ran on at least three days, without `filter`.

### Answers

```python
flagged = trips.assign(busy=trips["riders"] > 200)
print(flagged.groupby("route").agg(mean_riders=("riders", "mean"),
                                   busy_days=("busy", "sum")))

best = trips.groupby("route")["riders"].transform("max")
trips["pct_of_best"] = (trips["riders"] / best * 100).round(1)

print(trips[trips.groupby("route")["day"].transform("size") >= 3])
```

```text
         mean_riders  busy_days
route                          
airport   490.000000          2
campus    120.333333          0
harbour   297.500000          2
```

Summing a boolean column counts its `True` values. `transform("max")` puts each route's best day on every row. `transform("size")` gives each row its group's size, so the mask keeps the three campus rows.

## Key takeaways

- Named aggregation (`name=("column", "func")`) gives readable, flat result columns.
- `transform` returns one value per original row: group totals, shares, fills and normalisation.
- `filter` keeps or drops whole groups; a `transform` mask does the same, usually faster.
- `apply` is flexible but slow, and in pandas 3 it never sees the grouping columns.
- pandas 3 groups categoricals with `observed=True`; missing keys are dropped unless `dropna=False`.

## Further reading

- [pandas user guide: Group by: split-apply-combine](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [API reference: DataFrameGroupBy.transform](https://pandas.pydata.org/docs/reference/api/pandas.core.groupby.DataFrameGroupBy.transform.html)
- [What's new in pandas 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
