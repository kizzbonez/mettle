---
title: Boolean Masks and Fancy Indexing
summary: Select the elements that meet a condition with boolean masks, combine conditions with `&`, `|` and `~`, count matches, choose values with `np.where`, find positions with `np.nonzero`, pick elements by lists of positions, and change data through a mask.
minutes: 35
objectives:
  - Build boolean masks with comparisons and use them to filter an array
  - Combine conditions with `&`, `|` and `~`, with the parentheses they need, and explain why `and` and `or` fail
  - Count and measure matches with `.sum()` and `.mean()`, and find their positions with `np.nonzero`
  - Choose between two values element by element with `np.where`
  - Select with integer arrays, knowing that the result is a copy, and assign through masks and index arrays
---

## Outline

1. Comparisons make boolean arrays
2. Combining conditions: `&`, `|`, `~`
3. `np.where` and `np.nonzero`
4. Masks on two-dimensional arrays
5. Fancy indexing with integer arrays
6. Assigning through a mask

## Comparisons make boolean arrays

A comparison between an array and a value is done element by element and gives an array of `True` and `False`, of dtype `bool`. Using that array as an index keeps the elements where it is `True`. A boolean array used this way is called a **mask**:

```python
import numpy as np

# Minutes from order to doorstep for eight deliveries
minutes = np.array([28, 41, 35, 19, 52, 33, 47, 25])
late = minutes > 40
print(late)
print(late.dtype, late.sum(), late.mean())
print(minutes[late])
print(minutes[minutes <= 30])
```

```text
[False  True False False  True False  True False]
bool 3 0.375
[41 52 47]
[28 19 25]
```

In arithmetic `True` counts as 1 and `False` as 0, so `late.sum()` **counts** the late deliveries and `late.mean()` gives their **share**, 3 out of 8. `minutes[late]` keeps the three late times, in their original order. Writing the condition inside the brackets, `minutes[minutes <= 30]`, is the usual shorthand. A mask must have the same length as the axis it selects from.

## Combining conditions: `&`, `|`, `~`

Combine masks with the element-wise operators `&` (and), `|` (or) and `~` (not). Each comparison needs its own parentheses:

```python
import numpy as np

minutes = np.array([28, 41, 35, 19, 52, 33, 47, 25])
print(minutes[(minutes >= 25) & (minutes <= 35)])
print(minutes[(minutes < 20) | (minutes > 50)])
print(minutes[~(minutes > 40)])
print((minutes > 30) and (minutes < 45))
```

```text
[28 35 33 25]
[19 52]
[28 35 19 33 25]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 7, in <module>
    print((minutes > 30) and (minutes < 45))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()
```

Python's `and`, `or` and `not` need one `True` or `False` for the whole operand, so they ask the array for its truth value. An array of eight booleans has none, and NumPy refuses to guess. If you do want one answer, say which: `.any()` is `True` when at least one element is, `.all()` when every element is.

The parentheses matter because `&` and `|` bind more tightly than comparisons. `minutes > 30 & minutes < 45` is read as `minutes > (30 & minutes) < 45`, a chained comparison, and fails with the same `ValueError`.

## `np.where` and `np.nonzero`

`np.where(condition, x, y)` builds a new array, taking from `x` where the condition is `True` and from `y` where it is `False`. `x` and `y` can be arrays or single values. `np.nonzero(mask)` returns the **positions** of the `True` elements:

```python
import numpy as np

minutes = np.array([28, 41, 35, 19, 52, 33, 47, 25])
print(np.where(minutes > 40, "late", "on time"))
print(np.where(minutes > 45, 45, minutes))
print(np.nonzero(minutes > 40))
print(np.nonzero(minutes > 60))
```

```text
['on time' 'late' 'on time' 'on time' 'late' 'on time' 'late' 'on time']
[28 41 35 19 45 33 45 25]
(array([1, 4, 6]),)
(array([], dtype=int64),)
```

The second line caps every time at 45 and leaves `minutes` itself unchanged. `nonzero` returns a tuple with one array of positions per axis, so for a one-dimensional mask take `[0]`. When nothing matches, the positions are empty. Called with only a condition, `np.where(mask)` does the same as `np.nonzero`; the reference recommends `nonzero` for that.

## Masks on two-dimensional arrays

A mask with the same shape as a table selects single elements, and the result is one-dimensional, in row-major order. A one-dimensional mask in the row position selects whole rows:

```python
import numpy as np

# Test scores: one row per student, one column per paper
scores = np.array([
    [55, 72, 61],
    [88, 91, 79],
    [42, 58, 66],
    [73, 69, 90],
])
print(scores[scores >= 80])
passed_first = scores[:, 0] >= 60
print(passed_first)
print(scores[passed_first])
print(scores[passed_first, 2])
```

```text
[88 91 90]
[False  True False  True]
[[88 91 79]
 [73 69 90]]
[79 90]
```

`scores[:, 0] >= 60` tests one column and gives one `True` or `False` per student. Placed in the row position, it keeps the students who passed paper 1, all their columns, and it combines with an index or slice for the columns: `scores[passed_first, 2]` is their mark on paper 3.

## Fancy indexing with integer arrays

An index can also be a list or array of positions. NumPy calls this **fancy indexing** (its reference says "integer array indexing"). The positions can be in any order and can repeat. Like boolean masks, and unlike slices, it always returns a **copy**:

```python
import numpy as np

minutes = np.array([28, 41, 35, 19, 52, 33, 47, 25])
print(minutes[[4, 0, 4]])
picked = minutes[[1, 6]]
picked[0] = 0
print(minutes, np.shares_memory(picked, minutes))
scores = np.array([[55, 72, 61], [88, 91, 79], [42, 58, 66]])
print(scores[[2, 0]])
print(scores[[0, 1, 2], [2, 0, 1]])
```

```text
[52 28 52]
[28 41 35 19 52 33 47 25] False
[[42 58 66]
 [55 72 61]]
[61 88 58]
```

- `minutes[[4, 0, 4]]` picks positions 4, 0 and 4 again.
- Changing `picked` left `minutes` alone: the result was a copy.
- `scores[[2, 0]]` picks rows 2 and 0, in that order.
- With one list per axis, NumPy pairs them: `scores[[0, 1, 2], [2, 0, 1]]` is `scores[0, 2]`, `scores[1, 0]` and `scores[2, 1]`.

## Assigning through a mask

On the left of `=`, a mask or an index array does not copy. It writes into the selected positions of the original:

```python
import numpy as np

minutes = np.array([28, 41, 35, 19, 52, 33, 47, 25])
minutes[minutes > 45] = 45
print(minutes)
rain = np.array([2.5, np.nan, 0.0, np.nan, 7.5])
rain[np.isnan(rain)] = 0.0
print(rain)
stock = np.array([10, 4, 0, 7])
stock[[1, 2]] += 5
print(stock)
```

```text
[28 41 35 19 45 33 45 25]
[2.5 0.  0.  0.  7.5]
[10  9  5  7]
```

This is how you clean data in place: cap outliers, replace NaN with a value, adjust chosen entries. Use `np.where` instead when you want a new array and must keep the original.

## Common mistakes

- **`and`, `or`, `not` on arrays.** They raise `ValueError: The truth value of an array with more than one element is ambiguous`. Use `&`, `|`, `~`.
- **Missing parentheses.** `minutes > 30 & minutes < 45` fails; write `(minutes > 30) & (minutes < 45)`.
- **Assigning to a selection of a selection.** `minutes[minutes > 30][0] = 0` changes nothing: the first index made a copy, and the assignment went into it. Use one index, such as `minutes[np.nonzero(minutes > 30)[0][0]] = 0`.
- **Repeated positions with `+=`.** `stock[[1, 1, 1]] += 1` adds 1 once, not three times, because NumPy reads the values, adds, then writes the same position three times.
- **A mask of the wrong length.** It raises `IndexError: boolean index did not match indexed array along axis 0`.

## Practice

For the week's highest temperatures `temps = np.array([18.5, 22.0, 31.5, 27.0, 33.0, 15.5, 29.5])`:

1. Count the days of 30 degrees or more and print those temperatures.
2. Print the temperatures from 20 up to, but not including, 30.
3. On which days (positions) was it 30 or more?
4. Label each day `"hot"` (30 or more), `"cool"` (below 20) or `"mild"`.
5. Make a copy with every value above 30 replaced by 30.

### Answers

```python
import numpy as np

temps = np.array([18.5, 22.0, 31.5, 27.0, 33.0, 15.5, 29.5])
hot = temps >= 30
print(hot.sum(), temps[hot])
print(temps[(temps >= 20) & (temps < 30)])
print(np.nonzero(hot)[0])
print(np.where(temps >= 30, "hot", np.where(temps < 20, "cool", "mild")))
capped = temps.copy()
capped[capped > 30] = 30
print(capped)
```

```text
2 [31.5 33. ]
[22.  27.  29.5]
[2 4]
['cool' 'mild' 'hot' 'mild' 'hot' 'cool' 'mild']
[18.5 22.  30.  27.  30.  15.5 29.5]
```

The labels nest one `np.where` inside another for the third choice. The copy keeps `temps` unchanged; `np.where(temps > 30, 30, temps)` would do the same in one step.

## Key takeaways

- A comparison gives a boolean mask; `arr[mask]` keeps the `True` elements.
- Combine masks with `&`, `|`, `~`, and put each comparison in parentheses.
- `mask.sum()` counts matches, `mask.mean()` gives their share, `np.nonzero` their positions.
- `np.where(cond, x, y)` builds a new array choosing between two values.
- Masks and integer arrays return copies when reading, but write into the original when assigned to.

## Further reading

- [NumPy fundamentals: indexing on ndarrays (advanced indexing)](https://numpy.org/doc/stable/user/basics.indexing.html#advanced-indexing)
- [numpy.where](https://numpy.org/doc/stable/reference/generated/numpy.where.html)
- [numpy.nonzero](https://numpy.org/doc/stable/reference/generated/numpy.nonzero.html)
