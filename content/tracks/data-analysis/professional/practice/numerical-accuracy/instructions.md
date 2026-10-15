Write the three functions of `solution.py`. Each takes Series and returns a new Series with the
same index as its first argument; none may change what it is given.

1. `to_pence(prices)` takes a `str` Series of prices in pounds as the wholesaler writes them,
   such as `"2.675"`, `"3"` or `"-1.005"` (a refund), and returns them as whole pence, an `int64`
   Series with the same name. Round **exactly**, with halves rounded away from zero:
   `"2.675"` is 268, `"0.125"` is 13 and `"-1.005"` is -101. Floats cannot do this: `2.675` is
   stored as 2.67499999..., and `round` sends exact halves to the even neighbour. Build a
   `Decimal` from each string and round it with `quantize(PENNY, rounding=ROUND_HALF_UP)`.
2. `line_totals(quantity, unit_pence)` takes two `int16` Series and returns
   `quantity * unit_pence` for each line as an `int64` Series named `total_pence`. Totals can be
   far above 32,767, the largest `int16`, and must not wrap around.
3. `reconcile(till, bank)` takes two `float64` Series of amounts in pounds, with the same index,
   and returns a `bool` Series named `matches`: `True` where both amounts are present and differ
   by **at most half a penny** (0.005), `False` where they differ by more or either is missing.
   Floats that should be equal rarely are (`0.1 + 0.2` against `0.30` must match), and a
   tolerance relative to the amount would hide a penny on a large sum (`1000.00` against
   `1000.01` must not match).

Example:

```python
prices = pd.Series(["2.675", "0.125", "1.10", "3", "-1.005"], name="price")
print(to_pence(prices).tolist())
quantity = pd.Series([300, 12, 150], dtype="int16")
unit_pence = pd.Series([250, 1999, 300], dtype="int16")
print((quantity * unit_pence).tolist(), line_totals(quantity, unit_pence).tolist())
till = pd.Series([10.10, 0.1 + 0.2, 1000.00, 20.004, np.nan])
bank = pd.Series([10.10, 0.30, 1000.01, 20.006, 5.00])
print(reconcile(till, bank).tolist())
```

```text
[268, 13, 110, 300, -101]
[9464, 23988, -20536] [75000, 23988, 45000]
[True, True, False, True, False]
```

The plain `int16` product wraps around without a warning: 300 times 250 is 75,000, not 9,464.

**Tips.** `Series.map` applies a function to every value. `Decimal("2.675") * 100` is exact. Cast
small integer types up with `astype("int64")` before multiplying. `np.isclose` takes `rtol` and
`atol` and is `False` wherever a value is NaN.
