# fixtures: pairs with one leg or both, in itertools order, for any number of teams.
assert fixtures([]) == [] and fixtures([], both_legs=True) == [], "no teams give no fixtures"
assert fixtures(["Solo"]) == [] and fixtures(["Solo"], both_legs=True) == [], "one team gives no fixtures"
assert fixtures(["A", "B"]) == [("A", "B")], "two teams meet once with one leg"

teams = ["Owls", "Foxes", "Hares", "Bees"]
one_leg = fixtures(teams)
assert one_leg == [("Owls", "Foxes"), ("Owls", "Hares"), ("Owls", "Bees"),
                   ("Foxes", "Hares"), ("Foxes", "Bees"), ("Hares", "Bees")], "one leg follows the order combinations gives"
two_legs = fixtures(teams, both_legs=True)
assert len(two_legs) == 12, "four teams play twelve matches with both legs"
assert fixtures(["Owls", "Foxes", "Hares"], both_legs=True) == [
    ("Owls", "Foxes"), ("Owls", "Hares"), ("Foxes", "Owls"),
    ("Foxes", "Hares"), ("Hares", "Owls"), ("Hares", "Foxes"),
], "both legs follow the order permutations gives"
assert ("Bees", "Owls") in two_legs and ("Owls", "Bees") in two_legs, "with both legs each team is at home once against each other team"
assert all(home != away for home, away in two_legs), "a team never plays itself"
assert fixtures(teams, False) == one_leg, "both_legs can be given by position"

names = ("Zürich Zebras", "Ōsaka Owls", "Ægir")
assert fixtures(names) == [(names[0], names[1]), (names[0], names[2]), (names[1], names[2])], "teams given as a tuple with Unicode names work"
assert all(isinstance(match, tuple) for match in fixtures(names, both_legs=True)), "each fixture is a tuple"
