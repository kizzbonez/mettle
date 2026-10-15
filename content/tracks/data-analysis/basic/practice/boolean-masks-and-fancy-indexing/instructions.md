Write the three functions of `solution.py` with boolean masks, `np.where` and `np.nonzero`:
no loops, no comprehensions. `minutes` is a one-dimensional float array with the length of
each hire in minutes, in the order the hires started. No function changes `minutes`.

1. `fair_rides(minutes)` returns the hires of **at least 2 and at most 180** minutes, both
   limits included, in their original order.
2. `fees(minutes)` returns a float array with the fee of every hire, the same length as
   `minutes`: `0.0` for a hire under 2 minutes, `1.5` for 2 to 30 minutes (both included), and
   `4.0` for anything longer than 30 minutes.
3. `overdue(minutes)` returns the **positions** of the hires longer than 180 minutes, as an
   integer array in ascending order; an empty integer array when there are none.

Example:

```python
minutes = np.array([12.5, 1.0, 45.0, 30.0, 200.0, 2.0, 181.5, 0.5])
fair_rides(minutes)   # array([12.5, 45. , 30. ,  2. ])
fees(minutes)         # array([1.5, 0. , 4. , 1.5, 4. , 1.5, 4. , 0. ])
overdue(minutes)      # array([4, 6])
```

**Tips.** Combine conditions with `&` and `|`, each comparison in its own parentheses; `and`
and `or` raise `ValueError` on arrays. A third choice needs one `np.where` inside another.
`np.nonzero` returns a tuple with one array per axis.
