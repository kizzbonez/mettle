Write the two functions of `solution.py`. `stays` has one row per parking ticket and the integer
columns `car_park`, `minutes` (how long the car stayed) and `entry_hour` (0 to 23); its index is
the ticket number, which may be in any order. `tariffs` has the columns `car_park` (each car park
once) and `per_hour` (`float64`). Neither function may change its arguments.

1. `hourly_rates(stays, tariffs)` returns a `float64` Series named `per_hour` with the same index
   as `stays`: the `per_hour` of each stay's car park, NaN when the car park has no tariff.
2. `fees(stays, tariffs)` returns a `float64` Series named `fee` with the same index as `stays`.
   The first rule that applies sets a stay's fee:
   - a stay of 20 minutes or less is free: `0.0`;
   - a car that entered at night, `entry_hour` from 22 to 5 (22:00 to 05:59), pays a flat `4.00`;
   - otherwise every **started** hour costs the car park's `per_hour` (61 minutes is 2 hours), and
     the fee is at most `15.00`. When the car park has no tariff, the fee is NaN.

   Round the fees to 2 decimals.

The tests price **millions** of stays several times over, so write both functions with whole
column operations: no loop over the rows, no `apply(axis=1)`, `iterrows` or `itertuples`, and
no scanning `tariffs` once per stay. A row loop runs out of time.

Example:

```python
tariffs = pd.DataFrame({"car_park": [1, 2, 3], "per_hour": [1.80, 2.40, 1.25]})
stays = pd.DataFrame({
    "car_park": [1, 1, 2, 2, 3, 9, 3],
    "minutes": [15, 75, 130, 600, 200, 45, 61],
    "entry_hour": [10, 9, 14, 8, 23, 12, 6],
})
print(hourly_rates(stays, tariffs).tolist())
print(stays.assign(fee=fees(stays, tariffs)))
```

```text
[1.8, 1.8, 2.4, 2.4, 1.25, nan, 1.25]
   car_park  minutes  entry_hour   fee
0         1       15          10   0.0
1         1       75           9   3.6
2         2      130          14   7.2
3         2      600           8  15.0
4         3      200          23   4.0
5         9       45          12   NaN
6         3       61           6   2.5
```

Ten hours in car park 2 would cost 24.00, so the cap makes it 15.00. Car park 9 has no tariff.

**Tips.** `Series.map` with a Series indexed by `car_park` looks every rate up at once and keeps
the stays' index. `np.ceil(stays["minutes"] / 60)` counts started hours. `np.select` takes a list
of conditions and picks the first that is true, with `default=` for the rest; the result is an
array, so wrap it in a Series with the stays' index.
