# rank_bids: conflicts per bidder only, ties by name, blank lines and no conflicts at all.
scores = {
    "Alder": {"security": (4, 2, 4), "price": (3, 3, 3)},
    "Birch": {"security": (5, 3, 3), "price": (5, 4, 4)},
    "Cedar": {"security": (3, 4, 5), "price": (4, 4, 1)},
    "Aspen": {"security": (2, 2, 2), "price": (5, 5, 5)},
}
with open("t4-scores.csv", "w") as f:
    f.write("evaluator,bidder,criterion,score\n")
    for bidder, criteria in scores.items():
        for criterion, marks in criteria.items():
            for evaluator, mark in zip(("E1", "E2", "E3"), marks):
                f.write(f"{evaluator},{bidder},{criterion},{mark}\n")
        f.write("\n")
with open("t4-conflicts.csv", "w") as f:
    f.write("evaluator,bidder\nE1,Birch\nE3,Cedar\n")
with open("t4-no-conflicts.csv", "w") as f:
    f.write("evaluator,bidder\n")

weights = {"security": 0.6, "price": 0.4}
got = rank_bids("t4-scores.csv", "t4-conflicts.csv", weights)
assert got == [("Cedar", 3.7), ("Birch", 3.4), ("Alder", 3.2), ("Aspen", 3.2)], (
    "a conflicted evaluator's scores are dropped for that bidder only, and equal totals are sorted by name"
)

got = rank_bids("t4-scores.csv", "t4-no-conflicts.csv", weights)
assert got == [("Birch", 3.93), ("Cedar", 3.6), ("Alder", 3.2), ("Aspen", 3.2)], (
    "with no conflicts declared every score counts"
)
