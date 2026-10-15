Write the three functions of `solution.py`. A **daily** array is a one-dimensional integer
array of cups sold per day, day 0 a Monday, covering whole weeks only, so its length is a
multiple of 7. No function uses a loop or changes the arrays it is given.

1. `by_week(daily)` returns the same counts as a two-dimensional array of shape `(weeks, 7)`:
   one row per week, in order, and one column per day of the week, Monday first. Let NumPy
   work out the number of weeks.
2. `weekday_totals(daily)` returns a one-dimensional array of 7 values: the total for each day
   of the week over all the weeks, Monday first.
3. `side_by_side(station, pier)` receives two daily arrays of the same length, one per tea
   room, and returns a two-dimensional array of shape `(days, 2)`: one row per day, the
   station's count in column 0 and the pier's in column 1.

Example:

```python
daily = np.array([40, 35, 38, 42, 55, 80, 72, 41, 33, 39, 45, 60, 85, 70])
by_week(daily)
# array([[40, 35, 38, 42, 55, 80, 72],
#        [41, 33, 39, 45, 60, 85, 70]])
weekday_totals(daily)   # array([ 81,  68,  77,  87, 115, 165, 142])
side_by_side(np.array([40, 35, 38]), np.array([22, 19, 25]))
# array([[40, 22],
#        [35, 19],
#        [38, 25]])
```

**Tips.** `reshape` fills rows first and accepts one `-1`. The axis you sum along is the one
that disappears from the shape. `np.stack` joins along a new axis, and its `axis=` says where
that axis goes; `hstack` would join the two arrays end to end.
