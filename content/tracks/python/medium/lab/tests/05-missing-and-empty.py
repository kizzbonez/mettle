# An empty count, a sheet that does not exist, and a sheet with nothing readable on it.
from pathlib import Path

empty = BirdCount()
assert empty.sightings == [] and empty.problems == [], "a new BirdCount has no sightings and no problems"
assert empty.totals() == {}, "totals() of an empty count is an empty dict"
assert empty.top() == [], "top() of an empty count is an empty list"
assert empty.total_birds == 0, "total_birds of an empty count is 0"
assert empty.seen_between("00:00", "23:59") == [], "seen_between of an empty count is an empty list"

other = BirdCount()
assert other.sightings is not empty.sightings, "each BirdCount has its own list of sightings"

count = BirdCount()
count.add_sheet("data/maple-close.txt")
try:
    count.add_sheet("data/nowhere.txt")
except MissingSheetError as error:
    assert isinstance(error, SurveyError), "MissingSheetError is a subclass of SurveyError"
    assert error.path == "data/nowhere.txt", "MissingSheetError keeps the path it was given, as a str"
    assert str(error) == "no such sheet: data/nowhere.txt", "the message of MissingSheetError is 'no such sheet: PATH'"
    assert isinstance(error.__cause__, FileNotFoundError), (
        "MissingSheetError is chained from the FileNotFoundError with raise ... from"
    )
else:
    raise AssertionError("add_sheet raises MissingSheetError for a sheet that does not exist")
assert count.total_birds == 17 and len(count.problems) == 2, "a missing sheet changes nothing in the count"

Path("smudged.txt").write_text("07:00 robin\nseven robin 1\n\n# the rest was rained on\n", encoding="utf-8")
assert count.add_sheet(Path("smudged.txt")) == 0, "a sheet with no readable line adds 0 sightings (and accepts a Path)"
assert count.problems[2:] == ["smudged.txt line 1: too few fields", "smudged.txt line 2: bad time"], (
    "every unreadable line of the sheet is reported with the file name only, not the folder"
)
assert count.total_birds == 17, "unreadable lines add no birds"
