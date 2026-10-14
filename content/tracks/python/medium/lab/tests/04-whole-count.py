# Three sheets merged into one count, and the reports built from it.
count = BirdCount()
added = [count.add_sheet(name) for name in ["data/maple-close.txt", "data/station-road.txt", "data/allotments.txt"]]
assert added == [6, 6, 6], "add_sheet returns the number of sightings read from that one sheet"
assert count.problems == [
    "maple-close.txt line 9: bad count",
    "maple-close.txt line 10: bad time",
    "station-road.txt line 6: bad count",
    "station-road.txt line 9: too few fields",
    "allotments.txt line 6: bad time",
], "problems keeps the unreadable lines of every sheet, in the order the sheets were added"

totals = count.totals()
assert totals == {
    "blackbird": 5,
    "blue tit": 6,
    "goldfinch": 12,
    "house sparrow": 6,
    "jay": 1,
    "long-tailed tit": 7,
    "robin": 4,
    "starling": 15,
    "wood pigeon": 5,
}, "totals() merges the same species from different sheets, whatever its capitals and spacing"
assert list(totals) == sorted(totals), "the keys of totals() are in alphabetical order"
assert count.total_birds == 61, "total_birds counts the birds of every sheet"

assert count.top() == [("starling", 15), ("goldfinch", 12), ("long-tailed tit", 7)], (
    "top() returns the three most counted species by default, as (species, total) tuples"
)
assert count.top(5)[3:] == [("blue tit", 6), ("house sparrow", 6)], "species with the same total are ordered alphabetically"
assert count.top(1) == [("starling", 15)], "top(n) returns at most n species"
assert len(count.top(50)) == 9, "top(n) with n larger than the number of species returns them all"

assert count.seen_between("07:00", "07:15") == ["blackbird", "blue tit", "goldfinch", "robin", "starling", "wood pigeon"], (
    "seen_between lists each species seen in the window once, sorted"
)
assert count.seen_between("07:22", "07:26") == ["long-tailed tit", "wood pigeon"], (
    "seen_between includes sightings at exactly the start and at exactly the end"
)
assert count.seen_between("07:59", "08:00") == ["jay", "starling"], "seen_between works at the end of the morning"
assert count.seen_between("09:00", "10:00") == [], "seen_between is empty when nothing was seen in the window"
