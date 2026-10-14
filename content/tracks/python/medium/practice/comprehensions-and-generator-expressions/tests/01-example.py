logs = {"Amara": [12, 0, 30], "Ben": [5, 5], "Chen": []}

assert totals(logs) == {"Amara": 42, "Ben": 10, "Chen": 0}, "totals for the example logs"
assert missed_a_day(logs) == {"Amara"}, "missed_a_day for the example logs"
assert entries(logs) == [("Amara", 1, 12), ("Amara", 3, 30), ("Ben", 1, 5), ("Ben", 2, 5)], "entries for the example logs"
assert busiest_day(logs) == 30, "busiest_day for the example logs"
