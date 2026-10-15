---
title: Aggregations, Sorting and Statistics
summary: Summarise arrays with `sum`, `mean`, `min`, `max`, `std` and `var` along an axis, keep dimensions for broadcasting, find where the extremes are, compute running totals, medians and percentiles, ignore NaN with the `nan` functions, sort and rank with `sort` and `argsort`, and count values with `np.unique`.
minutes: 40
objectives:
  - Compute sums, means, extremes, standard deviations and variances of a whole array or along an axis, with `keepdims` when the result must broadcast back
  - Find the position of the largest or smallest value with `argmax` and `argmin`, and running totals with `cumsum`
  - Compute medians, percentiles and quantiles
  - Summarise data with missing values using `nansum`, `nanmean` and friends
  - Sort with `np.sort` and `ndarray.sort`, order one array by another with `argsort`, and count distinct values with `np.unique`
---

## Outline

1. Summaries along an axis
2. `keepdims` and the standard deviation
3. Where the extremes are, and running totals
4. Medians and percentiles
5. Missing values: the `nan` functions
6. Sorting and `argsort`
7. Counting values with `np.unique`

## Summaries along an axis

An **aggregation** reduces many values to one: a total, an average, a maximum. Each exists as a method (`hires.sum()`) and as a function (`np.sum(hires)`). With no `axis` it summarises the whole array; with `axis` it summarises along that axis, which disappears from the result, as lesson 4 showed.

```python
import numpy as np

# Bikes hired: one row per docking station, one column per day (Mon to Sun)
hires = np.array([
    [34, 41, 38, 52, 60, 75, 70],
    [12, 15, 11, 14, 18, 30, 28],
    [55, 49, 61, 58, 66, 80, 91],
])
print(hires.sum(), hires.mean().round(2), hires.max())
print(hires.sum(axis=1))
print(hires.mean(axis=0).round(1))
print(hires.min(axis=1), np.max(hires, axis=0))
print(hires.std(axis=1).round(2), hires.var(axis=1).round(1))
```

```text
958 45.62 91
[370 128 460]
[33.7 35.  36.7 41.3 48.  61.7 63. ]
[34 11 49] [55 49 61 58 66 80 91]
[14.89  7.11 13.73] [221.8  50.5 188.5]
```

`axis=1` gives one value per station (a week's total), `axis=0` one per day (the average over stations). The **variance** (`var`) is the mean squared distance from the mean, and the **standard deviation** (`std`) is its square root, in the data's own units: station 1's daily hires typically sit about 7 away from its mean. `.round(2)` is the method form of `np.round`.

## `keepdims` and the standard deviation

A summary along axis 1 has shape `(3,)`, which does not broadcast against the `(3, 7)` table, as lesson 8 found. `keepdims=True` leaves the summarised axis in place with length 1, so the result is already a column. Continuing with `hires`:

```python
station_mean = hires.mean(axis=1, keepdims=True)
print(station_mean.shape)
print((hires - station_mean).round(1))
print(hires[1].std().round(3), hires[1].std(ddof=1).round(3))
```

```text
(3, 1)
[[-18.9 -11.9 -14.9  -0.9   7.1  22.1  17.1]
 [ -6.3  -3.3  -7.3  -4.3  -0.3  11.7   9.7]
 [-10.7 -16.7  -4.7  -7.7   0.3  14.3  25.3]]
7.106 7.675
```

The last line shows a detail that trips people up. NumPy's `std` and `var` divide by N, the number of values, by default; the reference calls this the "population" standard deviation. The "sample" standard deviation, which most statistics books, spreadsheets and pandas use, divides by N - 1: pass `ddof=1`.

## Where the extremes are, and running totals

`argmax` and `argmin` return the **position** of the largest or smallest value, not the value. Positions can then index another array. Still with `hires`:

```python
days = np.array(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
busiest = hires.argmax(axis=1)
print(busiest, days[busiest])
print(hires.argmin(), hires.ravel()[hires.argmin()])
print(hires[0].cumsum())
```

```text
[5 5 6] ['Sat' 'Sat' 'Sun']
9 11
[ 34  75 113 165 225 300 370]
```

- `days[busiest]` is fancy indexing (lesson 6): the busiest day of each station.
- Without `axis`, `argmin` counts positions in the flattened array: 9 is row 1, column 2.
- `cumsum` is the **cumulative sum**, the running total through the week. It keeps the array's length.

## Medians and percentiles

The **median** is the middle value of the sorted data: half the values are below it. Unlike the mean, one extreme value hardly moves it. A **percentile** generalises it: the 75th percentile is the value below which 75% of the data lies. `np.percentile` takes percentages from 0 to 100; `np.quantile` takes the same as fractions from 0 to 1:

```python
print(np.median(hires, axis=1))
print(np.percentile(hires[2], [25, 50, 75]), np.quantile(hires[2], 0.9))
```

```text
[52. 15. 61.]
[56.5 61.  73. ] 84.4
```

When a percentile falls between two data values, the default method, `"linear"`, interpolates between them, which is why 56.5 and 84.4 are not in the data. The 50th percentile is the median.

## Missing values: the `nan` functions

Lesson 3 showed that NaN spreads through arithmetic. One missing reading makes the whole sum, mean or maximum NaN. The **NaN-aware** versions, `np.nansum`, `np.nanmean`, `np.nanmax`, `np.nanmin`, `np.nanstd`, `np.nanmedian` and the rest, skip NaN and summarise what is left:

```python
import numpy as np

# Hourly river flow in cubic metres per second; the gauge missed two readings
flow = np.array([3.2, 3.4, np.nan, 3.9, 4.4, np.nan, 5.1])
print(flow.sum(), flow.mean(), flow.max())
print(np.nansum(flow), np.nanmean(flow).round(3), np.nanmax(flow))
print(np.count_nonzero(~np.isnan(flow)), np.nanmedian(flow))
two_gauges = np.array([[3.2, np.nan, 3.9], [np.nan, np.nan, np.nan]])
print(np.nanmean(two_gauges, axis=1))
```

```text
nan nan nan
20.0 4.0 5.1
5 3.9
/tmp/work/ex.py:9: RuntimeWarning: Mean of empty slice
  print(np.nanmean(two_gauges, axis=1))
[3.55  nan]
```

`np.nanmean` divides by the five real readings, not seven. `np.count_nonzero` counts the `True` values of the mask, the readings you actually have. A row with no values at all still gives NaN, with a warning: there is nothing to average.

## Sorting and `argsort`

`np.sort(arr)` returns a sorted copy. The method `arr.sort()` sorts the array **in place** and returns `None`, like `list.sort`. `np.argsort` returns the positions that would sort the array, so you can put a second array in the same order:

```python
import numpy as np

times = np.array([48.2, 51.9, 47.5, 50.3, 47.5])
names = np.array(["Ada", "Ben", "Cleo", "Dev", "Eli"])
print(np.sort(times), times)
order = np.argsort(times, kind="stable")
print(order, names[order])
print(names[np.argsort(-times, kind="stable")])
result = times.sort()
print(result, times)
```

```text
[47.5 47.5 48.2 50.3 51.9] [48.2 51.9 47.5 50.3 47.5]
[2 4 0 3 1] ['Cleo' 'Eli' 'Ada' 'Dev' 'Ben']
['Ben' 'Dev' 'Ada' 'Cleo' 'Eli']
None [47.5 47.5 48.2 50.3 51.9]
```

`names[order]` is the finishing order of a race. Cleo and Eli tied on 47.5; `kind="stable"` guarantees that tied values keep their original order, which makes results repeatable. For descending order, sort the negated values, as in the third line, which keeps ties stable. On a table, `np.sort(grid, axis=0)` sorts each column and `axis=1`, the default, each row.

## Counting values with `np.unique`

`np.unique` returns the distinct values, sorted. With `return_counts=True` it also returns how often each appears:

```python
import numpy as np

# Answers to "How did you get to work today?"
answers = np.array(["bus", "bike", "car", "bus", "walk", "bus", "bike", "car", "bus"])
modes, counts = np.unique(answers, return_counts=True)
print(modes)
print(counts)
print(modes[counts.argmax()])
```

```text
['bike' 'bus' 'car' 'walk']
[2 4 2 1]
bus
```

The two arrays line up: `bike` twice, `bus` four times. `counts.argmax()` finds the most common answer.

## Common mistakes

- **Using the result of `arr.sort()`.** `y = x.sort()` sets `y` to `None`. Use `y = np.sort(x)`.
- **Forgetting `keepdims` or a new axis.** `hires - hires.mean(axis=1)` raises `ValueError: operands could not be broadcast together with shapes (3,7) (3,)`.
- **Expecting the sample standard deviation.** `std()` divides by N; pass `ddof=1` to match pandas and spreadsheets.
- **Plain `sum` on data with NaN.** The result is NaN. Use `np.nansum`, and report how many values were missing.
- **Reversing `argsort` for descending order.** `order[::-1]` also reverses the order of ties; `np.argsort(-values, kind="stable")` keeps them.

## Practice

`steps = np.array([[8200, 10450, 6900, np.nan, 12010], [5400, 6100, np.nan, 7300, 6800]])` holds two people's daily steps, with days the tracker was not worn.

1. Each person's average, ignoring missing days.
2. The higher value of each day, ignoring missing days.
3. On which day did the first person walk the most?
4. Count the grades `["B", "A", "C", "B", "B", "A", "D"]` and list them from most to least common, ties in alphabetical order.

### Answers

```python
import numpy as np

steps = np.array([[8200, 10450, 6900, np.nan, 12010], [5400, 6100, np.nan, 7300, 6800]])
print(np.nanmean(steps, axis=1).round(1))
print(np.nanmax(steps, axis=0))
print(np.nanargmax(steps[0]))
grades = np.array(["B", "A", "C", "B", "B", "A", "D"])
values, counts = np.unique(grades, return_counts=True)
print(values[np.argsort(-counts, kind="stable")])
```

```text
[9390. 6400.]
[ 8200. 10450.  6900.  7300. 12010.]
4
['B' 'A' 'C' 'D']
```

`np.nanargmax` is the NaN-aware `argmax`. `np.unique` returns the grades in alphabetical order, so a stable sort on the negated counts puts the most common first and keeps C before D.

## Key takeaways

- `sum`, `mean`, `min`, `max`, `std` and `var` summarise the whole array or, with `axis`, along one axis; `keepdims=True` keeps the result broadcastable.
- `argmax` and `argmin` give positions; `cumsum` gives running totals.
- `median`, `percentile` (0 to 100) and `quantile` (0 to 1) describe the spread without being pulled by extremes.
- The `nan` functions skip missing values; plain ones return NaN.
- `np.sort` returns a copy, `arr.sort()` sorts in place; `argsort` orders other arrays; `np.unique(..., return_counts=True)` counts values.

## Further reading

- [Statistics routines](https://numpy.org/doc/stable/reference/routines.statistics.html)
- [numpy.std](https://numpy.org/doc/stable/reference/generated/numpy.std.html)
- [numpy.percentile](https://numpy.org/doc/stable/reference/generated/numpy.percentile.html)
- [numpy.unique](https://numpy.org/doc/stable/reference/generated/numpy.unique.html)
