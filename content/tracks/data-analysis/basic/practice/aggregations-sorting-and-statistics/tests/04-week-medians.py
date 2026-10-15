import numpy as np

nan = np.nan
scores = np.array([
    [12.0, nan, 3.0, 20.0, 25.0],
    [8.0, 15.0, nan, 20.0, 0.0],
    [10.0, nan, nan, 1.0, 24.5],
    [30.0, nan, nan, 20.0, 25.0],
])
before = scores.copy()
medians = week_medians(scores)
assert isinstance(medians, np.ndarray) and medians.shape == (5,), "week_medians has one value per week, not one per team"
check_array(medians, [11.0, 15.0, 3.0, 20.0, 24.75], "week_medians uses only the teams that played, averaging the middle two of an even count")
assert not np.isnan(medians).any(), "no week's median is NaN when somebody played"
check_array(scores, before, "week_medians does not change scores")

check_array(week_medians(np.array([[4.0, 9.5, nan]]).T), [6.75], "the median of a single week")
check_array(week_medians(np.array([[18.0, 2.0, 7.0]])), [18.0, 2.0, 7.0], "with one team, each week's median is its score")
