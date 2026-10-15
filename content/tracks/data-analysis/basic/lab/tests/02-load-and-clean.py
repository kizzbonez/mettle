# Loading June's and July's files, and the cleaning rules at their boundaries.
import numpy as np

raw = load_energy("data/june.csv")
assert isinstance(raw, np.ndarray) and raw.shape == (30, 6), "load_energy returns a (days, strings) array for June"
assert raw.dtype == np.float64, "load_energy returns a float64 array"
check_array(raw[0], [6.2, 6.5, 6.6, 6.4, 4.4, 6.5], "the first day of June, without the day number")
check_array(raw[:, 0][:3], [6.2, 8.5, 3.9], "column 0 holds string s1")
missing = np.argwhere(np.isnan(raw)).tolist()
assert missing == [
    [3, 1], [5, 3], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [12, 5], [19, 4], [21, 2], [26, 0],
], "empty fields, ERR and the day with no readings become NaN, and nothing else does"
assert raw[7, 0] == 98.6 and raw[14, 2] == -1.0, "load_energy keeps out-of-range numbers; clean removes them"

before = raw.copy()
cleaned = clean(raw, 12.0)
check_array(raw, before, "clean does not change the array it is given")
assert cleaned is not raw and cleaned.shape == raw.shape, "clean returns a new array of the same shape"
removed = np.argwhere(np.isnan(cleaned) & ~np.isnan(raw)).tolist()
assert removed == [[7, 0], [14, 2], [23, 5], [28, 3]], "clean removes exactly the negative and over-capacity readings in June"
check_array(cleaned[16], np.zeros(6), "a day of genuine zeros survives cleaning")
assert np.isnan(clean(raw, 10.0)).sum() == 31, "clean uses the capacity it is given"

edges = np.array([[12.0, 0.0, -0.1, 12.1, np.nan]])
check_array(clean(edges, 12.0), [[12.0, 0.0, np.nan, np.nan, np.nan]], "0 and exactly the capacity are kept")

july = load_energy("data/july.csv")
assert isinstance(july, np.ndarray) and july.shape == (31, 4), "load_energy reads a file with four strings"
check_array(july[30], [4.6, 4.7, 4.7, np.nan], "an empty last field becomes NaN")
assert np.isnan(july[10]).all() and np.isnan(july[11, 3]), "July's gaps and ERR become NaN"
