import numpy as np

nan = np.nan
names = np.array(["Quizzly Bears", "Les Quizerables", "Know-It-Owls", "Table Six"])
scores = np.array([
    [19.0, 22.5, nan, 20.0],
    [21.0, 19.0, 24.0, 17.5],
    [15.5, nan, 20.0, 19.0],
    [21.0, 22.0, 18.5, nan],
])

totals = team_totals(scores)
assert isinstance(totals, np.ndarray) and totals.shape == (4,), "team_totals has one value per team"
check_array(totals, [61.5, 81.5, 54.5, 61.5], "team_totals of the example")

table = league_table(names, scores)
assert isinstance(table, np.ndarray) and table.shape == (4,), "league_table returns an array of the four names"
check_array(table, np.array(["Les Quizerables", "Quizzly Bears", "Table Six", "Know-It-Owls"]), "league_table of the example")

medians = week_medians(scores)
assert isinstance(medians, np.ndarray) and medians.shape == (4,), "week_medians has one value per week"
check_array(medians, [20.0, 22.0, 20.0, 19.0], "week_medians of the example")
