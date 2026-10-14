# The league example from the instructions.
assert running_points("WWDLW") == [3, 6, 7, 7, 10], "running_points gives the total after each match"
assert streaks("WWDLLLW") == [("W", 2), ("D", 1), ("L", 3), ("W", 1)], "streaks gives each run of equal results with its length"
assert fixtures(["Owls", "Foxes", "Hares"]) == [("Owls", "Foxes"), ("Owls", "Hares"), ("Foxes", "Hares")], "with one leg every pair meets once"
assert fixtures(["Owls", "Foxes"], both_legs=True) == [("Owls", "Foxes"), ("Foxes", "Owls")], "with both legs every pair meets at each home"
assert ways_to_score(4) == 3, "there are three ways to score 4 points: WD, DW and DDDD"
