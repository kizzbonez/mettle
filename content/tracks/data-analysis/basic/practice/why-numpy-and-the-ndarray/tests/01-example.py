import numpy as np

report = ride_report([[12.5, 20.0, 31.0], [8.0, 15.5, 0.0]])
assert isinstance(report, dict), "ride_report returns a dict"
assert sorted(report) == ["dtype", "km", "shape", "size"], "the dict has exactly the keys shape, size, dtype and km"
assert report["shape"] == (2, 3), "the shape of the example log, as in the example"
assert report["size"] == 6, "the size of the example log, as in the example"
assert report["dtype"] == np.dtype("float64"), "the dtype of the example log, as in the example"
assert isinstance(report["km"], np.ndarray), "km is a NumPy array, computed on the whole array at once"
assert report["km"].shape == (2, 3), "km has the same shape as the log"
check_array(report["km"], [[20.1168, 32.18688, 49.889664], [12.874752, 24.944832, 0.0]], "km of the example log")
assert ride_report([10, 25, 40])["dtype"] == np.dtype("int64"), "the dtype of a log of whole numbers, as in the example"
