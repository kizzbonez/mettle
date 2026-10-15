Write the three functions of `solution.py` with NumPy's aggregations and sorting, no loops.
`scores` is a two-dimensional float array with one row per team and one column per week; NaN
means the team did not play that week. `names` is a string array with one name per team, in
the order of the rows. No function changes its arguments.

1. `team_totals(scores)` returns each team's season total, one float per team, ignoring the
   weeks it missed. A team that missed every week has a total of `0.0`.
2. `league_table(names, scores)` returns the names ordered by season total, **highest
   first**. Teams with the same total keep the order they have in `names`.
3. `week_medians(scores)` returns the median score of each week, one float per week, over the
   teams that played. Every week has at least one score.

Example:

```python
names = np.array(["Quizzly Bears", "Les Quizerables", "Know-It-Owls", "Table Six"])
scores = np.array([
    [19.0, 22.5, np.nan, 20.0],
    [21.0, 19.0, 24.0, 17.5],
    [15.5, np.nan, 20.0, 19.0],
    [21.0, 22.0, 18.5, np.nan],
])
team_totals(scores)          # array([61.5, 81.5, 54.5, 61.5])
league_table(names, scores)
# array(['Les Quizerables', 'Quizzly Bears', 'Table Six', 'Know-It-Owls'], dtype='<U15')
week_medians(scores)         # array([20., 22., 20., 19.])
```

The Quizzly Bears and Table Six tie on 61.5, so they stay in the order of `names`.

**Tips.** Plain `sum` and `median` give NaN as soon as one value is NaN; the `nan` functions
skip it. `np.argsort` gives the positions that sort an array, and those positions index
`names`. For highest first, sort the negated totals; `kind="stable"` keeps ties in order,
which reversing an ascending sort would not.
