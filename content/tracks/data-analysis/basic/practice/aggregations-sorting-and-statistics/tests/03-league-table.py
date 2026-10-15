import numpy as np

nan = np.nan
# Forty teams over three weeks, with totals from a short list so that many of them tie.
names = np.array([f"Team {number:02d}" for number in range(40)])
weekly = np.array([10.0, 12.5, 15.0, 7.5, 12.5])
scores = np.column_stack([np.resize(weekly, 40), np.resize(weekly[::-1], 40), np.full(40, 5.0)])
scores[[3, 17, 29], 1] = nan
before_names, before_scores = names.copy(), scores.copy()

table = league_table(names, scores)
assert isinstance(table, np.ndarray) and table.shape == (40,), "league_table returns every name once"
totals = np.nansum(scores, axis=1)
expected = np.array(sorted(names.tolist(), key=lambda name: -totals[int(name[-2:])]))
check_array(table, expected, "league_table orders by season total, highest first, ties in the order of names")
check_array(names, before_names, "league_table does not change names")
check_array(scores, before_scores, "league_table does not change scores")

pair = league_table(np.array(["Ash", "Birch"]), np.array([[10.0, nan], [4.0, 6.0]]))
check_array(pair, np.array(["Ash", "Birch"]), "two teams on the same total keep their order")
low_first = league_table(np.array(["Elm", "Oak", "Yew"]), np.array([[1.0, 1.0], [nan, nan], [9.5, 0.5]]))
check_array(low_first, np.array(["Yew", "Elm", "Oak"]), "a team that never played comes last, on 0")
check_array(league_table(np.array(["Solo"]), np.array([[3.0]])), np.array(["Solo"]), "a league of one team")
