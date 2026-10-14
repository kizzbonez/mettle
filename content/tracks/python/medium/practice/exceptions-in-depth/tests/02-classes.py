assert issubclass(BookingError, Exception), "BookingError derives from Exception"
assert issubclass(BadSeatError, BookingError) and issubclass(BadSeatError, ValueError), (
    "BadSeatError is both a BookingError and a ValueError"
)
assert issubclass(SeatTakenError, BookingError), "SeatTakenError is a BookingError"
assert not issubclass(SeatTakenError, ValueError), "SeatTakenError is not a ValueError"

bad = BadSeatError(" 9z ")
assert bad.text == " 9z ", "BadSeatError keeps the text it was given, unchanged"
assert str(bad) == "not a seat: ' 9z '", "the message of BadSeatError shows the text by its repr"
assert bad.args == ("not a seat: ' 9z '",), "the message is the only item of args"
assert str(BadSeatError("it's")) == 'not a seat: "it\'s"', "the repr of the text picks its own quotes"

gone = SeatTakenError("12F")
assert gone.seat == "12F", "SeatTakenError keeps the seat it was given"
assert str(gone) == "seat 12F is taken", "the message of SeatTakenError"
assert gone.args == ("seat 12F is taken",), "the message is the only item of args"

try:
    raise BadSeatError("x")
except ValueError as error:
    assert isinstance(error, BookingError), "code that catches ValueError catches BadSeatError too"
