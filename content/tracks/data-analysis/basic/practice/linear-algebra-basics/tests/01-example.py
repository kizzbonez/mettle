import numpy as np

recipes = np.array([
    [0.30, 0.10, 0.00],
    [0.00, 0.25, 0.10],
    [0.05, 0.10, 0.15],
])
sales = np.array([[20, 15, 10], [30, 5, 12]])
used = fruit_needed(sales, recipes)
assert isinstance(used, np.ndarray) and used.shape == (2, 3), "fruit_needed has one row per day and one column per fruit"
check_array(used, [[6.5, 6.75, 3.0], [9.6, 5.45, 2.3]], "fruit_needed of the example")

deliveries = np.array([[2.0, 1.0, 1.0], [1.0, 3.0, 0.0], [0.0, 2.0, 4.0]])
prices = fruit_prices(deliveries, np.array([5.0, 3.9, 6.4]))
assert isinstance(prices, np.ndarray) and prices.shape == (3,), "fruit_prices has one price per fruit"
check_array(prices, [1.5, 0.8, 1.2], "fruit_prices of the example")

line = trend(np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]), np.array([52.0, 55.0, 61.0, 62.0, 68.0, 70.0]))
assert isinstance(line, tuple) and len(line) == 2, "trend returns a tuple (slope, intercept)"
check_array(np.array(line, dtype=float), [65 / 17.5, 368 / 6 - 3.5 * 65 / 17.5], "trend of the example")
