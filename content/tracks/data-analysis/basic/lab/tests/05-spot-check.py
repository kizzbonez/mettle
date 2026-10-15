# Spot-check days: reproducible, drawn only from days with readings, sorted, and refused when impossible.
import numpy as np

june = clean(load_energy("data/june.csv"), 12.0)
before = june.copy()
picked = spot_check_days(june, 5, 2026)
assert isinstance(picked, np.ndarray) and picked.dtype.kind in "iu", "spot_check_days returns an integer array"
june_candidates = np.array([day for day in range(30) if day != 8])
expected = np.sort(np.random.default_rng(2026).choice(june_candidates, size=5, replace=False))
check_array(picked, expected, "spot_check_days makes the single draw the instructions describe")
check_array(june, before, "spot_check_days does not change the array it is given")
check_array(spot_check_days(june, 5, 2026), picked, "the same seed picks the same days")
assert list(picked) == sorted(set(picked.tolist())), "the days are different and in ascending order"

other = spot_check_days(june, 5, 99)
check_array(other, np.sort(np.random.default_rng(99).choice(june_candidates, size=5, replace=False)),
            "spot_check_days uses the seed it is given")

every = spot_check_days(june, 29, 1)
assert 8 not in every.tolist() and len(every) == 29, "a day with no readings is never picked"

nan = np.nan
patchy = np.array([[nan, nan], [1.0, nan], [nan, nan], [2.0, 3.0], [0.0, 0.0]])
check_array(spot_check_days(patchy, 2, 5), np.sort(np.random.default_rng(5).choice(np.array([1, 3, 4]), size=2, replace=False)),
            "the candidates are the days with at least one reading, in ascending order")
nothing = spot_check_days(patchy, 0, 5)
assert np.shape(nothing) == (0,), "k = 0 picks no days"

try:
    spot_check_days(patchy, 4, 5)
except ValueError:
    pass
else:
    raise AssertionError("asking for more days than there are candidates raises ValueError")
