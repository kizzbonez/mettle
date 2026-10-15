Write the four functions of `solution.py`. None of them may change its input. The sample is
`data/bookings.csv`: one row per booking, with the columns `hostel`, `month` (text such as
`2026-07`) and `nights` (`int64`). A hostel can have several bookings in a month.

1. `monthly_table(bookings)` returns a DataFrame with a two-level **MultiIndex** named
   `hostel` and `month`, one row per pair that has bookings, sorted by hostel, then month,
   and two `int64` columns: `nights`, the total nights, and `stays`, the number of bookings
   (a booking of 0 nights counts).
2. `window(table, first, last, month_from, month_to)` takes a table like the result of step 1,
   **in any row order**, and returns its rows whose hostel is from `first` to `last` and whose
   month is from `month_from` to `month_to`, both ends included, with all columns and the
   MultiIndex, sorted. The ends need not be labels in the table (`"B"` to `"M"` takes every
   hostel from `Bay` to `Linn`). When no row is in range, the result has no rows.
3. `month_ranking(table, month)` takes the same kind of table and returns a Series named
   `nights` with one entry per hostel that has a row for `month`: its nights that month. The
   index holds the hostels (named `hostel`). Order: most nights first, and hostels with the
   same nights in alphabetical order.
4. `flat(table)` returns an ordinary DataFrame with one row per hostel of the table, sorted,
   and the index `0, 1, 2, ...`: the column `hostel`, then one column per month (sorted)
   holding the hostel's `nights` that month, `0` where it has no row (`int64`). The name of
   the column index does not matter.

Example:

```python
bookings = pd.read_csv("data/bookings.csv")
table = monthly_table(bookings)
print(table.head(4))
print(window(table, "Glen", "Moor", "2026-07", "2026-08"))
print(month_ranking(table, "2026-07"))
print(flat(table))
```

```text
                 nights  stays
hostel  month                 
Coastal 2026-06       2      1
        2026-07       7      2
        2026-08       3      1
Glen    2026-06       1      1
                 nights  stays
hostel  month                 
Glen    2026-07       3      1
        2026-08       7      1
Harbour 2026-07       6      2
        2026-08       5      1
Moor    2026-07       6      2
hostel
Coastal    7
Harbour    6
Moor       6
Glen       3
Name: nights, dtype: int64
month   hostel  2026-06  2026-07  2026-08
0      Coastal        2        7        3
1         Glen        1        3        7
2      Harbour        0        6        5
3         Moor        3        6        0
```

**Tips.** `pd.IndexSlice` writes one slice per level, `idx[first:last, month_from:month_to]`,
and slicing raises `UnsortedIndexError` unless you `sort_index()` first. `xs` selects on an
inner level by name. A stable sort (`kind="stable"`) keeps the order that ties already have.
`unstack` takes `fill_value`.
