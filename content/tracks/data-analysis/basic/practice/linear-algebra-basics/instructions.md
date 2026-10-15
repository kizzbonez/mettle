Write the three functions of `solution.py` with `@` and `np.linalg`, no loops. Results are
floats and are not rounded; the tests compare them within a small tolerance. No function
changes its arguments.

1. `fruit_needed(sales, recipes)` receives `sales`, with one row per day and one column per
   drink (the number sold), and `recipes`, with one row per drink and one column per fruit
   (kilograms of that fruit in one drink). It returns the kilograms of each fruit used each
   day: shape `(days, fruits)`.
2. `fruit_prices(deliveries, totals)` receives a square array `deliveries`, one row per
   delivery and one column per fruit (kilograms delivered), and `totals`, what each delivery
   cost. It returns the price per kilogram of each fruit: the `prices` for which
   `deliveries @ prices` equals `totals`. When the deliveries do not pin the prices down (a
   singular matrix), let `np.linalg.LinAlgError` propagate.
3. `trend(weeks, sold)` receives two one-dimensional float arrays of the same length (at least
   two different weeks) and returns a tuple `(slope, intercept)` of two floats: the
   least-squares straight line `sold = slope * week + intercept`.

Example:

```python
recipes = np.array([
    [0.30, 0.10, 0.00],   # Sunrise: oranges, apples, bananas in kg
    [0.00, 0.25, 0.10],   # Green
    [0.05, 0.10, 0.15],   # Berry
])
sales = np.array([[20, 15, 10], [30, 5, 12]])
fruit_needed(sales, recipes)
# array([[6.5 , 6.75, 3.  ],
#        [9.6 , 5.45, 2.3 ]])

deliveries = np.array([[2.0, 1.0, 1.0], [1.0, 3.0, 0.0], [0.0, 2.0, 4.0]])
fruit_prices(deliveries, np.array([5.0, 3.9, 6.4]))   # array([1.5, 0.8, 1.2])

weeks = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])
sold = np.array([52.0, 55.0, 61.0, 62.0, 68.0, 70.0])
trend(weeks, sold)   # (3.714285714..., 48.333333...)
```

**Tips.** `@` multiplies matrices: `(n, k) @ (k, m)` gives `(n, m)`, while `*` works
element by element. `np.linalg.solve(A, b)` solves `A @ x = b` without building an inverse.
For a line, `np.linalg.lstsq` takes a design matrix with the weeks in one column and ones in
the other, and returns four things, the coefficients first.
