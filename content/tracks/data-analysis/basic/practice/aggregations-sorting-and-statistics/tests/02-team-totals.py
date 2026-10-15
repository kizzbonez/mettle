import numpy as np

nan = np.nan
scores = np.array([
    [nan, nan, nan],
    [10.5, 0.0, 12.0],
    [nan, 25.0, nan],
    [0.0, 0.0, 0.0],
    [3.5, 4.5, 5.5],
])
before = scores.copy()
totals = team_totals(scores)
assert isinstance(totals, np.ndarray) and totals.shape == (5,), "team_totals has one value per team, not one per week"
assert totals.dtype.kind == "f", "team_totals returns floats"
check_array(totals, [0.0, 22.5, 25.0, 0.0, 13.5], "team_totals skips missed weeks, and a team that never played totals 0.0")
assert not np.isnan(totals).any(), "no total is NaN"
check_array(scores, before, "team_totals does not change scores")

single = team_totals(np.array([[7.5, nan, 8.0, 9.5]]))
check_array(single, [25.0], "team_totals for a league of one team")
week = team_totals(np.array([[12.0], [nan], [9.5]]))
check_array(week, [12.0, 0.0, 9.5], "team_totals after a single week")
