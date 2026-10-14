# The Maple Close sheet from the instructions, read on its own.
count = BirdCount()
added = count.add_sheet("data/maple-close.txt")

assert added == 6, f"add_sheet returns the number of sightings it read from the sheet (got {added!r})"
assert count.problems == [
    "maple-close.txt line 9: bad count",
    "maple-close.txt line 10: bad time",
], f"problems lists each unreadable line as 'FILE line N: REASON', in file order (got {count.problems!r})"
assert len(count.sightings) == 6, "sightings holds one Sighting for each readable line"
assert repr(count.sightings[0]) == "Sighting('07:02', 'blackbird', 2)", (
    f"repr of the first sighting (got {count.sightings[0]!r})"
)
assert count.sightings[1].species == "blue tit", "species are stored in lower case"
assert count.sightings[4].species == "wood pigeon", "the words of a species are joined by single spaces"
assert count.sightings[5].count == 6, "count is stored as an int"

totals = count.totals()
assert totals == {
    "blackbird": 3,
    "blue tit": 4,
    "house sparrow": 6,
    "robin": 1,
    "wood pigeon": 3,
}, f"totals() adds up the birds of each species (got {totals!r})"
assert list(totals) == sorted(totals), "the keys of totals() are in alphabetical order"
assert count.total_birds == 17, f"total_birds counts every bird of every sighting (got {count.total_birds!r})"
