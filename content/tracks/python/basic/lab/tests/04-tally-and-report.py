# record keeps the largest count; report_lines builds the report.
tally = {}
record(tally, "altos", 2)
assert tally == {"altos": 2}, "record should add a section that is not in the tally yet"
record(tally, "altos", 5)
record(tally, "altos", 3)
assert tally == {"altos": 5}, "record should keep the largest count seen at one time, not add or replace"
record(tally, "tenors", 1)
assert tally == {"altos": 5, "tenors": 1}, "record should leave the other sections alone"

assert report_lines({}) == ["no singers counted"], "report_lines of an empty tally"

lines = report_lines({"tenors": 2, "basses": 5, "altos": 4})
assert type(lines) is list, "report_lines should return a list of strings"
assert lines == [
    "altos: 4",
    "basses: 5",
    "tenors: 2",
    "sections: 3, singers: 11",
    "largest section: basses (5)",
], "report_lines for three sections in no particular order"

assert report_lines({"sopranos": 1}) == [
    "sopranos: 1",
    "sections: 1, singers: 1",
    "largest section: sopranos (1)",
], "report_lines for a single section"

tie = report_lines({"tenors": 3, "sopranos": 5, "basses": 5, "altos": 2})
assert tie[-1] == "largest section: basses (5)", "report_lines when two sections share the largest count"
assert tie[-2] == "sections: 4, singers: 15", "the totals line when two sections share the largest count"
