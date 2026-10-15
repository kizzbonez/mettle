Write the three functions of `solution.py`. Each takes `harvests`, a DataFrame with the columns
`plot` (text), `crop` (text) and `kg` (float, **missing** when a picking was not weighed), and
must not change it. Every row has a plot. The sample log is `data/harvests.csv`.

1. `plot_summary(harvests)` returns one row per plot, sorted by plot, with the index named
   `plot` and these columns, in this order (use named aggregation):
   - `total_kg`: the sum of the plot's weighed kg, rounded to 2 decimals (`0.0` for a plot
     with nothing weighed);
   - `heaviest_kg`: the plot's largest kg (missing for a plot with nothing weighed);
   - `pickings`: the number of rows of the plot, weighed or not (`int64`);
   - `weighed`: the number of rows of the plot that have a kg (`int64`).
2. `add_plot_columns(harvests)` returns a **new** DataFrame with the same rows and index
   labels, holding the columns of `harvests` followed by:
   - `kg_filled`: `kg`, with a missing value replaced by the mean kg of the weighed pickings of
     **the same plot** (not rounded). A plot with nothing weighed stays missing;
   - `share`: `kg_filled` divided by the total `kg_filled` of its plot, rounded to 3 decimals;
   - `pick_no`: the picking's number within its plot, in the order of the rows: `1` for the
     plot's first row, then `2`, `3`, ... (`int64`).
3. `regular_plots(harvests, min_pickings)` returns every row of the plots that have **at
   least** `min_pickings` rows (weighed or not), in their original order with their index
   labels and all their columns. When no plot qualifies, the result has no rows.

Example:

```python
harvests = pd.read_csv("data/harvests.csv")
print(plot_summary(harvests))
print(add_plot_columns(harvests).head(6))
regular_plots(harvests, 3)["plot"].unique().tolist()   # ['A3', 'B1', 'C2']: D4 has one picking
```

```text
      total_kg  heaviest_kg  pickings  weighed
plot                                          
A3         4.6          2.6         4        3
B1        10.5          4.5         3        3
C2         1.4          1.4         3        1
D4         5.0          5.0         1        1
  plot        crop   kg  kg_filled  share  pick_no
0   A3       beans  1.2   1.200000  0.196        1
1   B1    potatoes  4.5   4.500000  0.429        1
2   A3  courgettes  2.6   2.600000  0.424        2
3   C2      onions  NaN   1.400000  0.333        1
4   B1    potatoes  3.9   3.900000  0.371        2
5   A3       beans  NaN   1.533333  0.250        3
```

Row 5 is filled with 1.533333, the mean of A3's weighed pickings (1.2, 2.6 and 0.8), not the
mean of the whole log.

**Tips.** In named aggregation `size` counts rows and `count` counts values present.
`groupby(...)["kg"].transform("mean")` gives every row its plot's mean, ready for `fillna`, and
a Series can be grouped by another column with `filled.groupby(harvests["plot"])`. `cumcount`
numbers the rows of each group from 0. A `transform("size")` mask keeps whole groups, as
`filter` does.
