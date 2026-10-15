import numpy as np

# Four days, two drinks, three fruits: no shape matches another, so only a matrix product fits.
sales = np.array([[10, 0], [0, 10], [4, 6], [0, 0]])
recipes = np.array([[0.2, 0.0, 0.5], [0.1, 0.3, 0.0]])
before = (sales.copy(), recipes.copy())
used = fruit_needed(sales, recipes)
assert isinstance(used, np.ndarray) and used.shape == (4, 3), "fruit_needed of (days, drinks) and (drinks, fruits) has shape (days, fruits)"
check_array(used, [[2.0, 0.0, 5.0], [1.0, 3.0, 0.0], [1.4, 1.8, 2.0], [0.0, 0.0, 0.0]], "each day's fruit adds up every drink sold times its recipe")
check_array(sales, before[0], "fruit_needed does not change sales")
check_array(recipes, before[1], "fruit_needed does not change recipes")

# Square arrays, where an element-wise product raises no error but gives the wrong answer.
square = fruit_needed(np.array([[1.0, 2.0], [3.0, 4.0]]), np.array([[0.5, 0.0], [0.25, 1.0]]))
check_array(square, [[1.0, 2.0], [2.5, 4.0]], "fruit_needed is a matrix product even when both arrays are square")

one_day = fruit_needed(np.array([[3, 1, 2]]), np.array([[0.1], [0.4], [0.2]]))
assert one_day.shape == (1, 1), "one day and one fruit give a (1, 1) array"
check_array(one_day, [[1.1]], "fruit_needed for one day and one fruit")
