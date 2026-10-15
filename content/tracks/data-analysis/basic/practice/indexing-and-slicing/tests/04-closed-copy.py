import numpy as np

loans = np.arange(1, 29).reshape(4, 7)
before = loans.copy()
closed = closed_early_week(loans, 1)
assert isinstance(closed, np.ndarray) and closed.shape == (4, 7) and closed.dtype == loans.dtype, (
    "closed_early_week returns an array of the same shape and dtype"
)
expected = before.copy()
expected[1, :3] = 0
check_array(closed, expected, "only the branch's Monday, Tuesday and Wednesday become 0", strict=True)
check_array(loans, before, "closed_early_week does not change loans", strict=True)
assert not np.shares_memory(closed, loans), "closed_early_week returns a new array that shares no data with loans"

again = closed_early_week(loans, 0)
check_array(again[0], np.array([0, 0, 0, 4, 5, 6, 7]), "a second call starts from the unchanged loans")
check_array(again[1], before[1], "a second call leaves the other branches as in loans")

one = np.array([[9, 8, 7, 6, 5, 4, 3]])
check_array(closed_early_week(one, 0), np.array([[0, 0, 0, 6, 5, 4, 3]]), "a table of one branch", strict=True)
check_array(one, np.array([[9, 8, 7, 6, 5, 4, 3]]), "the one-branch table is not changed", strict=True)

zeros_already = np.zeros((2, 7), dtype=np.int64)
check_array(closed_early_week(zeros_already, -1), np.zeros((2, 7), dtype=np.int64), "a branch that lent nothing stays at 0", strict=True)
