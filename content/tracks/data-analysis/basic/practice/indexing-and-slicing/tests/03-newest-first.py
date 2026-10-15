import numpy as np

loans = np.arange(100, 128).reshape(4, 7)
first = newest_first(loans, 0)
assert isinstance(first, np.ndarray) and first.shape == (7,), "newest_first is one-dimensional"
check_array(first, np.array([106, 105, 104, 103, 102, 101, 100]), "newest_first of the first branch includes Monday, last")
assert np.shares_memory(first, loans), "newest_first is a view of loans"

last = newest_first(loans, -1)
check_array(last, np.array([127, 126, 125, 124, 123, 122, 121]), "a negative branch counts from the end")
assert np.shares_memory(last, loans), "newest_first of the last branch is a view of loans"

third = newest_first(loans, 2)
check_array(third, np.array([120, 119, 118, 117, 116, 115, 114]), "newest_first picks the branch it is given")
third[0] = 0
assert loans[2, 6] == 0, "writing to newest_first's first element reaches that branch's Sunday in loans"

one = np.array([[3, 1, 4, 1, 5, 9, 2]])
check_array(newest_first(one, 0), np.array([2, 9, 5, 1, 4, 1, 3]), "newest_first of a table with one branch")
