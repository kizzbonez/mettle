import numpy as np

board = results_board(2, 4)
assert isinstance(board, np.ndarray) and board.shape == (2, 4), "results_board(2, 4) has shape (2, 4), as in the example"
assert board.dtype == np.float64, "results_board(2, 4) is a float64 array, as in the example"
check_array(board, np.full((2, 4), -1.0), "results_board(2, 4) holds -1.0 everywhere, as in the example")

check_array(lane_numbers(6), np.array([1, 2, 3, 4, 5, 6]), "lane_numbers(6), as in the example", strict=True)

starts = heat_starts(60, 4)
assert isinstance(starts, np.ndarray) and starts.dtype == np.float64, "heat_starts returns a float64 array"
check_array(starts, [0.0, 15.0, 30.0, 45.0], "heat_starts(60, 4), as in the example", strict=True)
check_array(heat_starts(90, 4), [0.0, 22.5, 45.0, 67.5], "heat_starts(90, 4), as in the example", strict=True)

pads = np.array([31.2, 29.8, 33.05])
assert as_times(pads) is pads, "as_times returns a float64 array it is given as it is, as in the example"
converted = as_times([31, 30])
assert isinstance(converted, np.ndarray) and converted.dtype == np.float64, "as_times([31, 30]) is a float64 array"
check_array(converted, [31.0, 30.0], "as_times([31, 30]), as in the example")
