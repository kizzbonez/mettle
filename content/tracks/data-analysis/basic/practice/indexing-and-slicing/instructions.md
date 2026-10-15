Write the three functions of `solution.py` with indexes and slices only (no loops). `loans` is
a two-dimensional integer array with one row per branch and **7 columns**, one per day from
Monday (column 0) to Sunday (column 6). `branch` is a row position, and a negative one counts
from the end as usual.

1. `weekend(loans)` returns the Saturday and Sunday columns of every branch, shape
   `(branches, 2)`, as a **view** of `loans`: no data is copied.
2. `newest_first(loans, branch)` returns that branch's seven counts in reverse order, Sunday
   first, as a one-dimensional **view** of `loans`.
3. `closed_early_week(loans, branch)` returns a **new** array, the same shape and dtype as
   `loans`, in which that branch's Monday, Tuesday and Wednesday counts are `0` (it was closed
   for staff training) and every other count is as in `loans`. `loans` itself must not
   change.

Example:

```python
loans = np.array([
    [52, 48, 50, 61, 70, 95, 40],
    [30, 28, 35, 33, 41, 60, 22],
    [12, 15, 11, 14, 19, 25, 0],
])
weekend(loans)
# array([[95, 40],
#        [60, 22],
#        [25,  0]])
newest_first(loans, 1)        # array([22, 60, 41, 33, 35, 28, 30])
closed_early_week(loans, -1)
# array([[52, 48, 50, 61, 70, 95, 40],
#        [30, 28, 35, 33, 41, 60, 22],
#        [ 0,  0,  0, 14, 19, 25,  0]])
loans[2, 0]                    # still 12
```

**Tips.** Slices give views; `np.shares_memory(a, b)` tells you whether two arrays share data.
An integer index removes its axis, and a negative step walks backwards. Assigning to a slice
writes into the array it belongs to, so change a `.copy()`, never a slice of `loans` or
`loans` itself.
