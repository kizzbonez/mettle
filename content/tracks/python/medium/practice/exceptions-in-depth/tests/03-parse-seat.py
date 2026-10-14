assert parse_seat("1A") == "1A", "the first seat of the first row"
assert parse_seat("30F") == "30F", "the last seat of the last row"
assert parse_seat(" 07c\n") == "7C", "whitespace is stripped, the letter upper-cased and the row written without a leading zero"
assert parse_seat("12b") == "12B", "a lower-case letter is accepted"


def problem(text):
    try:
        parse_seat(text)
    except BadSeatError as error:
        assert error.text == text, "BadSeatError gets the text exactly as given to parse_seat"
        return error
    return None


for text in ["0A", "31A", "-1A", "12G", "12", "AA", "", "   ", "1 2A", "12AB"]:
    assert problem(text) is not None, "text that is not a row from 1 to 30 and a letter from A to F raises BadSeatError"

for text in ["XA", "AA", "", "C", "1.5B", "two A"]:
    error = problem(text)
    assert isinstance(error.__cause__, ValueError), "when int() fails on the row, BadSeatError is raised from that ValueError"

assert problem(" z9 ").text == " z9 ", "the text is kept with its spaces"
