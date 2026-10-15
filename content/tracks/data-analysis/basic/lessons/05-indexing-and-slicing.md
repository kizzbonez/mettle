---
title: Indexing and Slicing
summary: Pick out single elements, rows, columns and blocks of one- and two-dimensional arrays with indexes and slices, and learn the rule that surprises everyone coming from lists. A slice of an array is a view of the same data, so changing it changes the original.
minutes: 35
objectives:
  - Index one- and two-dimensional arrays, including from the end with negative indexes
  - Slice with start, stop and step, including negative steps, along each axis
  - Explain why `a[i, j]` is preferred to `a[i][j]`
  - Tell a view from a copy with `np.shares_memory` and `.base`, and make an independent copy with `.copy()`
  - Assign to an element, a slice or a whole row, and predict the effect on the original array
---

## Outline

1. Indexing and slicing one dimension
2. Two dimensions: `a[i, j]`
3. Views: a slice shares the data
4. Copies with `.copy()`
5. Assigning to a slice

## Indexing and slicing one dimension

A one-dimensional array is indexed like a list. An **index** picks one element, counting from 0, and a negative index counts from the end. A **slice** `start:stop:step` picks a range: `start` is included, `stop` is not, and each part may be left out.

```python
import numpy as np

# River level in metres, one reading per day for ten days
level = np.array([1.2, 1.4, 1.9, 2.6, 3.1, 2.8, 2.2, 1.8, 1.5, 1.3])
print(level[0], level[3], level[-1])
print(level[2:5])
print(level[:3], level[7:])
print(level[::2])
print(level[-3:])
print(level[::-1])
```

```text
1.2 2.6 1.3
[1.9 2.6 3.1]
[1.2 1.4 1.9] [1.8 1.5 1.3]
[1.2 1.9 3.1 2.2 1.5]
[1.8 1.5 1.3]
[1.3 1.5 1.8 2.2 2.8 3.1 2.6 1.9 1.4 1.2]
```

- `level[2:5]` is days 2, 3 and 4: three elements, `stop - start`.
- `level[::2]` takes every second day, and `level[-3:]` the last three.
- A negative step walks backwards, so `level[::-1]` is the array reversed.

## Two dimensions: `a[i, j]`

A two-dimensional array takes one index or slice per axis, separated by a comma: rows first, then columns.

```python
import numpy as np

# Electricity use in kWh: one row per flat, one column per month (Jan to Jun)
kwh = np.array([
    [310, 295, 260, 210, 180, 150],
    [420, 400, 350, 300, 240, 220],
    [190, 185, 170, 160, 150, 140],
])
print(kwh[1, 4], kwh[1][4], kwh[-1, -1])
print(kwh[1])
print(kwh[:, 0])
print(kwh[0:2, 3:])
print(kwh[:, ::2])
print(kwh[1].shape, kwh[1:2].shape)
```

```text
240 240 140
[420 400 350 300 240 220]
[310 420 190]
[[210 180 150]
 [300 240 220]]
[[310 260 180]
 [420 350 240]
 [190 170 150]]
(6,) (1, 6)
```

- `kwh[1, 4]` is flat 1 in May. `kwh[1][4]` gives the same value, but in two steps: `kwh[1]` builds a temporary array for the row, which is then indexed with 4. The NumPy guide calls the second form less efficient; write `a[i, j]`.
- `kwh[1]` is a whole row. A missing index means "all of this axis", so `kwh[1]` is short for `kwh[1, :]`.
- `kwh[:, 0]` is a column: every row, column 0. That is January for each flat.
- `kwh[0:2, 3:]` is a block: the first two flats, April to June. `kwh[:, ::2]` takes every second month.
- An integer index removes its axis, a slice keeps it: `kwh[1]` has shape `(6,)`, but `kwh[1:2]` is a table of one row, shape `(1, 6)`.

## Views: a slice shares the data

Slicing a Python list makes a new list. Slicing an array does not copy anything. It returns a **view**: a new array object that looks at the same data in memory. The NumPy guide states that basic indexing, meaning integers and slices, always creates views:

```python
import numpy as np

level = np.array([1.2, 1.4, 1.9, 2.6, 3.1, 2.8])
peak = level[2:5]
peak[0] = 99.0
print(level)
print(np.shares_memory(peak, level), peak.base is level)
```

```text
[ 1.2  1.4 99.   2.6  3.1  2.8]
True True
```

Writing 99 into `peak[0]` wrote it into `level[2]`, because they are the same piece of memory. Two ways to check:

- `np.shares_memory(a, b)` returns `True` when the two arrays use any of the same memory.
- `.base` is the array a view was made from, and `None` for an array that owns its data.

Views are why slicing is fast and cheap: taking `kwh[:, 0]` from a table of a billion values costs almost nothing. The price is that a change through a view is a change to the original.

## Copies with `.copy()`

When you need data you can change without touching the original, ask for a **copy**: `.copy()` duplicates the data into new memory.

```python
import numpy as np

level = np.array([1.2, 1.4, 1.9, 2.6, 3.1, 2.8])
safe = level[2:5].copy()
safe[0] = -1.0
print(level)
print(np.shares_memory(safe, level), safe.base)

alias = level
alias[-1] = 0.0
print(level, alias is level)
```

```text
[1.2 1.4 1.9 2.6 3.1 2.8]
False None
[1.2 1.4 1.9 2.6 3.1 0. ] True
```

`safe` owns its data, so `level` is untouched. Plain assignment, `alias = level`, copies nothing at all: as in the Python course, it binds a second name to the same object.

A copy is also the answer when you keep a small piece of a large array. A view keeps its whole base alive: `big[:3]` holds on to every byte of `big` for as long as the view exists. `big[:3].copy()` lets the large array be freed.

## Assigning to a slice

Assigning to an index or a slice writes into the array. The value can be one number, which fills every selected position, or an array of exactly the selected shape:

```python
import numpy as np

kwh = np.array([
    [310, 295, 260, 210, 180, 150],
    [420, 400, 350, 300, 240, 220],
    [190, 185, 170, 160, 150, 140],
])
kwh[:, 0] = 0
kwh[2, 3:] = [165, 155, 145]
kwh[1, 1:3] = 999.7
print(kwh)
```

```text
[[  0 295 260 210 180 150]
 [  0 999 999 300 240 220]
 [  0 185 170 165 155 145]]
```

- `kwh[:, 0] = 0` cleared the whole January column.
- The list of three filled the three selected cells.
- `999.7` was **cast** to the array's `int64` dtype, which truncated it to 999, without a warning.

The array's size never changes: a value of the wrong shape raises `ValueError: could not broadcast input array from shape (3,) into shape (2,)`. To fill a whole array in place, assign to `arr[:]`.

## Common mistakes

- **Expecting a slice to be a copy, as with lists.** `part = arr[0:2]; part[0] = 100` changes `arr`. Use `arr[0:2].copy()` when you will modify the piece and need the original intact.
- **Thinking `b = a` copies.** Both names point at one array. Use `b = a.copy()`.
- **Index out of range.** `kwh[0, 5]` on a table with two columns raises `IndexError: index 5 is out of bounds for axis 1 with size 2`. A slice past the end does not raise: `kwh[0:10]` returns the rows that exist.
- **Losing an axis by accident.** `kwh[1]` is one-dimensional; if later code expects a table, use `kwh[1:2]`.

## Practice

1. Lap times are `[62.1, 60.8, 61.5, 59.9, 60.2, 61.0, 63.4, 58.7]`. Print the last lap, every second lap starting with the second, and every second lap backwards from the second-to-last.
2. For `board = np.arange(1, 17).reshape(4, 4)`, select the middle 2 by 2 block, the last column, and the four corners.
3. Set the top-left 2 by 2 block of `board` to 0 through a view, and show that `board` changed.

### Answers

```python
import numpy as np

laps = np.array([62.1, 60.8, 61.5, 59.9, 60.2, 61.0, 63.4, 58.7])
print(laps[-1], laps[1::2], laps[-2::-2])
board = np.arange(1, 17).reshape(4, 4)
print(board[1:3, 1:3])
print(board[:, -1], board[::3, ::3])
corner = board[:2, :2]
corner[:] = 0
print(board[0], np.shares_memory(corner, board))
```

```text
58.7 [60.8 59.9 61.  58.7] [63.4 60.2 61.5 62.1]
[[ 6  7]
 [10 11]]
[ 4  8 12 16] [[ 1  4]
 [13 16]]
[0 0 3 4] True
```

1. `1::2` starts at index 1; `-2::-2` starts at the second-to-last and steps back two at a time.
2. A step of 3 on a length of 4 picks indexes 0 and 3 on each axis, the corners.
3. `corner` is a view, so `corner[:] = 0` wrote into `board`.

## Key takeaways

- Index with `a[i]` and `a[i, j]`; negative indexes count from the end.
- A slice `start:stop:step` keeps its axis, an integer index removes it.
- Slices are views: they share the original's data, so writing through them changes it.
- `np.shares_memory` and `.base` reveal views; `.copy()` makes an independent array.
- Assigning to a slice fills it with one value or an array of the same shape, cast to the array's dtype.

## Further reading

- [NumPy fundamentals: indexing on ndarrays](https://numpy.org/doc/stable/user/basics.indexing.html)
- [NumPy fundamentals: copies and views](https://numpy.org/doc/stable/user/basics.copies.html)
- [numpy.shares_memory](https://numpy.org/doc/stable/reference/generated/numpy.shares_memory.html)
