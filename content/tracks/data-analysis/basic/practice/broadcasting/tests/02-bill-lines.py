import numpy as np

# Three cafés and three loaves: a square table, where a misplaced axis raises no error.
orders = np.array([[1, 2, 3], [4, 0, 6], [10, 10, 10]])
prices = np.array([2.0, 3.0, 4.0])
discounts = np.array([0.5, 0.0, 0.25])
before = (orders.copy(), prices.copy(), discounts.copy())
lines = bill_lines(orders, prices, discounts)
assert isinstance(lines, np.ndarray) and lines.shape == (3, 3), "bill_lines has the shape of orders"
check_array(lines, [[1.0, 3.0, 6.0], [8.0, 0.0, 24.0], [15.0, 22.5, 30.0]], "each café's discount applies to its own row, each price to its own column")
check_array(orders, before[0], "bill_lines does not change orders")
check_array(prices, before[1], "bill_lines does not change prices")
check_array(discounts, before[2], "bill_lines does not change discounts")

wide = bill_lines(np.array([[2, 1, 0, 5]]), np.array([1.5, 2.5, 9.0, 0.4]), np.array([0.2]))
assert wide.shape == (1, 4), "a single café keeps its one row"
check_array(wide, [[2.4, 2.0, 0.0, 1.6]], "bill_lines for a single café with a discount")

tall = bill_lines(np.array([[3], [5], [1], [0]]), np.array([2.0]), np.array([0.0, 0.1, 0.5, 0.3]))
assert tall.shape == (4, 1), "a single loaf keeps its one column"
check_array(tall, [[6.0], [9.0], [1.0], [0.0]], "bill_lines for a single kind of loaf")
