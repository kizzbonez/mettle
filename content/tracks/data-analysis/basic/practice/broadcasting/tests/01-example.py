import numpy as np

orders = np.array([[10, 4, 0], [6, 6, 12]])
prices = np.array([2.40, 3.10, 0.85])
discounts = np.array([0.0, 0.10])

lines = bill_lines(orders, prices, discounts)
assert isinstance(lines, np.ndarray) and lines.shape == (2, 3), "bill_lines has the shape of orders"
check_array(lines, [[24.0, 12.4, 0.0], [12.96, 16.74, 9.18]], "bill_lines of the example")

spread = versus_average(orders)
assert isinstance(spread, np.ndarray) and spread.shape == (2, 3), "versus_average has the shape of orders"
check_array(spread, [[2.0, -1.0, -6.0], [-2.0, 1.0, 6.0]], "versus_average of the example")

table = price_list(prices, np.array([1, 6, 12]))
assert isinstance(table, np.ndarray) and table.shape == (3, 3), "price_list has one row per quantity and one column per loaf"
check_array(table, [[2.4, 3.1, 0.85], [14.4, 18.6, 5.1], [28.8, 37.2, 10.2]], "price_list of the example")
