import numpy as np

orders = np.array([[2, 9, 4], [4, 3, 4], [6, 0, 4]])
before = orders.copy()
spread = versus_average(orders)
assert isinstance(spread, np.ndarray) and spread.shape == (3, 3), "versus_average has the shape of orders"
assert spread.dtype.kind == "f", "versus_average returns floats"
check_array(spread, [[-2.0, 5.0, 0.0], [0.0, -1.0, 0.0], [2.0, -4.0, 0.0]], "each order is compared with the average of its own column")
check_array(orders, before, "versus_average does not change orders")
check_array(spread.mean(axis=0), [0.0, 0.0, 0.0], "every column of the result averages zero", atol=1e-12)

uneven = versus_average(np.array([[1, 0], [0, 0], [0, 2]]))
check_array(uneven, [[2 / 3, -2 / 3], [-1 / 3, -2 / 3], [-1 / 3, 4 / 3]], "averages that are not whole numbers")

single = versus_average(np.array([[5, 7, 1]]))
check_array(single, [[0.0, 0.0, 0.0]], "a single café is exactly average")
