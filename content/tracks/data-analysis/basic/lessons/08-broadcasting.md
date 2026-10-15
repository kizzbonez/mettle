---
title: Broadcasting
summary: Learn the rules NumPy uses to combine arrays of different shapes, apply them to scale every row of a table, centre its columns and add a row to a column, and fix the "operands could not be broadcast together" error with `reshape` or `np.newaxis`.
minutes: 35
objectives:
  - State the broadcasting rules and decide whether two shapes are compatible, and what shape results
  - Combine a table with a row of values, one per column, without a loop
  - Combine a table with one value per row by turning a one-dimensional array into a column
  - Centre the columns of a table and turn rows into shares of their totals
  - Read the broadcast error and fix it with `np.newaxis` or `reshape`
---

## Outline

1. What broadcasting is
2. The rules
3. One value per column
4. One value per row: the error and its fix
5. Centring columns and shares of a total
6. A row plus a column

## What broadcasting is

Lesson 7 combined arrays of the same shape, and an array with a single number. **Broadcasting** is the rule that lets NumPy combine arrays of different shapes. A single number is the simplest case: in `price * 1.2` NumPy behaves as if 1.2 were repeated to the shape of `price`. The NumPy guide stresses that the stretching is "only conceptual": nothing is copied, so broadcasting is as fast and as light on memory as the same-shape case.

## The rules

To combine two arrays, NumPy lines up their shapes **from the right**, the last axis first, and compares the lengths axis by axis. The guide puts it like this: two dimensions are compatible when

1. they are equal, or
2. one of them is 1.

An array with fewer axes is treated as if it had extra axes of length 1 on the left. Each axis of the result takes the larger length, and an axis of length 1 is stretched to match. If any pair is incompatible, NumPy raises `ValueError: operands could not be broadcast together`.

```text
sold   (2d):  3 x 4        stall_bonus (1d):      3       zone_fare (2d):  3 x 1
price  (1d):      4        sold        (2d):  3 x 4       peak_extra(1d):      4
result (2d):  3 x 4        mismatch: 3 against 4          result    (2d):  3 x 4
```

`np.broadcast_shapes` applies the rules without any data, which is handy for checking: `np.broadcast_shapes((3, 1), (4,))` returns `(3, 4)`.

## One value per column

A table with one row per market stall and one column per product, and the price of each product:

```python
import numpy as np

# Units sold: one row per market stall, one column per product
sold = np.array([
    [12, 30, 8, 5],
    [20, 18, 0, 9],
    [7, 25, 14, 3],
])
price = np.array([3.5, 1.2, 4.0, 6.5])
print(sold.shape, price.shape)
revenue = sold * price
print(revenue)
print(revenue.sum(axis=1))
```

```text
(3, 4) (4,)
[[42.  36.  32.  32.5]
 [70.  21.6  0.  58.5]
 [24.5 30.  56.  19.5]]
[142.5 150.1 130. ]
```

From the right: 4 against 4, equal. `price` has no second axis, so it counts as 1 against 3, and is stretched down the rows. Every row is multiplied by the same four prices, which is exactly "price per column". The last line totals each stall's revenue.

## One value per row: the error and its fix

Now one value per **stall**, three of them, to add to every product of that stall:

```python
import numpy as np

sold = np.array([
    [12, 30, 8, 5],
    [20, 18, 0, 9],
    [7, 25, 14, 3],
])
stall_bonus = np.array([10, 15, 12])
sold + stall_bonus
```

```text
Traceback (most recent call last):
  File "/tmp/work/ex.py", line 9, in <module>
    sold + stall_bonus
    ~~~~~^~~~~~~~~~~~~
ValueError: operands could not be broadcast together with shapes (3,4) (3,) 
```

From the right, 4 against 3: neither equal nor 1. A one-dimensional array always lines up with the **last** axis, the columns, never the rows. The fix is to give the three values a shape of `(3, 1)`, a column, with `np.newaxis` from lesson 4 or with `reshape(-1, 1)`. Replace the last line with:

```python
print(stall_bonus[:, np.newaxis].shape)
print(sold + stall_bonus[:, np.newaxis])
print(sold + stall_bonus.reshape(-1, 1))
```

```text
(3, 1)
[[22 40 18 15]
 [35 33 15 24]
 [19 37 26 15]]
[[22 40 18 15]
 [35 33 15 24]
 [19 37 26 15]]
```

Now the shapes are `(3, 4)` and `(3, 1)`: 4 against 1 stretches the column across, 3 against 3 matches. Each stall's bonus went to every product of that stall. The rule to remember: **one value per column** is shape `(n_columns,)`; **one value per row** must be a column, shape `(n_rows, 1)`.

## Centring columns and shares of a total

Two everyday uses follow directly. **Centring** a column means subtracting its mean, so that each value says how far it is above or below average. `mean(axis=0)` computes one mean per column, shape `(3,)`, which broadcasts down the rows (lesson 9 covers `mean` with `sum` and the other summaries):

```python
import numpy as np

# Height (cm), weight (kg) and age (years) of five patients
patients = np.array([
    [172.0, 68.0, 34.0],
    [160.0, 55.0, 51.0],
    [181.0, 90.0, 29.0],
    [168.0, 72.0, 45.0],
    [175.0, 80.0, 61.0],
])
column_means = patients.mean(axis=0)
print(column_means, column_means.shape)
centred = patients - column_means
print(centred)
print(centred.mean(axis=0))
```

```text
[171.2  73.   44. ] (3,)
[[  0.8  -5.  -10. ]
 [-11.2 -18.    7. ]
 [  9.8  17.  -15. ]
 [ -3.2  -1.    1. ]
 [  3.8   7.   17. ]]
[1.13686838e-14 0.00000000e+00 0.00000000e+00]
```

The centred columns average to zero, apart from a rounding error of about 1e-14 in the first: floats are not exact, and lesson 12 shows how to compare them.

**Shares of a row total** need the other direction. Back to the stalls, with `sold` as above: the totals per row have shape `(3,)`, so they must become a column before dividing:

```python
stall_totals = sold.sum(axis=1)
shares = sold / stall_totals[:, np.newaxis]
print(np.round(shares, 2))
print(shares.sum(axis=1))
```

```text
[[0.22 0.55 0.15 0.09]
 [0.43 0.38 0.   0.19]
 [0.14 0.51 0.29 0.06]]
[1. 1. 1.]
```

Each row now shows what fraction of that stall's units each product made up, and each row sums to 1.

## A row plus a column

When both arrays have a length-one axis, both are stretched. A column of three zone fares plus a row of four time-of-day extras gives every combination, a 3 by 4 fare table:

```python
import numpy as np

zone_fare = np.array([2.0, 3.5, 5.0])
peak_extra = np.array([0.0, 0.8, 1.5, 0.4])
fares = zone_fare[:, np.newaxis] + peak_extra
print(zone_fare[:, np.newaxis].shape, peak_extra.shape, fares.shape)
print(fares)
```

```text
(3, 1) (4,) (3, 4)
[[2.  2.8 3.5 2.4]
 [3.5 4.3 5.  3.9]
 [5.  5.8 6.5 5.4]]
```

The NumPy guide calls this an **outer** operation. It replaces two nested loops.

## Common mistakes

- **A per-row array left one-dimensional.** `sold + stall_bonus` with shapes `(3, 4)` and `(3,)` fails, and with a square table it silently does the wrong thing, adding per column. Make per-row values a column: `[:, np.newaxis]`.
- **Expecting broadcasting to grow the left side of `+=`.** `b += a` with `b` of shape `(4,)` and `a` of shape `(3, 4)` raises `ValueError: non-broadcastable output operand with shape (4,) doesn't match the broadcast shape (3,4)`. The result does not fit in `b`; write `b = b + a`.
- **Building the repeated array yourself.** There is no need to stack copies of `price` three times; broadcasting does it without the memory.

## Practice

1. Four students sat three papers, `marks = np.array([[62.0, 75.0, 58.0], [80.0, 68.0, 90.0], [45.0, 55.0, 70.0], [71.0, 82.0, 66.0]])`, weighted `[0.2, 0.3, 0.5]`. Compute each student's weighted total.
2. Centre each paper's marks on its mean.
3. Divide each student's marks by that student's best mark.
4. Hours 1 to 3 at hourly rates of 12.0 and 15.5: build the 3 by 2 table of pay.

### Answers

```python
import numpy as np

marks = np.array([[62.0, 75.0, 58.0], [80.0, 68.0, 90.0], [45.0, 55.0, 70.0], [71.0, 82.0, 66.0]])
weights = np.array([0.2, 0.3, 0.5])
print((marks * weights).sum(axis=1))
print(marks - marks.mean(axis=0))
row_max = marks.max(axis=1)
print(np.round(marks / row_max[:, np.newaxis], 2))
hours = np.arange(1, 4)
rates = np.array([12.0, 15.5])
print(hours[:, np.newaxis] * rates)
```

```text
[63.9 81.4 60.5 71.8]
[[ -2.5   5.  -13. ]
 [ 15.5  -2.   19. ]
 [-19.5 -15.   -1. ]
 [  6.5  12.   -5. ]]
[[0.83 1.   0.77]
 [0.89 0.76 1.  ]
 [0.64 0.79 1.  ]
 [0.87 1.   0.8 ]]
[[12.  15.5]
 [24.  31. ]
 [36.  46.5]]
```

1. The weights are one per column, shape `(3,)`, so they broadcast across the rows.
2. Column means, shape `(3,)`, broadcast down the rows.
3. The best marks are one per row, so they become a column first.
4. A column of hours times a row of rates gives every combination.

## Key takeaways

- Shapes are compared from the right; two lengths are compatible when equal or when one is 1.
- A missing axis on the left counts as length 1; a length-1 axis is stretched without copying.
- A one-dimensional array lines up with the columns. Values per row need shape `(n, 1)`: use `[:, np.newaxis]` or `reshape(-1, 1)`.
- Centring columns is `table - table.mean(axis=0)`; shares of row totals need the totals as a column.
- A column combined with a row gives a table of every combination.

## Further reading

- [NumPy fundamentals: broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html)
- [NumPy: the absolute basics for beginners (broadcasting)](https://numpy.org/doc/stable/user/absolute_beginners.html#broadcasting)
- [numpy.broadcast_shapes](https://numpy.org/doc/stable/reference/generated/numpy.broadcast_shapes.html)
