---
title: Vectorized Arithmetic and Ufuncs
summary: Compute on whole arrays with arithmetic operators and universal functions such as `np.sqrt`, `np.exp`, `np.log`, `np.abs`, `np.round`, `np.clip` and `np.maximum`, handle division by zero with `np.errstate`, and see why Python loops over arrays are slow and `np.vectorize` does not make them fast.
minutes: 35
objectives:
  - Apply arithmetic operators element by element between arrays and with single numbers
  - Use the common universal functions for roots, powers, logarithms, absolute values, rounding and limits
  - Explain what happens on division by zero and control the warnings with `np.errstate`
  - Measure a Python loop against vectorised code and explain the difference
  - Explain why `np.vectorize` is a convenience, not a speed-up, and replace it with array operations
---

## Outline

1. Element-wise arithmetic
2. Universal functions
3. Rounding, clipping and element-wise maximum
4. Division by zero and `np.errstate`
5. Why Python loops over arrays are slow
6. `np.vectorize` is not a speed-up

## Element-wise arithmetic

Every arithmetic operator works on arrays **element by element**: the first element with the first, the second with the second, and so on. A single number is combined with every element. The arrays must have the same shape here; the next lesson relaxes that.

```python
import numpy as np

# One morning at a cafe: price of each item and how many were sold
price = np.array([2.40, 3.10, 1.95, 4.50])
sold = np.array([31, 12, 40, 7])
takings = price * sold
print(takings)
print(takings.sum())
print(sold // 12, sold % 12)
print(price - 0.5, price ** 2)
print(np.add(price, 1) == price + 1)
```

```text
[74.4 37.2 78.  31.5]
221.1
[2 1 3 0] [7 0 4 7]
[1.9  2.6  1.45 4.  ] [ 5.76    9.61    3.8025 20.25  ]
[ True  True  True  True]
```

`price * sold` is the takings per item, with no loop and no `zip`. `//` and `%` give whole dozens and the remainder, and `**` raises to a power. The last line shows what the operators really are: `price + 1` calls the function `np.add`.

## Universal functions

`np.add` is a **universal function**, or **ufunc**. The NumPy guide defines it as "a function that operates on ndarrays in an element-by-element fashion": it takes arrays, applies a simple operation to each element in compiled code, and returns an array of the same shape. Every operator has one (`np.subtract`, `np.multiply`, `np.power`...), and NumPy has many more:

```python
import numpy as np

print(type(np.sqrt), type(np.add))
errors = np.array([-1.5, 0.25, 3.0, -0.75])
print(np.abs(errors))
areas = np.array([16.0, 30.25, 49.0])
print(np.sqrt(areas))
doublings = np.array([0.0, 1.0, 2.0, 3.0])
print(np.exp(doublings * np.log(2)))
print(np.log(np.array([1.0, np.e, 100.0])), np.log10(100.0))
```

```text
<class 'numpy.ufunc'> <class 'numpy.ufunc'>
[1.5  0.25 3.   0.75]
[4.  5.5 7. ]
[1. 2. 4. 8.]
[0.         1.         4.60517019] 2.0
```

- `np.abs` drops the sign, a common first step for measuring errors.
- `np.sqrt` gives square roots: the side of each square plot from its area.
- `np.exp` is e to the power x, and `np.log` is its inverse, the **natural** logarithm (base e). `np.log10` and `np.log2` give base 10 and base 2. `np.exp(n * np.log(2))` is 2 to the power n.

Use the NumPy versions, not the `math` module: `math.sqrt(areas)` raises `TypeError: only 0-dimensional arrays can be converted to Python scalars`, because `math` works on one number at a time.

## Rounding, clipping and element-wise maximum

```python
import numpy as np

fares = np.array([2.345, 7.5, 8.5, -0.5, 12.675])
print(np.round(fares, 1))
print(np.round(fares))
print(np.clip(fares, 0, 10))
morning = np.array([12, 30, 8, 21])
evening = np.array([15, 25, 11, 21])
print(np.maximum(morning, evening), np.max(morning))
print(np.minimum(morning, 10))
```

```text
[ 2.3  7.5  8.5 -0.5 12.7]
[ 2.  8.  8. -0. 13.]
[ 2.345  7.5    8.5    0.    10.   ]
[15 30 11 21] 30
[10 10  8 10]
```

- `np.round(arr, decimals)` rounds to that many places. Exact halves go to the **nearest even** number, as Python's `round` does: 7.5 becomes 8 but 8.5 becomes 8 as well. `-0.` is negative zero, which equals `0.0`.
- `np.clip(arr, low, high)` limits every value to a range: negatives become 0 and anything over 10 becomes 10.
- `np.maximum(a, b)` compares two arrays element by element and keeps the larger of each pair. `np.max(a)` is different: it returns the single largest value (lesson 9). With a number, `np.minimum(morning, 10)` caps each value at 10.

## Division by zero and `np.errstate`

Python raises `ZeroDivisionError` for `1 / 0`. NumPy does not stop a whole array computation for one bad element. Float division by zero gives `inf` (or `-inf`), zero divided by zero gives `nan`, and NumPy prints a `RuntimeWarning`:

```python
import numpy as np

distance_km = np.array([12.0, 0.0, 30.0, 5.0])
hours = np.array([0.5, 0.0, 0.0, 0.25])
speed = distance_km / hours
print(speed)
with np.errstate(divide="ignore", invalid="ignore"):
    speed = distance_km / hours
print(np.where(hours > 0, speed, 0.0))
with np.errstate(divide="raise"):
    distance_km / hours
```

```text
/tmp/work/ex.py:5: RuntimeWarning: divide by zero encountered in divide
  speed = distance_km / hours
/tmp/work/ex.py:5: RuntimeWarning: invalid value encountered in divide
  speed = distance_km / hours
[24. nan inf 20.]
[24.  0.  0. 20.]
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 11, in <module>
    distance_km / hours
    ~~~~~~~~~~~~^~~~~~~
FloatingPointError: divide by zero encountered in divide
```

`np.errstate` is a context manager, like `with open(...)`: inside the `with` block it changes how NumPy treats floating-point problems, and afterwards everything is as before. Its keywords name the problem: `divide` (division by zero), `invalid` (a result that is NaN, such as 0 / 0 or `np.sqrt(-1.0)`), `over` (overflow). The values include `"ignore"`, `"warn"` (the default) and `"raise"`, which turns the warning into a `FloatingPointError`. The common pattern is the middle one: silence the warning where you expect it, then replace the bad results with `np.where`. Integer division `//` by zero gives 0, with a warning.

## Why Python loops over arrays are slow

A `for` loop over an array runs Python code for every element, and each element taken out of the array becomes a new NumPy scalar object first. Here a million temperatures are converted both ways (best of five runs; your timings will differ):

```python
import time

import numpy as np


def best_of(function, runs=5):
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        function()
        times.append(time.perf_counter() - start)
    return min(times)


celsius = np.linspace(-10, 35, 1_000_000)


def loop_convert():
    result = np.empty_like(celsius)
    for i in range(len(celsius)):
        result[i] = celsius[i] * 9 / 5 + 32
    return result


def vector_convert():
    return celsius * 9 / 5 + 32


print(f"loop:       {best_of(loop_convert) * 1000:.1f} ms")
print(f"vectorised: {best_of(vector_convert) * 1000:.1f} ms")
print(np.array_equal(loop_convert(), vector_convert()))
```

```text
loop:       300.7 ms
vectorised: 2.2 ms
True
```

Same result, more than a hundred times faster. `np.array_equal(a, b)` is `True` when two arrays have the same shape and the same elements.

## `np.vectorize` is not a speed-up

`np.vectorize(func)` wraps a function written for one number so that it accepts arrays. The reference says plainly that it "is provided primarily for convenience, not for performance. The implementation is essentially a for loop". This continues the script above, reusing `best_of`:

```python
def ticket_price(age):
    if age < 16 or age >= 65:
        return 1.5
    return 3.0


ages = np.arange(1_000_000) % 90
vector_price = np.vectorize(ticket_price)
print(vector_price(np.array([10, 40, 70])))
print(f"np.vectorize: {best_of(lambda: vector_price(ages)) * 1000:.1f} ms")
print(f"np.where:     {best_of(lambda: np.where((ages < 16) | (ages >= 65), 1.5, 3.0)) * 1000:.1f} ms")
```

```text
[1.5 3.  1.5]
np.vectorize: 108.4 ms
np.where:     2.2 ms
```

The `if` inside `ticket_price` is why it cannot take an array directly. Rewriting the condition as a mask and choosing with `np.where` (lesson 6) is about fifty times faster here. Reach for `np.vectorize` only when no array version exists and speed does not matter.

## Common mistakes

- **Using `math` functions on arrays.** `math.sqrt(arr)` raises `TypeError`; use `np.sqrt(arr)`.
- **Confusing `np.max` and `np.maximum`.** `np.max(a)` is one value; `np.maximum(a, b)` compares two arrays element by element.
- **Ignoring the division warning.** The `inf` and `nan` it reports flow into every later sum and mean. Handle them where they appear.
- **Arrays of different lengths.** `np.array([1, 2, 3]) + np.array([1, 2])` raises `ValueError: operands could not be broadcast together with shapes (3,) (2,)`. Lesson 8 explains the rule.
- **Writing a loop, or `np.vectorize`, out of habit.** Look for the operator, ufunc or mask that does the job on the whole array.

## Practice

1. Three rooms measure 4.0 by 3.0, 5.5 by 4.0 and 3.2 by 3.2 metres. Compute their areas, the areas in square feet (times 10.764) rounded to one decimal, and the side of a square room of the same area.
2. Clip the sensor readings `[-3.0, 14.0, 101.0, 55.0, 99.5]` to the range 0 to 100.
3. A team's goals for and against in four matches are `[2, 0, 3, 1]` and `[1, 0, 4, 1]`. Compute the goal difference ignoring sign, the larger score of each match, and the ratio of goals for to against without warnings.

### Answers

```python
import numpy as np

length_m = np.array([4.0, 5.5, 3.2])
width_m = np.array([3.0, 4.0, 3.2])
area = length_m * width_m
print(area, np.round(area * 10.764, 1))
print(np.sqrt(area))
readings = np.array([-3.0, 14.0, 101.0, 55.0, 99.5])
print(np.clip(readings, 0, 100))
goals_for = np.array([2, 0, 3, 1])
goals_against = np.array([1, 0, 4, 1])
print(np.abs(goals_for - goals_against), np.maximum(goals_for, goals_against))
with np.errstate(divide="ignore", invalid="ignore"):
    ratio = goals_for / goals_against
print(ratio)
```

```text
[12.   22.   10.24] [129.2 236.8 110.2]
[3.46410162 4.69041576 3.2       ]
[  0.   14.  100.   55.   99.5]
[1 0 1 0] [2 0 4 1]
[2.    nan 0.75 1.  ]
```

The 0-0 draw gives 0 / 0, which is `nan`; `errstate` kept the output free of warnings.

## Key takeaways

- Operators work element by element, between equal-shaped arrays or with a single number.
- Ufuncs such as `np.sqrt`, `np.exp`, `np.log`, `np.abs`, `np.round`, `np.clip` and `np.maximum` apply to every element in compiled code.
- `np.round` sends exact halves to the even neighbour.
- Division by zero gives `inf` or `nan` with a warning; `np.errstate` silences it or turns it into an error.
- Python loops and `np.vectorize` run per element in Python; array expressions are far faster.

## Further reading

- [NumPy fundamentals: universal functions (ufunc) basics](https://numpy.org/doc/stable/user/basics.ufuncs.html)
- [Universal functions reference: available ufuncs](https://numpy.org/doc/stable/reference/ufuncs.html)
- [numpy.errstate](https://numpy.org/doc/stable/reference/generated/numpy.errstate.html)
- [numpy.vectorize](https://numpy.org/doc/stable/reference/generated/numpy.vectorize.html)
