import numpy as np

board = results_board(3, 8)
assert isinstance(board, np.ndarray) and board.shape == (3, 8), "results_board has one row per heat and one column per lane"
assert board.dtype == np.float64, "results_board is float64"
assert (board == -1.0).all(), "every place on the board holds -1.0"

single = results_board(1, 1)
assert single.shape == (1, 1) and single.dtype == np.float64 and single[0, 0] == -1.0, (
    "a board for one heat in one lane is a 2-D float64 array holding -1.0"
)
tall = results_board(6, 1)
assert tall.shape == (6, 1) and (tall == -1.0).all(), "a board for six heats in one lane"

lanes = lane_numbers(10)
assert isinstance(lanes, np.ndarray) and lanes.dtype.kind == "i", "lane_numbers returns an integer array"
check_array(lanes, np.arange(1, 11), "lane_numbers starts at 1 and includes the last lane", strict=True)
check_array(lane_numbers(1), np.array([1]), "a pool with one lane has the lane number 1 only", strict=True)
check_array(lane_numbers(2), np.array([1, 2]), "a pool with two lanes", strict=True)
