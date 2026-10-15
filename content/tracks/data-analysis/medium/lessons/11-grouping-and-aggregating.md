---
title: Grouping and Aggregating
summary: Answer "per what?" questions with split-apply-combine. Group by one or several columns, tell `size` from `count`, compute several statistics with `agg`, name the result columns with named aggregation, keep the keys as columns with `as_index=False`, sort the result, and use `value_counts` as a shortcut.
minutes: 40
objectives:
  - Explain split-apply-combine and compute a per-group sum or mean with `groupby`
  - Tell `size` (rows per group) from `count` (values present per group)
  - Group by several columns and get a flat result with `as_index=False`
  - Compute several statistics with `agg`, and name output columns with named aggregation
  - Sort a grouped result and use `value_counts` for counts per category
---

## Outline

1. Split, apply, combine
2. `size` and `count`
3. Several keys and `as_index=False`
4. Several statistics with `agg`
5. Named aggregation
6. Sorting results and `value_counts`

## Split, apply, combine

A bicycle repair workshop logs every job: who did it, what kind, how long it took, the charge,
and the customer's rating (not every customer gives one):

```python
import io

import pandas as pd

jobs_csv = """mechanic,job,minutes,charge,rating
Ola,puncture,20,12.0,5
Sam,brakes,45,35.0,4
Ola,gears,60,40.0,
Kim,puncture,15,12.0,5
Sam,puncture,25,12.0,3
Kim,brakes,50,35.0,4
Ola,brakes,40,35.0,5
Sam,gears,75,40.0,
Kim,gears,55,40.0,4
Ola,puncture,18,12.0,4
"""
jobs = pd.read_csv(io.StringIO(jobs_csv))
by_mechanic = jobs.groupby("mechanic")
print(by_mechanic["charge"].sum())
print(by_mechanic["minutes"].mean().round(1))
```

```text
mechanic
Kim    87.0
Ola    99.0
Sam    87.0
Name: charge, dtype: float64
mechanic
Kim    40.0
Ola    34.5
Sam    48.3
Name: minutes, dtype: float64
```

"How much did each mechanic take?" is a **per-group** question. `groupby` answers it in three
steps, known as **split-apply-combine**:

1. **Split** the rows into groups by the value of `mechanic`: Kim's three jobs, Ola's four, Sam's
   three.
2. **Apply** a function to the chosen column in each group: here `sum`, then `mean`.
3. **Combine** the results into one Series whose index is the group keys, **sorted**.

`jobs.groupby("mechanic")` alone computes nothing; it returns a `DataFrameGroupBy` object that
remembers how to split. Selecting `["charge"]` on it and calling a method does the work. One
statement replaces a loop over the mechanics with a filter and a sum for each.

## `size` and `count`

Two ways of counting give different answers when values are missing:

```python
print(jobs.groupby("mechanic").size())
print(jobs.groupby("mechanic")["rating"].count())
print(jobs.groupby("mechanic")["rating"].mean())
```

```text
mechanic
Kim    3
Ola    4
Sam    3
dtype: int64
mechanic
Kim    3
Ola    3
Sam    2
Name: rating, dtype: int64
mechanic
Kim    4.333333
Ola    4.666667
Sam    3.500000
Name: rating, dtype: float64
```

- `size()` counts **rows** in each group, whatever they contain: Ola did four jobs.
- `count()` counts **values present** in a column: only three of Ola's jobs were rated.
- `mean` skips the missing ratings, as in lesson 7: Ola's 4.67 is the mean of three ratings.

Use `size` for "how many jobs", `count` for "how many ratings". `count()` on the whole grouped
frame gives the present values of every column, one column each.

## Several keys and `as_index=False`

Pass a list to group by combinations of values. By default the keys become the index of the
result; `as_index=False` keeps them as ordinary columns instead:

```python
print(jobs.groupby(["job", "mechanic"])["minutes"].mean().head(4))
print(jobs.groupby(["job", "mechanic"], as_index=False)["minutes"].mean().head(4))
```

```text
job     mechanic
brakes  Kim         50.0
        Ola         40.0
        Sam         45.0
gears   Kim         55.0
Name: minutes, dtype: float64
      job mechanic  minutes
0  brakes      Kim     50.0
1  brakes      Ola     40.0
2  brakes      Sam     45.0
3   gears      Kim     55.0
```

The first result has an index with two levels, a **MultiIndex**; the advanced level works with it.
The second is a plain DataFrame with a RangeIndex, easy to filter, merge and write to a file. When
in doubt, use `as_index=False`, or call `reset_index()` on the result, which does the same.

## Several statistics with `agg`

`agg` with a list of function names computes all of them per group, one column each:

```python
print(jobs.groupby("job")["minutes"].agg(["count", "mean", "min", "max"]))
```

```text
          count       mean  min  max
job                                 
brakes        3  45.000000   40   50
gears         3  63.333333   55   75
puncture      4  19.500000   15   25
```

The names are the strings pandas knows: `"sum"`, `"mean"`, `"median"`, `"min"`, `"max"`,
`"std"`, `"count"`, `"size"`, `"nunique"`, `"first"`, `"last"`. Gears jobs take the longest, more
than three times a puncture.

## Named aggregation

A report usually needs different statistics of different columns, under clear names. **Named
aggregation** does that: each keyword argument of `agg` is an output column, and its value is a
tuple `(input column, function)`:

```python
summary = jobs.groupby("mechanic").agg(
    jobs=("job", "size"),
    hours=("minutes", "sum"),
    takings=("charge", "sum"),
    avg_rating=("rating", "mean"),
)
summary["hours"] = (summary["hours"] / 60).round(2)
print(summary.sort_values(["takings", "avg_rating"], ascending=False))
```

```text
          jobs  hours  takings  avg_rating
mechanic                                  
Ola          4   2.30     99.0    4.666667
Kim          3   2.00     87.0    4.333333
Sam          3   2.42     87.0    3.500000
```

- One `agg` call built four columns from four input columns, each with its own function, and
  named them as you chose. This is the form to reach for in reports.
- The result is an ordinary DataFrame, so the `hours` conversion is plain column arithmetic from
  lesson 6.
- `pd.NamedAgg(column="charge", aggfunc="sum")` is a longer spelling of the same tuple, found in
  older code.
- With `as_index=False`, `mechanic` would be a column instead of the index.

## Sorting results and `value_counts`

Group keys come out sorted alphabetically. To rank groups, sort the result by its values, with a
second column to break ties, as above: Kim and Sam both took 87.0, and the better-rated Kim comes
first.

To count rows per category, `value_counts` is a shortcut for `groupby(...).size()` that sorts by
count, largest first:

```python
print(jobs["job"].value_counts())
print(jobs.value_counts(["mechanic", "job"]).head(3))
```

```text
job
puncture    4
brakes      3
gears       3
Name: count, dtype: int64
mechanic  job     
Ola       puncture    2
Sam       brakes      1
Ola       gears       1
Name: count, dtype: int64
```

On a DataFrame, `value_counts` with a list of columns counts each combination.

## Common mistakes

- **Aggregating text.** `jobs.groupby("mechanic").mean()` tries every column, including `job`, and
  raises `TypeError: dtype 'str' does not support operation 'mean'`. Select the numeric columns
  first, `jobs.groupby("mechanic")[["minutes", "charge"]].mean()`, or pass `numeric_only=True`.
- **`count` for the number of rows.** `count` skips missing values. Use `size` to count rows.
- **Rows with a missing key disappear.** A job whose `mechanic` is empty belongs to no group and is
  left out of every result. Pass `dropna=False` to get a NaN group, or fill the key first.
- **Expecting the original order.** Keys are sorted. Pass `sort=False` to keep the order of first
  appearance, or sort the result by value.
- **Losing the keys in a merge or file.** A grouped result keeps the keys in its index. Use
  `as_index=False` or `reset_index()` before `to_csv(index=False)`.

## Practice

1. Which job type brings in the most money? Print the total charge per job, highest first.
2. Print each mechanic's shortest and longest job in minutes.
3. Build one row per job type with columns `job`, `jobs` (number of jobs), `mechanics` (how many
   different mechanics did it) and `rated` (how many ratings).

### Answers

```python
print(jobs.groupby("job")["charge"].sum().sort_values(ascending=False))
print(jobs.groupby("mechanic")["minutes"].agg(["min", "max"]))
per_job = jobs.groupby("job", as_index=False).agg(
    jobs=("mechanic", "size"),
    mechanics=("mechanic", "nunique"),
    rated=("rating", "count"),
)
print(per_job)
```

```text
job
gears       120.0
brakes      105.0
puncture     48.0
Name: charge, dtype: float64
          min  max
mechanic          
Kim        15   55
Ola        18   60
Sam        25   75
        job  jobs  mechanics  rated
0    brakes     3          3      3
1     gears     3          3      1
2  puncture     4          3      4
```

Punctures are the most frequent job but bring in the least. In the last answer, `size` counts
rows and `count` counts present ratings: only one of three gears jobs was rated.

## Key takeaways

- `df.groupby(key)[column].func()` splits rows by key, applies `func` per group and combines the
  results, indexed by the sorted keys.
- `size` counts rows per group; `count` counts values present; `mean` and `sum` skip gaps.
- Several keys give a MultiIndex; `as_index=False` or `reset_index()` gives a flat frame.
- `agg(["mean", "max"])` computes several statistics; named aggregation,
  `agg(name=("column", "func"))`, chooses columns, functions and names at once.
- Sort grouped results by value to rank groups; `value_counts` counts categories directly.

## Further reading

- [pandas user guide: Group by (split-apply-combine)](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [pandas user guide: Named aggregation](https://pandas.pydata.org/docs/user_guide/groupby.html#named-aggregation)
- [pandas.DataFrame.groupby](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.groupby.html)
- [pandas.DataFrame.value_counts](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.value_counts.html)
