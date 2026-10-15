Write `solution.py` with NumPy only (no pandas). The starter declares the six functions the
tests call: keep their names and parameters. You may add helper functions. June's file is
`data/june.csv`; `data/july.csv` has the same layout with four strings instead of six.

**The file.** The first line is a header, `day,s1,s2,...`. Every other line is one day: the
day of the month, then one reading per string in kWh, separated by commas. A reading may be
empty or the text `ERR`, and a day may have every reading empty.

**Arrays.** Every function below works on an **energy array**: a two-dimensional float array
with one row per day (row 0 is the 1st of the month) and one column per string (column 0 is
`s1`). NaN marks a missing reading. Functions must not change the arrays they are given.

1. **`load_energy(path)`** reads the file at `path` and returns its energy array: dtype
   `float64`, shape `(days, strings)`, **without** the day column. Empty fields and `ERR`
   become NaN. For June the shape is `(30, 6)`.
2. **`clean(energy, capacity)`** returns a new energy array, the same shape, in which every
   reading below 0 or above `capacity` is NaN. Readings of exactly 0 or exactly `capacity`
   are kept, and NaN stays NaN.
3. **`daily_totals(energy)`** returns a one-dimensional float array with one value per day:
   the sum of that day's readings, ignoring NaN, rounded to 2 decimal places. A day with no
   readings at all is NaN, not 0. A day whose readings are all 0.0 is 0.0. An energy array
   with no rows gives an empty array.
4. **`relative_output(energy)`** returns a float array of the same shape: each reading
   divided by the **median** of that day's readings (ignoring NaN), rounded to 3 decimal
   places. A NaN reading stays NaN. If a day's median is 0 or NaN, every value of that day
   is NaN.
5. **`underperformers(energy, threshold=0.8)`** returns the column positions of the strings
   whose median relative output over all days (the median of each column of
   `relative_output(energy)`, ignoring NaN) is below `threshold`, as an integer array in
   ascending order. A string whose relative output is NaN on every day is not listed. If
   no string qualifies, return an empty integer array.
6. **`spot_check_days(energy, k, seed)`** picks `k` different days for the electrician. Only
   days with at least one reading (not every value NaN) may be picked. Build the
   **candidates**, an integer array of the row positions of those days in ascending order;
   create `rng = np.random.default_rng(seed)`; make exactly one draw,
   `rng.choice(candidates, size=k, replace=False)`; and return the picked row positions
   sorted in ascending order. If `k` is larger than the number of candidates, `choice`
   raises `ValueError`: let it propagate.

NumPy may print `RuntimeWarning: All-NaN slice encountered` for a day with no readings.
That is expected and does not fail a test.

**Example.** Five days and three strings, with a capacity of 12 kWh:

```python
energy = np.array([
    [6.2, 6.5, 4.4],
    [np.nan, np.nan, np.nan],
    [8.5, -1.0, 6.1],
    [0.0, 0.0, 3.2],
    [9.4, 31.0, 5.1],
])
cleaned = clean(energy, 12.0)
# array([[6.2, 6.5, 4.4],
#        [nan, nan, nan],
#        [8.5, nan, 6.1],
#        [0. , 0. , 3.2],
#        [9.4, nan, 5.1]])
daily_totals(cleaned)        # array([17.1,  nan, 14.6,  3.2, 14.5])
relative_output(cleaned)
# array([[1.   , 1.048, 0.71 ],
#        [  nan,   nan,   nan],
#        [1.164,   nan, 0.836],
#        [  nan,   nan,   nan],      the median of 0.0, 0.0, 3.2 is 0
#        [1.297,   nan, 0.703]])
underperformers(cleaned)      # array([2]): the median of 0.71, 0.836, 0.703 is 0.71
underperformers(cleaned, 0.7) # array([], dtype=int64)
spot_check_days(cleaned, 2, 7)  # array([3, 4]); the candidates were [0, 2, 3, 4]
load_energy("data/june.csv").shape  # (30, 6)
```

**Tips.** `np.genfromtxt` reads the file, and slicing drops the day column. Masks with `|`
and `np.isnan` do the cleaning; work on a `.copy()`. `np.nansum`, `np.nanmedian` (with
`keepdims=True`, so the medians broadcast against the rows), `np.errstate`, `np.where`,
`np.round` and `np.nonzero` do the rest. An all-NaN row is `np.isnan(energy).all(axis=1)`.
