# parse_line applies the rules for fields, times and counts, in that order.
sighting = parse_line("  08:15   Great  Spotted   WOODPECKER  2 ", 12)
assert (sighting.time, sighting.species, sighting.count) == ("08:15", "great spotted woodpecker", 2), (
    "parse_line splits on any run of whitespace, lower-cases the species and joins its words with single spaces"
)
assert isinstance(sighting, Sighting), "parse_line returns a Sighting"
assert parse_line("00:00 owl 1", 1).time == "00:00", "00:00 is a valid time"
assert parse_line("23:59 owl 1", 1).time == "23:59", "23:59 is a valid time"
assert parse_line("12:30 owl 007", 1).count == 7, "a count written with leading zeros is still a whole number"


def reason_for(text):
    try:
        parse_line(text, 4)
    except SheetLineError as error:
        assert isinstance(error, SurveyError), "SheetLineError is a subclass of SurveyError"
        assert error.line_number == 4, "SheetLineError keeps the line number it was given"
        assert error.text == text, "SheetLineError keeps the text it was given"
        assert str(error) == f"line 4: {error.reason}", "the message of SheetLineError is 'line N: REASON'"
        return error.reason
    return None


too_few = ["", "07:00", "07:00 robin", "robin 1"]
for text in too_few:
    assert reason_for(text) == "too few fields", "a line with fewer than three fields is 'too few fields'"

bad_times = ["24:00 robin 1", "7:40 robin 1", "07:60 robin 1", "07-30 robin 1", "ab:cd robin 1", "007:30 robin 1", "1:059 robin 1"]
for text in bad_times:
    assert reason_for(text) == "bad time", "a time that is not HH:MM from 00:00 to 23:59 is 'bad time'"

bad_counts = ["07:30 robin 0", "07:30 robin -1", "07:30 robin two", "07:30 robin 1.5", "07:30 robin +3"]
for text in bad_counts:
    assert reason_for(text) == "bad count", "a count that is not a whole number of at least 1 is 'bad count'"

assert reason_for("7:40 robin two") == "bad time", "the time is checked before the count"
assert reason_for("7:40 robin") == "too few fields", "the number of fields is checked before the time"
