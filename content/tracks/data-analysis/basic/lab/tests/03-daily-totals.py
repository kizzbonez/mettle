# Daily totals for June, days with no readings, days of zeros, and an empty array.
import numpy as np

nan = np.nan
june = clean(load_energy("data/june.csv"), 12.0)
totals = daily_totals(june)
assert np.shape(totals) == (30,), "daily_totals returns one value per day of June"
check_array(totals, [
    36.6, 48.7, 23.0, 52.1, 53.6, 34.4, 41.1, 40.7, nan, 42.6,
    53.8, 51.1, 37.7, 44.3, 40.1, 38.8, 0.0, 53.4, 43.6, 25.9,
    39.3, 44.5, 43.6, 36.4, 53.6, 62.2, 29.8, 60.8, 25.6, 48.2,
], "June's daily totals, ignoring missing readings")
assert np.isnan(totals[8]), "the day the logger lost power is NaN, not 0"
assert totals[16] == 0.0, "the maintenance day, all zeros, totals 0.0"

grid = np.array([[1.234, 2.0, nan], [nan, nan, nan], [0.0, 0.0, 0.0], [nan, 5.556, nan]])
before = grid.copy()
check_array(daily_totals(grid), [3.23, nan, 0.0, 5.56], "totals are rounded to 2 places; only a day with no readings is NaN")
check_array(grid, before, "daily_totals does not change the array it is given")

empty = daily_totals(np.empty((0, 3)))
assert np.shape(empty) == (0,), "an energy array with no rows gives an empty array of totals"

july = clean(load_energy("data/july.csv"), 12.0)
check_array(daily_totals(july)[[0, 10, 18, 30]], [31.9, nan, 11.9, 14.0], "July's totals with its gaps and bad readings")
