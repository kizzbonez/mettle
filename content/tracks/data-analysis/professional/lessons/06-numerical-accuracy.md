---
title: Numerical Accuracy
summary: Know when your numbers are not quite right and what to do about it. Floating-point error in sums, comparing floats with tolerances, silent integer overflow in NumPy and pandas, NaN propagation, NumPy 2's promotion rules, rounding half to even, and `decimal` for money.
minutes: 35
objectives:
  - Explain why float sums drift, and reduce the error with pairwise sums, `math.fsum` and `float64` accumulators
  - Compare floats with `np.isclose`, `np.allclose` and `math.isclose`, choosing `rtol` and `atol`
  - Recognise silent integer overflow in arrays and int64 columns, and NumPy 2 promotion surprises
  - Predict how NaN moves through NumPy and pandas calculations
  - Round correctly, and keep money exact with integer cents or `Decimal`
---

## Outline

1. Floating-point error in sums
2. Comparing floats
3. Integer overflow
4. NaN propagation
5. Promotion surprises under NumPy 2
6. Rounding and money

## Floating-point error in sums

A `float64` stores a number in binary with about 15 to 17 significant decimal digits. Most decimal
fractions, such as 0.1, have no exact binary form, so each stored value is slightly off and each
addition rounds again. Over many additions the errors can add up:

```python
import math

import numpy as np
import pandas as pd

tips = [0.1] * 10
total = 0.0
for tip in tips:
    total += tip
print(total, sum(tips), math.fsum(tips))

readings = np.full(1_000_000, 0.1, dtype=np.float32)
print(readings.sum(), readings.cumsum()[-1], readings.sum(dtype=np.float64))
print(pd.Series(readings).sum())
```

```text
0.9999999999999999 1.0 1.0
100000.01 100958.34 100000.00149011612
100000.01
```

The plain loop rounds after every addition and misses 1.0. The built-in `sum` uses extra
precision for intermediate steps, and `math.fsum` tracks the lost digits so the result is
rounded only once: the most accurate, and the slowest.

The second line shows a million `float32` readings, which keep only about 7 digits. `cumsum` adds
them one after another and ends almost 1% too high. `sum` is far better because NumPy uses
**pairwise summation**, adding numbers in a tree of small groups so errors do not pile up; pandas
gets the same result. Asking for a `float64` accumulator with `dtype=np.float64` is better still
(the exact answer is 100000.0015 because a `float32` 0.1 is really 0.10000000149). The rules: keep
data in `float64` unless memory forces otherwise, accumulate in `float64`, and use `math.fsum`
when a total must be as exact as floats allow.

## Comparing floats

Because computed floats carry tiny errors, `==` between them is almost never the right test:

```python
print(0.1 + 0.2 == 0.3, 0.1 + 0.2)
print(math.isclose(0.1 + 0.2, 0.3), np.isclose(0.1 + 0.2, 0.3))
ledger = pd.DataFrame({"till": [10.10, 20.20, 30.30], "bank": [10.1, 20.199999999, 30.31]})
print(np.isclose(ledger["till"], ledger["bank"]), np.allclose(ledger["till"], ledger["bank"]))
print(np.isclose(ledger["till"], ledger["bank"], rtol=0, atol=0.005))
print(np.isclose(1e-9, 2e-9), np.isclose(1e-9, 2e-9, atol=0))
```

```text
False 0.30000000000000004
True True
[ True  True False] False
[ True  True False]
True False
```

`np.isclose(a, b)` is element-wise and true where `|a - b| <= atol + rtol * |b|`, with defaults
`rtol=1e-5` and `atol=1e-8`; `np.allclose` asks whether every element is close. For a
reconciliation in money, say what "close" means in the unit: `rtol=0, atol=0.005` accepts
differences below half a cent and catches the real 1-cent mismatch. The last line is the trap in
the docs: the default `atol` of `1e-8` makes `1e-9` and `2e-9` "close" although one is twice the
other. With values much smaller than 1, set `atol` yourself. Note too that `np.isclose` scales by
`b`, so swapping the arguments can change the answer; `math.isclose` is symmetric.

## Integer overflow

NumPy integers have a fixed width, and arithmetic on arrays **wraps around** silently when a
result does not fit, like a car's odometer. pandas integer columns are NumPy arrays, so they
behave the same:

```python
seats = np.array([120, 100], dtype=np.int8)
print(seats.sum(), seats + seats)
stamps = pd.Series(pd.date_range("2026-03-01", periods=6, freq="D", unit="ns"))
as_ns = stamps.astype("int64")
print(as_ns.sum(), as_ns.sum() // 6)
print(stamps.mean())
```

```text
220 [-16 -56]
-7811508873709551616 -1301918145618258603
2026-03-03 12:00:00
```

`sum` on a small integer type accumulates in the platform's 64-bit integer, so 220 is right, but
element-wise `seats + seats` stays `int8` (at most 127) and wraps to negative numbers, with no
warning. (A single NumPy scalar at least warns, as the next section shows.) Even `int64`, up to about 9.2 × 10¹⁸, is not safe:
a 2026 timestamp is about 1.8 × 10¹⁸ nanoseconds since 1970, so adding six of them wraps, and
the "average" lands in 1928. The fix is to stay with the type designed for the job: `stamps.mean()`
is correct. Check the limits with `np.iinfo(np.int16).max` before choosing a small type, and
convert to `float64` or Python `int` when values may grow.

## NaN propagation

NaN, "not a number", marks a missing or undefined float. Arithmetic with NaN gives NaN, and NumPy
and pandas disagree on the default:

```python
rain = np.array([1.2, np.nan, 0.4])
print(rain.sum(), np.nansum(rain), rain.mean(), np.nanmean(rain))
series = pd.Series(rain)
print(series.sum(), series.sum(skipna=False), series.mean())
empty = pd.Series([np.nan, np.nan])
print(empty.sum(), empty.sum(min_count=1), empty.mean())
print(np.nan == np.nan, (series > 1).tolist(), (series <= 1).tolist())
```

```text
nan 1.6 nan 0.8
1.6 nan 0.8
0.0 nan nan
False [True, False, False] [False, False, True]
```

- NumPy propagates NaN; its `nan` functions skip it. pandas skips missing values by default
  (`skipna=True`).
- The sum of nothing is 0, so a column with no data at all sums to `0.0`, which looks like a
  real measurement. `min_count=1` returns NaN unless at least one value is present.
- NaN is not equal to itself, and every comparison with NaN is `False`: the missing reading is in
  neither `series > 1` nor `series <= 1`, so a filter on either silently drops it.

## Promotion surprises under NumPy 2

NumPy 2 follows NEP 50: a Python `int` or `float` is **weak** and takes the NumPy operand's type,
while NumPy scalars and arrays are **strong**. The result type never depends on the values. Run
on its own as `promotion.py`:

```python
import numpy as np

print(repr(np.uint8(200) + 100))
print(np.array([200], dtype=np.uint8) + 100)
print((np.array([1.5], dtype=np.float32) * 2.0).dtype, (np.array([1.5], dtype=np.float32) * np.float64(2.0)).dtype)
print(repr(np.float32(0.1) + 0.2))
np.array([1], dtype=np.uint8) + 300
```

```text
/tmp/work/promotion.py:3: RuntimeWarning: overflow encountered in scalar add
  print(repr(np.uint8(200) + 100))
np.uint8(44)
[44]
float32 float64
np.float32(0.3)
Traceback (most recent call last):
  ...
OverflowError: Python integer 300 out of bounds for uint8
```

Adding the Python `100` keeps `uint8` and wraps to 44 (before NumPy 2 the result was promoted to
a wider type and gave 300). A `float32` array stays `float32` with a Python float, but becomes
`float64` with a NumPy `float64`. A Python integer that cannot fit the array's type at all raises
`OverflowError`. When a small type meets a value that might not fit, cast
first: `array.astype(np.int64) + 300`.

## Rounding and money

Python's `round`, NumPy's `np.round` and pandas' `.round` all round exact halves **to even**
("banker's rounding"), which avoids a bias upwards over many values. They still differ on numbers
that only look like halves:

```python
from decimal import ROUND_HALF_UP, Decimal

print(round(0.5), round(1.5), round(2.5), np.round([0.5, 1.5, 2.5]))
print(round(2.675, 2), pd.Series([2.675, 1.125]).round(2).tolist())
print(Decimal(2.675))
price = Decimal("2.665")
print(price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), price.quantize(Decimal("0.01")))
lines = pd.Series([Decimal("0.10")] * 3)
print(lines.sum(), lines.dtype, sum([0.10] * 3))
```

```text
0 2 2 [0. 2. 2.]
2.67 [2.68, 1.12]
2.67499999999999982236431605997495353221893310546875
2.67 2.66
0.30 object 0.30000000000000004
```

`2.675` is stored as 2.67499999..., so Python's exact `round` gives 2.67, while NumPy scales by 100
first, gets exactly 267.5 after rounding error, and rounds to the even 268. The NumPy docs warn
that `np.round` is fast but "sometimes inexact" for this reason.

For money, binary floats are the wrong tool. The standard library's `decimal` module stores
decimal digits exactly: build a `Decimal` from a **string**, and round with `quantize` and the
rule your business uses, `ROUND_HALF_UP` here (the default is half to even). pandas can hold
`Decimal` values, but only as slow `object` columns, so a common pattern is to keep amounts as
integer **cents** in an `int64` column for the analysis, and convert to `Decimal` or format with
two decimals only at the end.

## Common mistakes

- **`==` on computed floats.** Use `np.isclose` with a tolerance that means something in your units.
- **Trusting `float32` totals.** Accumulate in `float64` (`sum(dtype=np.float64)`).
- **Element-wise arithmetic on small integer types.** It wraps without a warning; cast up first.
- **Reading a sum of 0 as "no rain".** An all-missing column sums to 0; use `min_count=1`.
- **`Decimal(2.675)` instead of `Decimal("2.675")`.** A float argument carries its binary error in.

## Practice

1. Why does `pd.Series([0.1] * 3).sum() == 0.3` give `False`, and how should a test check it?
2. A column of daily visitor counts is stored as `int16`. What goes wrong with
   `visits * 10`, and what is the fix?
3. Round 0.125 and 0.375 to two places half up, exactly.

### Answers

```python
print(np.isclose(pd.Series([0.1] * 3).sum(), 0.3))
visits = pd.Series([3_500, 4_200], dtype="int16")
print((visits * 10).tolist(), (visits.astype("int64") * 10).tolist())
print([Decimal(text).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) for text in ["0.125", "0.375"]])
```

```text
True
[-30536, -23536] [35000, 42000]
[Decimal('0.13'), Decimal('0.38')]
```

1. Each 0.1 is slightly off, so the total is `0.30000000000000004`. Compare with `np.isclose`.
2. 35,000 exceeds 32,767 and wraps to a negative number. Cast to `int64` first.
3. Build the `Decimal` values from strings and `quantize` with `ROUND_HALF_UP`.

## Key takeaways

- Float sums carry rounding error; NumPy and pandas sum pairwise, `math.fsum` is exact to one rounding.
- Compare floats with `np.isclose` and `np.allclose`, and set `atol` for small values or money.
- Integer arrays and columns wrap silently on overflow, even `int64`; choose types with room.
- NaN propagates in NumPy and is skipped by pandas; an all-missing sum is 0 unless `min_count=1`.
- Python scalars are weak under NumPy 2; rounding is half to even; use `Decimal` or cents for money.

## Further reading

- [Python tutorial: Floating-point arithmetic, issues and limitations](https://docs.python.org/3/tutorial/floatingpoint.html)
- [NumPy: numpy.isclose](https://numpy.org/doc/stable/reference/generated/numpy.isclose.html)
- [NumPy: numpy.sum (notes on precision and overflow)](https://numpy.org/doc/stable/reference/generated/numpy.sum.html)
- [NEP 50: Promotion rules for Python scalars](https://numpy.org/neps/nep-0050-scalar-promotion.html)
