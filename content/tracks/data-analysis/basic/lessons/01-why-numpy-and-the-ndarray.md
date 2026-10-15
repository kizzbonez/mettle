---
title: Why NumPy and the ndarray
summary: Meet NumPy and its central object, the ndarray. See why a typed, fixed-size array beats a Python list for numbers, install and import NumPy, and read an array's `ndim`, `shape`, `size`, `dtype` and `itemsize`.
minutes: 30
objectives:
  - Explain what NumPy is for and how an array differs from a Python list
  - Install NumPy with pip, import it as `np` and check its version
  - Create an array from a list and compute on every element without a loop
  - Read an array's `ndim`, `shape`, `size`, `dtype`, `itemsize` and `nbytes`
  - Recognise NumPy 2 and the old names that NumPy 1 tutorials still use
---

## Outline

1. What NumPy is and why it exists
2. Installing and importing NumPy
3. A first array
4. Dimensions: `ndim`, `shape` and `size`
5. One type for every element: `dtype` and `itemsize`
6. Why arrays are faster: a fair comparison
7. NumPy 2

## What NumPy is and why it exists

**NumPy** (Numerical Python) is an open-source library for working with large amounts of numbers. A Python list can hold numbers, but it was built to hold anything: each element is a separate Python object somewhere in memory, and the list keeps references to them. To add 1 to every element, Python must visit each object, check its type, do the addition and create a new object.

NumPy's central object is the **ndarray** (N-dimensional array), which everyone calls an **array**. The NumPy documentation lists how it differs from a list:

- An array has a **fixed size** when it is created. "Growing" it builds a new array.
- Every element has the **same type**, so every element takes the same number of bytes, and the values sit side by side in one block of memory.
- Operations on whole arrays run in compiled C code, with less Python code than a loop.

That design is why the rest of Python's data world is built on NumPy. pandas, which starts in the next level of this course, keeps its columns in arrays, and libraries such as scikit-learn and matplotlib take arrays as their input.

## Installing and importing NumPy

NumPy is not in the standard library. Install it into your virtual environment with pip, as the Python course did for other packages:

```console
$ python -m pip install numpy
```

Then import it under the short name `np`. The documentation, books and every example in this course use that name:

```python
import numpy as np

print(np.__version__)
```

```text
2.5.4
```

## A first array

`np.array` turns a list into an array. Compare what `*` means for each:

```python
import numpy as np

temps_c = [12.5, 15.0, 9.5, 21.0]
print(temps_c * 2)
print([t * 9 / 5 + 32 for t in temps_c])

temps = np.array(temps_c)
print(temps)
print(temps * 2)
print(temps * 9 / 5 + 32)
print(type(temps))
```

```text
[12.5, 15.0, 9.5, 21.0, 12.5, 15.0, 9.5, 21.0]
[54.5, 59.0, 49.1, 69.8]
[12.5 15.   9.5 21. ]
[25. 30. 19. 42.]
[54.5 59.  49.1 69.8]
<class 'numpy.ndarray'>
```

For a list, `* 2` repeats the list; converting to Fahrenheit needs a comprehension. For an array, `* 2` multiplies every element, and `temps * 9 / 5 + 32` converts all four temperatures in one expression. Writing an operation once for a whole array, and letting NumPy run the loop in compiled code, is called **vectorisation**. An array prints without commas, and `15.` is how NumPy writes the float `15.0`.

## Dimensions: `ndim`, `shape` and `size`

A list of lists of equal length becomes a two-dimensional array, a table. Here is a week of rainfall, in millimetres, at two weather stations:

```python
import numpy as np

rain_mm = np.array([
    [0.0, 2.5, 11.0, 4.0, 0.0, 0.5, 7.5],
    [1.0, 3.0, 14.5, 2.0, 0.0, 0.0, 9.0],
])
print(rain_mm)
print("ndim:", rain_mm.ndim)
print("shape:", rain_mm.shape)
print("size:", rain_mm.size)
print("dtype:", rain_mm.dtype)
print("itemsize:", rain_mm.itemsize, "nbytes:", rain_mm.nbytes)
```

```text
[[ 0.   2.5 11.   4.   0.   0.5  7.5]
 [ 1.   3.  14.5  2.   0.   0.   9. ]]
ndim: 2
shape: (2, 7)
size: 14
dtype: float64
itemsize: 8 nbytes: 112
```

Each direction you can move through an array is an **axis**; lesson 4 is about them.

- `ndim` is the number of axes: 1 for a plain list of numbers, 2 for a table.
- `shape` is a tuple with the length of each axis, rows first: 2 stations by 7 days.
- `size` is the total number of elements, the product of the shape: 14.

`len(rain_mm)` gives 2, the length of the first axis only, which is why you use `shape` and `size` with arrays.

## One type for every element: `dtype` and `itemsize`

The **dtype** (data type) says what kind of value every element is and how many bytes it takes. `float64` is a 64-bit float, the same precision as a Python `float`, so `itemsize` is 8 bytes and `nbytes`, the size of the data, is 14 × 8 = 112. When you build an array, NumPy picks one dtype that can hold every value:

```python
import numpy as np

print(np.array([3, 1, 4]).dtype)
print(np.array([3, 1.5, 4]))
print(np.array([3, 1.5, 4]).dtype)
print(np.array([True, False, 7]))
mixed = np.array([7, "seven"])
print(mixed, mixed.dtype)
print(repr(mixed[0]))
```

```text
int64
[3.  1.5 4. ]
float64
[1 0 7]
['7' 'seven'] <U21
np.str_('7')
```

Whole numbers give `int64`. One float makes them all floats. `True` and `False` become 1 and 0 next to an integer. A single string turns everything into text: `<U21` means Unicode strings of up to 21 characters, and the number 7 became the string `'7'`. Lesson 3 covers dtypes in depth.

## Why arrays are faster: a fair comparison

A fair test starts both versions from data already in memory, computes the same result, and keeps the best of several runs. Here, the sum of the squares of a million readings:

```python
import time

import numpy as np

readings = [i * 0.5 for i in range(1_000_000)]
array = np.array(readings)


def best_of(function, runs=5):
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        function()
        times.append(time.perf_counter() - start)
    return min(times)


list_time = best_of(lambda: sum(r * r for r in readings))
array_time = best_of(lambda: (array * array).sum())
print(f"list:  {list_time * 1000:.1f} ms")
print(f"array: {array_time * 1000:.1f} ms")
```

```text
list:  39.0 ms
array: 0.8 ms
```

`time.perf_counter()` reads a precise clock. On this machine the array was about 50 times faster; your numbers will differ, but the gap will be large. The list version runs Python bytecode for every element, while the array version runs one compiled loop over 8 MB of floats packed together. The array is also smaller: the list and its million float objects take about 32 MB, the array 8 MB (`array.nbytes` is 8,000,000).

Lists are still the right tool for small collections, mixed types and anything you grow with `append`.

## NumPy 2

NumPy 2.0, released in 2024, was the first new major version in over fifteen years, and this course uses NumPy 2.5. Three changes matter to a beginner. Old aliases were removed, so code from NumPy 1 tutorials can fail. The rules for combining a NumPy value with a Python number changed (lesson 3). And the default integer is 64 bits on every 64-bit system, Windows included.

```python
import numpy as np

print(np.float_)
```

```text
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 3, in <module>
    print(np.float_)
          ^^^^^^^^^
  File "/usr/local/lib/python3.15/site-packages/numpy/__init__.py", line 763, in __getattr__
    raise AttributeError(
    ...<3 lines>...
    )
AttributeError: `np.float_` was removed in the NumPy 2.0 release. Use `np.float64` instead.
```

The message names the replacement. Likewise `np.NaN` and `np.Inf` are now `np.nan` and `np.inf`.

## Common mistakes

- **Growing an array like a list.** `temps.append(9.5)` raises `AttributeError: 'numpy.ndarray' object has no attribute 'append'`. Collect values in a list, then convert once with `np.array`.
- **Passing the values separately.** `np.array(1, 2, 3)` raises `TypeError: array() takes from 1 to 2 positional arguments but 3 were given`. Pass one list: `np.array([1, 2, 3])`.
- **A stray string in the data.** `np.array([12.5, "n/a", 9.0])` has dtype `<U32`, and `+ 1` on it raises `UFuncTypeError: ufunc 'add' did not contain a loop with signature matching types`. Check `dtype` after building an array; lesson 11 shows how to read missing values as NaN.
- **Old names from NumPy 1.** `np.float_`, `np.NaN` and `np.Inf` raise `AttributeError`; use `np.float64`, `np.nan` and `np.inf`.

## Practice

1. Four students sat three exams: `[[72, 85, 90], [64, 58, 77], [88, 91, 95], [70, 66, 81]]`. Make an array and print its `ndim`, `shape`, `size`, `dtype` and `nbytes`.
2. A café's prices are `[2.40, 3.10, 1.95]`. Raise them all by 20% without a loop.
3. What dtype does `np.array([1, 2, "3"])` get, and why is that a problem?

### Answers

```python
import numpy as np

scores = np.array([[72, 85, 90], [64, 58, 77], [88, 91, 95], [70, 66, 81]])
print(scores.ndim, scores.shape, scores.size, scores.dtype, scores.nbytes)
prices = [2.40, 3.10, 1.95]
print(np.array(prices) * 1.2)
print(np.array([1, 2, "3"]).dtype)
```

```text
2 (4, 3) 12 int64 96
[2.88 3.72 2.34]
<U21
```

1. Four rows of three: 12 integers of 8 bytes each, 96 bytes.
2. Multiplying the array by 1.2 scales every price at once.
3. One string makes the whole array text (`<U21`), so arithmetic on it fails. Convert the values to numbers before building the array.

## Key takeaways

- NumPy's ndarray holds elements of one type, packed together in memory, with a fixed size.
- Operations on a whole array run as one compiled loop: vectorised code is shorter and much faster than a Python loop.
- `shape` gives the length of each axis, `ndim` the number of axes, `size` the number of elements.
- `dtype` is the element type; `itemsize` its bytes; `nbytes` the bytes of all the data.
- This is NumPy 2: removed aliases such as `np.float_` and `np.NaN` raise `AttributeError` with the replacement.

## Further reading

- [NumPy: the absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html)
- [What is NumPy?](https://numpy.org/doc/stable/user/whatisnumpy.html)
- [NumPy quickstart: the basics](https://numpy.org/doc/stable/user/quickstart.html)
- [NumPy 2.0 migration guide](https://numpy.org/doc/stable/numpy_2_0_migration_guide.html)
