# The five-day example from the instructions, and the shape of June's file.
import numpy as np

nan = np.nan
energy = np.array([
    [6.2, 6.5, 4.4],
    [nan, nan, nan],
    [8.5, -1.0, 6.1],
    [0.0, 0.0, 3.2],
    [9.4, 31.0, 5.1],
])

cleaned = clean(energy, 12.0)
assert isinstance(cleaned, np.ndarray) and cleaned.shape == (5, 3), "clean returns an array of the same shape"
check_array(cleaned, [
    [6.2, 6.5, 4.4],
    [nan, nan, nan],
    [8.5, nan, 6.1],
    [0.0, 0.0, 3.2],
    [9.4, nan, 5.1],
], "clean replaces readings below 0 or above capacity with NaN and keeps the rest")

totals = daily_totals(cleaned)
assert np.shape(totals) == (5,), "daily_totals returns one value per day"
check_array(totals, [17.1, nan, 14.6, 3.2, 14.5], "daily_totals adds each day's readings, NaN for a day with none")

relative = relative_output(cleaned)
assert np.shape(relative) == (5, 3), "relative_output keeps the shape of the energy array"
check_array(relative, [
    [1.0, 1.048, 0.71],
    [nan, nan, nan],
    [1.164, nan, 0.836],
    [nan, nan, nan],
    [1.297, nan, 0.703],
], "relative_output divides each reading by its day's median, rounded to 3 places")

check_array(underperformers(cleaned), [2], "underperformers with the default threshold of 0.8")
check_array(underperformers(cleaned, 0.7), np.array([], dtype=np.int64), "underperformers with a threshold of 0.7")
check_array(spot_check_days(cleaned, 2, 7), [3, 4], "spot_check_days(cleaned, 2, 7) from the example")

june = load_energy("data/june.csv")
assert isinstance(june, np.ndarray) and june.shape == (30, 6), (
    f"load_energy gives one row per day and one column per string, without the day column (got shape {np.shape(june)})"
)
