import numpy as np

prices = np.array([2.0, 0.5])
quantities = np.array([1, 10, 100, 3])
before = (prices.copy(), quantities.copy())
table = price_list(prices, quantities)
assert isinstance(table, np.ndarray) and table.shape == (4, 2), "price_list has one row per quantity and one column per loaf"
check_array(table, [[2.0, 0.5], [20.0, 5.0], [200.0, 50.0], [6.0, 1.5]], "row i prices quantities[i] of every loaf")
check_array(prices, before[0], "price_list does not change prices")
check_array(quantities, before[1], "price_list does not change quantities")

square = price_list(np.array([1.0, 2.0, 3.0]), np.array([1, 2, 5]))
check_array(square, [[1.0, 2.0, 3.0], [2.0, 4.0, 6.0], [5.0, 10.0, 15.0]], "as many quantities as loaves still gives a table of every pair")

one = price_list(np.array([1.2, 3.4, 0.9]), np.array([12]))
assert one.shape == (1, 3), "a single quantity gives a table of one row"
check_array(one, [[14.4, 40.8, 10.8]], "price_list for a single quantity")

column = price_list(np.array([2.5]), np.array([1, 2]))
assert column.shape == (2, 1), "a single loaf gives a table of one column"
check_array(column, [[2.5], [5.0]], "price_list for a single loaf")
