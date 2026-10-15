Write the two functions of `solution.py`. Each takes `stays`, a DataFrame with the columns
`car_park` (text), `minutes` (`int64`, at least 1) and `blue_badge` (`bool`), and returns a
Series with the **same index**, without changing `stays`. The sample is `data/stays.csv`.

The starter holds `charge_row`, the old system's rule for **one** stay. It is correct, and
`stays.apply(charge_row, axis=1)` gives the right answers, but a Python function per row is
far too slow for the council's 1,000,000 stays a year, which a hidden test prices all at once.

1. `charges(stays)` returns the charge of every stay, as a `float64` Series named `charge`:
   - the **base** price by length of stay: up to 30 minutes `0.00`; up to 120 minutes `2.00`;
     up to 240 minutes `3.50`; longer, `3.50` plus `1.00` for every **started** hour after the
     first 240 minutes (241 to 300 minutes is one started hour), but never more than `10.00`;
   - times the car park's factor: `station` 1.5, `high street` 1.0, `leisure centre` 0.5. In
     any other car park (names are exact) the charge is **missing**;
   - a blue badge holder pays `0.0`, in any car park;
   - rounded to 2 decimals.
2. `stay_band(stays)` returns a Series of text named `band`: `quick` (up to 30 minutes),
   `short` (up to 120), `half day` (up to 240) or `long`.

**The rule of this lab:** no row-by-row code. A hidden test reads your file: it must not
contain `for` or `while` loops, comprehensions, `apply`, `iterrows`, `itertuples` or
`np.vectorize`.

Example:

```python
stays = pd.read_csv("data/stays.csv")
charges(stays).tolist()
# [0.0, 3.0, 3.5, 2.25, 6.75, 0.0, nan, 10.0, 1.75]
stay_band(stays).tolist()
# ['quick', 'short', 'half day', 'long', 'long', 'long', 'short', 'long', 'half day']
```

The 241-minute stay at the leisure centre has one started hour: (3.50 + 1.00) × 0.5 = 2.25. The
whole day on the high street would be 23.50 but is capped at 10.00, and the hospital car park
is not one of the three.

**Tips.** `map(FACTORS)` looks up every car park at once and gives `NaN` for unknown names.
`clip(lower=0)`, `np.ceil` and `np.minimum` replace `max`, `math.ceil` and `min`.
`np.select(conditions, choices, default=...)` takes the first true condition, and
`np.where` or `Series.where` handles the badge. `np.select` returns an array without an index:
wrap it with `pd.Series(..., index=stays.index)`.
