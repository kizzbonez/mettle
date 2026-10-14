taken = {"1A", "1B"}
assert parse_seat(" 14c ") == "14C", "parse_seat(' 14c '), as in the example"
try:
    parse_seat("40C")
except BadSeatError as error:
    assert str(error) == "not a seat: '40C'", "the message of BadSeatError for '40C', as in the example"
else:
    raise AssertionError("parse_seat('40C') raises BadSeatError, as in the example")

assert book(["3A", "3b"], taken) == ["3A", "3B"], "book(['3A', '3b'], taken), as in the example"
assert taken == {"1A", "1B", "3A", "3B"}, "a successful booking adds its seats to taken, as in the example"

seats_taken = notes = bad = None
try:
    book(["2C", "1A", "Z9", "2c"], taken)
except* SeatTakenError as group:
    seats_taken = [error.seat for error in group.exceptions]
    notes = [error.__notes__ for error in group.exceptions]
except* BadSeatError as group:
    bad = [str(error) for error in group.exceptions]
assert seats_taken == ["1A", "2C"], "the seats of the SeatTakenErrors in the example"
assert notes == [["request 2: '1A'"], ["request 4: '2c'"]], "the notes of the SeatTakenErrors in the example"
assert bad == ["not a seat: 'Z9'"], "the message of the BadSeatError in the example"
assert taken == {"1A", "1B", "3A", "3B"}, "a failed booking leaves taken unchanged, as in the example"
