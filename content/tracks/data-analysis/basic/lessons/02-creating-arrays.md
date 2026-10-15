---
title: Creating Arrays
summary: Build arrays from lists and nested lists, make arrays of zeros, ones or any value in any shape, generate ranges with `arange` and `linspace`, and know when `np.asarray` avoids a copy that `np.array` makes.
minutes: 30
objectives:
  - Create one- and two-dimensional arrays from lists, choosing the dtype with `dtype=`
  - Make filled arrays with `zeros`, `ones`, `full`, `eye` and the `_like` functions
  - Explain why `np.empty` returns leftover values and when it is safe to use
  - Choose between `arange` and `linspace`, and explain why float steps in `arange` are risky
  - Tell `np.array` from `np.asarray`
---

## Outline

1. From lists: `np.array`
2. Filled arrays: `zeros`, `ones` and `full`
3. `empty`, and why it holds garbage
4. Ranges: `arange` and `linspace`
5. `eye` and the `_like` functions
6. `np.array` or `np.asarray`

## From lists: `np.array`

Lesson 1 built arrays from lists with `np.array`. A list gives a one-dimensional array, a list of equal-length lists a two-dimensional one, and a tuple works as well as a list. NumPy picks a dtype that holds every value, or you choose one with the `dtype=` argument:

```python
import numpy as np

steps = np.array([8200, 10450, 6900, 12010])
print(steps, steps.dtype)
weekly = np.array([[8200, 10450, 6900], [7300, 9800, 11200]])
print(weekly.shape)
heights = np.array([1.62, 1.75, 1.80], dtype=np.float32)
print(heights, heights.dtype)
print(np.array((3, 5, 7), dtype=float))
```

```text
[ 8200 10450  6900 12010] int64
(2, 3)
[1.62 1.75 1.8 ] float32
[3. 5. 7.]
```

`dtype=` accepts a NumPy type such as `np.float32` or a Python type: `float` means `float64` and `int` means `int64`. Choosing a smaller type saves memory, as lesson 3 explains, but a value that does not fit is refused: `np.array([100, 200, 300], dtype=np.int8)` raises `OverflowError: Python integer 200 out of bounds for int8`.

## Filled arrays: `zeros`, `ones` and `full`

Often you know the shape before you know the values: a table of totals you will fill in, or a starting count of zero. Three functions make an array of a given **shape**, an integer for one dimension or a tuple for more:

```python
import numpy as np

print(np.zeros(4))
print(np.ones((2, 3), dtype=np.int64))
print(np.full((2, 4), 20.5))
print(np.full(3, 7))
```

```text
[0. 0. 0. 0.]
[[1 1 1]
 [1 1 1]]
[[20.5 20.5 20.5 20.5]
 [20.5 20.5 20.5 20.5]]
[7 7 7]
```

`zeros` and `ones` give `float64` unless you pass `dtype=`. `full(shape, value)` takes its dtype from the value: `20.5` gives floats, `7` gives integers. The shape of a two-dimensional array is one tuple, `(2, 3)`, which is why it has its own parentheses.

## `empty`, and why it holds garbage

`np.empty(shape)` also makes an array of that shape, but it does not set the values. The reference says it returns an array "without initializing entries", so it holds whatever bytes were last in that memory:

```python
import numpy as np

old = np.arange(6, dtype=np.float64) * 1.5
del old
seats = np.empty((2, 3))
print(seats)
```

```text
[[0.  1.5 3. ]
 [4.5 6.  7.5]]
```

The memory freed by `old` was handed straight back, so `seats` shows the old numbers. Your output may differ: it can be zeros, old data or nonsense such as `6.9e-310`. `empty` is marginally faster than `zeros` because it skips writing, which matters only when you are certain to overwrite every element before reading any. When in doubt, use `zeros`.

## Ranges: `arange` and `linspace`

`np.arange(start, stop, step)` works like Python's `range` but returns an array: `start` is included, `stop` is not, and `start` and `step` default to 0 and 1. `np.linspace(start, stop, num)` returns `num` evenly spaced values, with both ends included by default:

```python
import numpy as np

print(np.arange(5))
print(np.arange(10, 30, 5))
print(np.arange(0, 1, 0.25))
print(np.arange(1.0, 1.3, 0.1))
print(np.linspace(1.0, 1.3, 4))
print(np.linspace(0, 1, 5))
print(np.linspace(0, 60, 4, endpoint=False))
```

```text
[0 1 2 3 4]
[10 15 20 25]
[0.   0.25 0.5  0.75]
[1.  1.1 1.2 1.3]
[1.  1.1 1.2 1.3]
[0.   0.25 0.5  0.75 1.  ]
[ 0. 15. 30. 45.]
```

Look at the fourth line. `stop` is 1.3 and should be left out, yet it is there. With a float step, `arange` computes the length as `ceil((stop - start) / step)`, and `(1.3 - 1.0) / 0.1` is slightly more than 3 in floating point, so it makes four values. The reference warns that with a non-integer step "the length of the output might not be numerically stable" and recommends `linspace`. The rule of thumb:

- Whole-number steps, such as days 0 to 6 or every fifth minute: `arange`.
- Fractional steps, or "this many points from here to there": `linspace`, which you give a count instead of a step. `endpoint=False` leaves the end out, as in the four 15-minute marks within an hour.

## `eye` and the `_like` functions

`np.eye(n)` is the **identity matrix**: ones on the diagonal from top left to bottom right, zeros elsewhere. Lesson 12 uses it. The `_like` functions copy the shape and dtype of an array you already have:

```python
import numpy as np

print(np.eye(3))
prices = np.array([[2.5, 3.0], [4.0, 1.5]])
print(np.zeros_like(prices))
print(np.full_like(prices, 9.99))
counts = np.array([3, 0, 5])
print(np.ones_like(counts), np.zeros_like(counts, dtype=float))
```

```text
[[1. 0. 0.]
 [0. 1. 0.]
 [0. 0. 1.]]
[[0. 0.]
 [0. 0.]]
[[9.99 9.99]
 [9.99 9.99]]
[1 1 1] [0. 0. 0.]
```

`zeros_like(prices)` is a 2 by 2 float array of zeros, ready to hold a result of the same shape. `ones_like(counts)` keeps the integer dtype of `counts`; `dtype=` overrides it.

## `np.array` or `np.asarray`

Both turn their argument into an array. They differ when the argument already is one. `np.array` copies it by default. `np.asarray` returns the same array unchanged, and copies only when it must, for example to change the dtype:

```python
import numpy as np

levels = np.array([2.1, 2.4, 3.0])
copied = np.array(levels)
same = np.asarray(levels)
print(copied is levels, same is levels)
levels[0] = 9.9
print(copied, same)
as_int = np.asarray(levels, dtype=np.int64)
print(as_int, as_int is levels)
```

```text
False True
[2.1 2.4 3. ] [9.9 2.4 3. ]
[9 2 3] False
```

`same` is `levels` itself, so the change to `levels[0]` shows through it; `copied` kept the old value. Asking for `int64` forced a new array. Use `np.asarray` at the top of a function that accepts "a list or an array", so an array passed in is not copied for nothing. Use `np.array`, or the `.copy()` method of lesson 5, when you need an independent copy. Old code wrote `np.array(x, copy=False)` for this; in NumPy 2 that raises `ValueError` whenever a copy is needed, and the migration guide says to use `np.asarray`.

## Common mistakes

- **Ragged nested lists.** `np.array([[1, 2, 3], [4, 5]])` raises `ValueError: setting an array element with a sequence. The requested array has an inhomogeneous shape after 1 dimensions.` Every row needs the same length.
- **Passing the shape as separate numbers.** `np.zeros(2, 3)` raises `TypeError: Cannot interpret '3' as a data type`, because the second argument is the dtype. Write `np.zeros((2, 3))`.
- **Reading `empty` before filling it.** The values are leftovers, not zeros. Use `zeros` unless every element is written first.
- **A float step in `arange`.** The count can be one more than you expect. Use `linspace` with a count.
- **A dtype that truncates.** `np.full(3, 2.5, dtype=int)` gives `[2 2 2]` without a warning.

## Practice

1. Make a 3 by 5 array filled with `-1`, the marker for "no reading yet".
2. Make the nine values 0, 0.25, ..., 2.0 with `linspace`.
3. Make the multiples of 7 below 50, starting at 7, with `arange`.
4. For `grid = np.zeros((4, 4), dtype=np.int64)`, what are the sum and dtype of `np.ones_like(grid)`?

### Answers

```python
import numpy as np

print(np.full((3, 5), -1))
print(np.linspace(0, 2, 9))
print(np.arange(7, 50, 7))
grid = np.zeros((4, 4), dtype=np.int64)
print(np.ones_like(grid).sum(), np.ones_like(grid).dtype)
```

```text
[[-1 -1 -1 -1 -1]
 [-1 -1 -1 -1 -1]
 [-1 -1 -1 -1 -1]]
[0.   0.25 0.5  0.75 1.   1.25 1.5  1.75 2.  ]
[ 7 14 21 28 35 42 49]
16 int64
```

1. `full` with an integer value gives an integer array.
2. From 0 to 2 in steps of 0.25 is nine points, both ends included.
3. `stop` is 50, which is excluded; 49 is the last multiple.
4. Sixteen ones, and `ones_like` keeps the `int64` dtype of `grid`.

## Key takeaways

- `np.array` builds from lists, tuples and nested lists; `dtype=` chooses the type.
- `zeros`, `ones` and `full` take a shape (an int or a tuple); `zeros` and `ones` default to `float64`.
- `empty` does not initialise its values; read it only after you have filled it.
- `arange` is for integer steps, `linspace` for a number of evenly spaced points.
- `eye` makes an identity matrix; the `_like` functions copy the shape and dtype of another array.
- `np.asarray` avoids a copy when the input already is a matching array; `np.array` copies.

## Further reading

- [NumPy fundamentals: array creation](https://numpy.org/doc/stable/user/basics.creation.html)
- [numpy.empty](https://numpy.org/doc/stable/reference/generated/numpy.empty.html)
- [numpy.arange](https://numpy.org/doc/stable/reference/generated/numpy.arange.html)
- [numpy.asarray](https://numpy.org/doc/stable/reference/generated/numpy.asarray.html)
