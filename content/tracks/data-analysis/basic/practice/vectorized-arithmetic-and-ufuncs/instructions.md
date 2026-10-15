Write the two functions of `solution.py` with array arithmetic and ufuncs. `km` is a float
array of trip distances in kilometres and `waiting` a float array, of the same shape, of the
minutes each trip spent waiting. Neither function changes the arrays it is given.

1. `fares(km, waiting)` returns the fare of every trip, an array of the same shape: `3.00`
   plus `1.80` per kilometre plus `0.30` per minute of waiting, then limited to **at least
   5.00 and at most 80.00**, then rounded to **2 decimal places**.
2. `per_km(fare, km)` returns each fare divided by its distance, rounded to 2 decimal places.
   A trip of `0.0` km (cancelled at the kerb) gives NaN. NumPy must not print a
   `RuntimeWarning`: a hidden test turns warnings into errors.

**Size.** A hidden test prices ten years of trips, one month of half a million trips at a
time: sixty million trips in all. A Python loop, or `np.vectorize`, over that many trips does
not finish within the 10-second limit; whole-array expressions take a second or two.

Example:

```python
km = np.array([2.3, 0.0, 12.5, 60.0, 0.8])
waiting = np.array([4.0, 3.0, 10.0, 25.0, 0.0])
fare = fares(km, waiting)
fare              # array([ 8.34,  5.  , 28.5 , 80.  ,  5.  ])
per_km(fare, km)  # array([3.63,  nan, 2.28, 1.33, 6.25])
```

The second trip would cost 3.90, which the minimum raises to 5.00; the fourth would cost
118.50, which the maximum caps at 80.00.

**Tips.** `np.clip` limits values to a range and `np.round` takes the number of decimals.
Division by zero gives `inf` or `nan` with a warning: compute it inside
`with np.errstate(divide="ignore", invalid="ignore"):` and then choose with `np.where`.
