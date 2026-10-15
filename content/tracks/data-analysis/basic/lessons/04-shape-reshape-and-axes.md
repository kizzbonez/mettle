---
title: Shape, Reshape and Axes
summary: Understand what an axis is, change an array's shape with `reshape`, flatten it, transpose it, add and remove axes of length one, and join and split arrays with `concatenate`, `stack`, `vstack`, `hstack` and `split`.
minutes: 35
objectives:
  - Explain what axis 0 and axis 1 mean for a two-dimensional array
  - Reshape an array, letting NumPy work out one length with `-1`
  - Flatten with `ravel` or `flatten`, transpose with `.T`, and add or remove length-one axes
  - Join arrays along an existing axis with `concatenate` or along a new one with `stack`
  - Split an array into equal parts or at chosen positions
---

## Outline

1. What an axis is
2. `reshape` and `-1`
3. `ravel` and `flatten`
4. Transposing, and axes of length one
5. Joining: `concatenate`, `stack`, `vstack`, `hstack`
6. Splitting

## What an axis is

An **axis** is one direction you can move through an array. A one-dimensional array has one axis, axis 0. A two-dimensional array has two: **axis 0** runs down the rows, and **axis 1** runs across the columns. The shape lists the length of each axis in that order.

Many functions take an `axis=` argument that says which direction to work along. Lesson 9 is about these functions; here `sum` only shows the direction:

```python
import numpy as np

# Minutes late: one row per bus route, one column per day (Mon to Thu)
delays = np.array([
    [2, 5, 0, 7],
    [1, 3, 4, 2],
    [6, 0, 1, 3],
])
print(delays.shape)
print(delays.sum(axis=0))
print(delays.sum(axis=1))
```

```text
(3, 4)
[ 9  8  5 12]
[14 10 10]
```

`axis=0` moves down the rows, adding the three routes together: one total per day, four values. `axis=1` moves across the columns: one total per route, three values. The axis you name is the one that **disappears** from the shape: `(3, 4)` summed along axis 0 leaves `(4,)`, along axis 1 leaves `(3,)`.

## `reshape` and `-1`

`arr.reshape(shape)` returns the same elements arranged in a new shape. NumPy reads them in **row-major order**, the last axis changing fastest, the way you read a page, and fills the new shape in the same order. The new shape must have the same number of elements, and one length may be `-1`, meaning "work this out from the rest":

```python
import numpy as np

hours = np.arange(12)
print(hours.reshape(3, 4))
print(hours.reshape(2, -1))
print(hours.reshape(2, 3, 2).shape)
table = hours.reshape(4, 3)
print(table.reshape(-1))
hours.reshape(5, -1)
```

```text
[[ 0  1  2  3]
 [ 4  5  6  7]
 [ 8  9 10 11]]
[[ 0  1  2  3  4  5]
 [ 6  7  8  9 10 11]]
(2, 3, 2)
[ 0  1  2  3  4  5  6  7  8  9 10 11]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 9, in <module>
    hours.reshape(5, -1)
    ~~~~~~~~~~~~~^^^^^^^
ValueError: cannot reshape array of size 12 into shape (5,newaxis)
```

`reshape(2, -1)` asks for two rows; 12 elements make the second length 6. `reshape(-1)` turns any array into one dimension. Twelve elements cannot fill five equal rows, so the last line fails. Reshaping is cheap: when it can, NumPy returns a **view**, a new array object that shares the original's data, instead of copying. Lesson 5 explains views.

## `ravel` and `flatten`

Both return a one-dimensional version of an array. The difference is whether you get the original data or a copy:

```python
import numpy as np

grid = np.array([[1, 2, 3], [4, 5, 6]])
flat_view = grid.ravel()
flat_copy = grid.flatten()
flat_view[0] = 100
flat_copy[1] = 200
print(flat_view, flat_copy)
print(grid)
```

```text
[100   2   3   4   5   6] [  1 200   3   4   5   6]
[[100   2   3]
 [  4   5   6]]
```

`ravel` returned a view when it could, so writing through it changed `grid`. `flatten` always copies, so `grid` never saw the 200. Use `ravel` to read; use `flatten` when you will change the result and must keep the original intact.

## Transposing, and axes of length one

The **transpose** swaps rows and columns: `arr.T`, or `np.transpose(arr)`. Sometimes you need an extra axis of length one, so that a list of prices becomes a single column. `np.newaxis` inside the brackets inserts one where you put it, as does `np.expand_dims(arr, axis)`. `squeeze` removes every axis of length one:

```python
import numpy as np

sales = np.array([[12, 30, 8], [15, 25, 11]])
print(sales.T)
print(sales.shape, sales.T.shape, np.transpose(sales).shape)
prices = np.array([2.5, 3.0, 4.0])
print(prices[np.newaxis, :].shape, prices[:, np.newaxis].shape)
print(np.expand_dims(prices, axis=1))
one_row = np.array([[7, 8, 9]])
print(one_row.shape, one_row.squeeze().shape)
```

```text
[[12 15]
 [30 25]
 [ 8 11]]
(2, 3) (3, 2) (3, 2)
(1, 3) (3, 1)
[[2.5]
 [3. ]
 [4. ]]
(1, 3) (3,)
```

`prices[np.newaxis, :]` is a **row vector**, shape `(1, 3)`; `prices[:, np.newaxis]` is a **column vector**, shape `(3, 1)`. The `:` means "all of this axis". They look like a trivial change now, but lesson 8 uses them to make arrays of different shapes work together.

## Joining: `concatenate`, `stack`, `vstack`, `hstack`

`np.concatenate` joins arrays along an **existing** axis, so the result has the same number of dimensions. `np.stack` joins them along a **new** axis, so the result has one more, and all inputs must have the same shape. `vstack` stacks vertically (more rows) and `hstack` horizontally:

```python
import numpy as np

week1 = np.array([[3, 4, 2], [5, 1, 0]])
week2 = np.array([[6, 2, 1], [0, 3, 4]])
print(np.concatenate([week1, week2]).shape)
print(np.concatenate([week1, week2], axis=1))
print(np.vstack([week1, week2]).shape, np.hstack([week1, week2]).shape)
print(np.stack([week1, week2]).shape)
mon = np.array([3, 5])
tue = np.array([4, 1])
print(np.stack([mon, tue]), np.stack([mon, tue], axis=1), sep="\n")
print(np.hstack([mon, tue]))
```

```text
(4, 3)
[[3 4 2 6 2 1]
 [5 1 0 0 3 4]]
(4, 3) (2, 6)
(2, 2, 3)
[[3 5]
 [4 1]]
[[3 4]
 [5 1]]
[3 5 4 1]
```

- Two `(2, 3)` tables concatenated along axis 0 give `(4, 3)`, along axis 1 `(2, 6)`. `vstack` and `hstack` are shorthands for these.
- `stack` puts the two tables one behind the other: `(2, 2, 3)`.
- For two one-dimensional arrays, `stack` makes them rows (`axis=0`) or columns (`axis=1`), while `hstack` simply joins them end to end.

Every join copies the data into a new array, so collect the pieces in a list and join once rather than joining inside a loop.

## Splitting

`np.split(arr, n)` cuts an array into `n` equal parts; `np.split(arr, [i, j])` cuts before positions `i` and `j`:

```python
import numpy as np

readings = np.arange(10, 100, 10)
morning, noon, evening = np.split(readings, 3)
print(morning, noon, evening)
print(np.split(readings, [2, 5]))
np.split(readings, 4)
```

```text
[10 20 30] [40 50 60] [70 80 90]
[array([10, 20]), array([30, 40, 50]), array([60, 70, 80, 90])]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 7, in <module>
    np.split(readings, 4)
    ~~~~~~~~^^^^^^^^^^^^^
  File "/usr/local/lib/python3.15/site-packages/numpy/lib/_shape_base_impl.py", line 854, in split
    raise ValueError(
        'array split does not result in an equal division') from None
ValueError: array split does not result in an equal division
```

`split` returns a list of arrays, which unpacks into names. Nine values cannot make four equal parts. `split` also takes `axis=`, to cut a table into groups of columns.

## Common mistakes

- **Expecting `reshape` to change the array.** `b.reshape(4)` alone does nothing to `b`; it returns a new array. Write `b = b.reshape(4)`.
- **Transposing a one-dimensional array.** `np.array([1, 2, 3]).T` is unchanged, shape `(3,)`. To get a column, use `[:, np.newaxis]` or `reshape(-1, 1)`.
- **Joining arrays with different numbers of dimensions.** `np.concatenate([table, row])` with a `(2, 2)` table and a `(2,)` row raises `ValueError: all the input arrays must have same number of dimensions`. `np.vstack` accepts it, because it treats a one-dimensional array as one row.
- **Mixing up the axes.** The axis you name is the one that goes away: a total per row is `axis=1`.

## Practice

1. Reshape the 24 minute readings `np.arange(24)` into rows of 6. What are the shapes of the result and of its transpose?
2. Turn `temps = np.array([14.0, 16.5, 13.0])` into a column vector.
3. Stack `jan = np.array([120, 95, 130])` and `feb = np.array([110, 101, 125])` as two columns, then split the result back into two `(3, 1)` columns.

### Answers

```python
import numpy as np

by_hour = np.arange(24).reshape(-1, 6)
print(by_hour.shape, by_hour.T.shape)
temps = np.array([14.0, 16.5, 13.0])
print(temps[:, np.newaxis].shape)
jan = np.array([120, 95, 130])
feb = np.array([110, 101, 125])
both = np.stack([jan, feb], axis=1)
print(both)
first, second = np.split(both, 2, axis=1)
print(first.shape, first.ravel())
```

```text
(4, 6) (6, 4)
(3, 1)
[[120 110]
 [ 95 101]
 [130 125]]
(3, 1) [120  95 130]
```

1. `-1` works out the 4 rows. The transpose swaps the two lengths.
2. `np.newaxis` after `:` adds a second axis of length one. `temps.reshape(-1, 1)` does the same.
3. `stack` with `axis=1` makes the inputs columns; `split` along `axis=1` cuts between them, and `ravel` shows the first column as a flat array.

## Key takeaways

- Axis 0 runs down the rows and axis 1 across the columns; the axis you name in a function disappears from the result.
- `reshape` keeps the elements in row-major order and accepts one `-1`.
- `ravel` returns a view when it can, `flatten` always a copy; `.T` swaps the axes.
- `np.newaxis` and `expand_dims` add length-one axes; `squeeze` removes them.
- `concatenate` joins along an existing axis, `stack` along a new one; `split` cuts into a list of arrays.

## Further reading

- [NumPy: the absolute basics for beginners (reshaping, stacking, splitting)](https://numpy.org/doc/stable/user/absolute_beginners.html)
- [numpy.reshape](https://numpy.org/doc/stable/reference/generated/numpy.reshape.html)
- [numpy.stack](https://numpy.org/doc/stable/reference/generated/numpy.stack.html)
- [Array manipulation routines](https://numpy.org/doc/stable/reference/routines.array-manipulation.html)
