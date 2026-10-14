# running_points and streaks on empty, short, uniform and alternating results.
assert running_points("") == [], "no matches give an empty list of totals"
assert running_points("D") == [1], "a single draw gives [1]"
assert running_points("LLL") == [0, 0, 0], "losses add nothing but still get a total"
assert running_points("LWDDW") == [0, 3, 4, 5, 8], "each total adds the points of one more match"
assert isinstance(running_points("WW"), list), "running_points returns a list"
assert running_points("W" * 40)[-1] == 120, "the last total is the season's points"

assert streaks("") == [], "no matches give no streaks"
assert streaks("L") == [("L", 1)], "a single match is a streak of one"
assert streaks("WWWW") == [("W", 4)], "equal results in a row form a single streak"
assert streaks("WDWD") == [("W", 1), ("D", 1), ("W", 1), ("D", 1)], "alternating results give streaks of one"
assert streaks("DDLWWWLL") == [("D", 2), ("L", 1), ("W", 3), ("L", 2)], "a letter that comes back later starts a new streak"
runs = streaks("WWL")
assert all(isinstance(run, tuple) for run in runs), "each streak is a tuple"
assert sum(length for _, length in streaks("WDDLLLWWWW")) == 10, "the streak lengths add up to the number of matches"
