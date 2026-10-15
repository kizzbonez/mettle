---
title: Data Types
summary: Learn the dtypes NumPy stores numbers, booleans and text in, how to choose and convert them, why fixed-width integers overflow, what NaN and inf are, and how NumPy 2 decides the dtype of a result when arrays meet Python numbers.
minutes: 35
objectives:
  - Name the main dtypes (integers, unsigned integers, floats, bool, complex, strings) and read their limits with `np.iinfo` and `np.finfo`
  - Convert arrays with `astype`, knowing that float to int truncates
  - Recognise integer overflow and avoid it by choosing a wider dtype
  - Work with NaN and inf, and explain why `np.nan == np.nan` is false
  - Predict result dtypes under NumPy 2's promotion rules (NEP 50), and convert NumPy scalars to Python numbers
---

## Outline

1. The dtype families
2. Converting with `astype`
3. Fixed-width integers overflow
4. NaN and inf
5. Type promotion in NumPy 2
6. NumPy scalars and Python numbers

## The dtype families

Every element of an array has the same **dtype**, and the dtype fixes how many bits each element uses. That fixed width is what makes arrays compact and fast, and it is also why a dtype has limits. NumPy's five numeric kinds are:

| Kind | Dtypes | Holds |
| --- | --- | --- |
| signed integer | `int8`, `int16`, `int32`, `int64` | whole numbers, negative or positive |
| unsigned integer | `uint8`, `uint16`, `uint32`, `uint64` | whole numbers from 0 up |
| floating point | `float16`, `float32`, `float64` | real numbers, NaN and inf |
| complex | `complex64`, `complex128` | numbers with a real and an imaginary part |
| boolean | `bool` | `True` or `False`, one byte each |

The number is the width in bits. Text arrays use the fixed-width string dtype `str_`, shown as `<U5` for strings of up to five characters. `np.iinfo` and `np.finfo` report the limits:

```python
import numpy as np

for dtype in [np.int8, np.uint8, np.int16, np.int32, np.int64]:
    info = np.iinfo(dtype)
    print(f"{info.dtype}: {info.min} to {info.max}")
print(np.finfo(np.float32).max, np.finfo(np.float64).max)
print(np.array([True, False]).dtype, np.array([1 + 2j]).dtype, np.array(["tea", "cocoa"]).dtype)
```

```text
int8: -128 to 127
uint8: 0 to 255
int16: -32768 to 32767
int32: -2147483648 to 2147483647
int64: -9223372036854775808 to 9223372036854775807
3.4028235e+38 1.7976931348623157e+308
bool complex128 <U5
```

The defaults, `int64` and `float64`, are right for almost all analysis. Choose a smaller type with `dtype=` only when memory matters and you know the values fit: a million ages fit in `uint8` and take 1 MB instead of 8 MB. `float32` keeps 6 to 7 significant decimal digits, `float64` 15 to 16.

## Converting with `astype`

`arr.astype(dtype)` returns a new array converted to another dtype. It never changes the original:

```python
import numpy as np

pressure = np.array([1013.7, 998.2, -3.9, 1021.5])
print(pressure.astype(np.int64))
print(pressure.round().astype(np.int64))
print(pressure.astype(np.float32).dtype, pressure.dtype)
codes = np.array(["12", "7", "30"])
print(codes.astype(np.int64) + 1)
print(np.array([0, 3, 0]).astype(bool))
```

```text
[1013  998   -3 1021]
[1014  998   -4 1022]
float32 float64
[13  8 31]
[False  True False]
```

Float to integer **truncates**: it drops the fraction, so 1013.7 becomes 1013 and -3.9 becomes -3. To round, call `.round()` first (lesson 7 covers rounding). Strings of digits convert to numbers, and to `bool` zero becomes `False` and anything else `True`.

By default `astype` allows any conversion, even one that changes values. NumPy 2.4 added `casting="same_value"`, which raises instead: `np.array([1.5, 2.7]).astype(np.int64, casting="same_value")` fails with `ValueError: could not cast 'same_value' double to long`.

## Fixed-width integers overflow

A Python `int` grows as large as it needs. A NumPy integer has a fixed number of bits, and arithmetic that goes past the top **wraps around** to the bottom, silently, with no error for arrays:

```python
import numpy as np

visitors = np.array([120, 250, 90], dtype=np.uint8)
print(visitors + 10)
print(visitors * 2)
print(visitors.astype(np.int64) * 2)
print(np.array([300]).astype(np.uint8))
```

```text
[130   4 100]
[240 244 180]
[240 500 180]
[44]
```

`uint8` stops at 255, so 250 + 10 became 4 (260 - 256) and 250 * 2 became 244. Converting to `int64` first gave the right 500. The same wrap happens in `astype`: 300 became 44. The fix is always a dtype wide enough for the results, not just the inputs.

## NaN and inf

Floats have special values. **NaN** ("not a number") marks a missing or undefined result, and **inf** is infinity. Write them `np.nan` and `np.inf`:

```python
import numpy as np

readings = np.array([4.2, np.nan, 3.8, np.inf])
print(readings, readings.dtype)
print(np.nan == np.nan, np.isnan(readings), np.isinf(readings))
print(readings.sum(), readings.max())
counts = np.array([3, 5, 2])
counts[1] = np.nan
```

```text
[4.2 nan 3.8 inf] float64
False [False  True False False] [False False False  True]
nan nan
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 8, in <module>
    counts[1] = np.nan
    ~~~~~~^^^
ValueError: cannot convert float NaN to integer
```

- NaN is not equal to anything, itself included, so test for it with `np.isnan`, never `==`.
- NaN spreads: any sum or maximum that includes one is NaN. Lesson 9 shows `np.nansum` and friends.
- Integer dtypes have no NaN, so a column of counts with a gap must be a float array.

## Type promotion in NumPy 2

When an operation combines two dtypes, NumPy picks the result dtype by **type promotion**. Between two arrays it picks a type that can hold both: `int32` with `float64` gives `float64`. NumPy 2 changed one rule, set out in NEP 50: a plain Python `int`, `float` or `complex` is **weak**. Only its kind counts, never its size, so the array's dtype decides the precision.

```python
import numpy as np

small = np.array([10, 20, 30], dtype=np.int8)
print((small + 1).dtype, (small * 2.5).dtype)
weights = np.array([1.5, 2.25], dtype=np.float32)
print((weights + 0.1).dtype, (weights + np.float64(0.1)).dtype)
print((small + np.int64(1)).dtype)
small + 300
```

```text
int8 float64
float32 float64
int64
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 8, in <module>
    small + 300
    ~~~~~~^~~~~
OverflowError: Python integer 300 out of bounds for int8
```

- `small + 1` stays `int8`; `small * 2.5` becomes a float, because the kind changed.
- `weights + 0.1` stays `float32`, but a NumPy `np.float64` is not weak, so it promotes to `float64`.
- A Python integer that does not fit the array's dtype raises `OverflowError`.

Code written for NumPy 1 sometimes relied on the old rule, where `np.float32(3) + 3.0` gave `float64`; it now gives `float32`.

## NumPy scalars and Python numbers

One element taken out of an array is a **NumPy scalar**, such as `np.float64`, not a Python `float`:

```python
import numpy as np

prices = np.array([2.5, 3.0, 4.75])
first = prices[0]
print(type(first), first)
print(repr(first), isinstance(first, float))
print(first.item(), type(first.item()))
print(repr(prices.sum()), float(prices.sum()))
```

```text
<class 'numpy.float64'> 2.5
np.float64(2.5) True
2.5 <class 'float'>
np.float64(10.25) 10.25
```

`np.float64` is a subclass of Python's `float` and works almost everywhere a float does. NumPy 2 shows it as `np.float64(2.5)` in `repr`, so lists of them print that way. `.item()`, `float()` or `int()` give a plain Python number, which you want before writing JSON or comparing with `is`. `np.int64`, on the other hand, is not a subclass of `int`, and `np.bool` is not a `bool`.

## Common mistakes

- **Expecting `astype(int)` to round.** It truncates toward zero. Use `.round().astype(int)`.
- **A dtype too small for the result.** `uint8` ages minus 10 wrap past zero: `np.array([7], dtype=np.uint8) - 10` gives `[253]`. Convert to `int64` before arithmetic that can leave the range.
- **Testing for NaN with `==`.** `x == np.nan` is always `False`; use `np.isnan(x)`.
- **Assigning a float into an integer array.** `temps[0] = 12.8` in an `int64` array stores 12 silently, and NaN raises `ValueError`.

## Practice

1. Ages `[34, 7, 81, 52]` are stored as `uint8`. Compare their `nbytes` with `int64`, then subtract 40 from each without wrapping.
2. Convert `[71.9, 64.5, 88.0]` to integers by truncating and by rounding.
3. Predict the dtypes of `x + 1`, `x + 1.0` and `x + np.int32(1)` for `x = np.array([1, 2], dtype=np.int16)`.

### Answers

```python
import numpy as np

ages = np.array([34, 7, 81, 52], dtype=np.uint8)
print(ages.nbytes, ages.astype(np.int64).nbytes)
print(ages.astype(np.int64) - 40)
scores = np.array([71.9, 64.5, 88.0])
print(scores.astype(int), np.round(scores).astype(int))
x = np.array([1, 2], dtype=np.int16)
print((x + 1).dtype, (x + 1.0).dtype, (x + np.int32(1)).dtype)
```

```text
4 32
[ -6 -33  41  12]
[71 64 88] [72 64 88]
int16 float64 int32
```

1. Four bytes against 32. `uint8` cannot go below zero, so convert to a signed type first.
2. Truncating drops the fraction; `np.round` rounds 64.5 to 64, because NumPy rounds halves to the nearest even number.
3. The Python `1` is weak, so `int16` stays. A Python float changes the kind to float, which gives `float64`. `np.int32` is a NumPy type, so it promotes to `int32`.

## Key takeaways

- A dtype is a kind plus a width; `np.iinfo` and `np.finfo` give its limits.
- `astype` returns a converted copy; float to int truncates.
- Integer arithmetic past a dtype's range wraps around silently; use a wide enough dtype.
- NaN marks missing float values, spreads through arithmetic and needs `np.isnan`; integer arrays cannot hold it.
- In NumPy 2, Python numbers are weak: the array's dtype sets the precision, and a value that does not fit raises `OverflowError`.

## Further reading

- [NumPy fundamentals: data types](https://numpy.org/doc/stable/user/basics.types.html)
- [Data type promotion in NumPy](https://numpy.org/doc/stable/reference/arrays.promotion.html)
- [numpy.ndarray.astype](https://numpy.org/doc/stable/reference/generated/numpy.ndarray.astype.html)
- [NEP 50: Promotion rules for Python scalars](https://numpy.org/neps/nep-0050-scalar-promotion.html)
