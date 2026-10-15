import numpy as np

deliveries = np.array([[3.0, 1.0], [1.0, 2.0]])
totals = np.array([5.5, 4.0])
before = (deliveries.copy(), totals.copy())
prices = fruit_prices(deliveries, totals)
assert isinstance(prices, np.ndarray) and prices.shape == (2,), "fruit_prices has one price per fruit"
check_array(prices, [1.4, 1.3], "fruit_prices of two deliveries of two fruits")
check_array(deliveries, before[0], "fruit_prices does not change deliveries")
check_array(totals, before[1], "fruit_prices does not change totals")

four = np.array([
    [5.0, 2.0, 0.0, 1.0],
    [1.0, 4.0, 2.0, 0.0],
    [0.0, 1.0, 6.0, 2.0],
    [2.0, 0.0, 1.0, 3.0],
])
true_prices = np.array([1.75, 0.6, 2.2, 0.95])
found = fruit_prices(four, four @ true_prices)
check_array(found, true_prices, "fruit_prices recovers the prices of four fruits")
assert np.allclose(four @ found, four @ true_prices), "deliveries @ prices gives back the totals"

single = fruit_prices(np.array([[4.0]]), np.array([6.0]))
check_array(single, [1.5], "one delivery of one fruit")

try:
    fruit_prices(np.array([[2.0, 1.0], [4.0, 2.0]]), np.array([3.0, 6.0]))
except np.linalg.LinAlgError:
    pass
else:
    raise AssertionError("deliveries that do not pin the prices down raise LinAlgError")
