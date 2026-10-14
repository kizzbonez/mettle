"""Seat Booking: book a basket of theatre seats, or report every problem at once.

Every `raise NotImplementedError` marks code you still have to write. Keep the
names and parameters: the tests use them.
"""


class BookingError(Exception):
    """Base class for every error this module raises."""


# YOUR CODE: BadSeatError(BookingError, ValueError) with the attribute text,
# message "not a seat: 'TEXT'".


# YOUR CODE: SeatTakenError(BookingError) with the attribute seat,
# message "seat SEAT is taken".


def parse_seat(text):
    """'14c' -> '14C'; BadSeatError for anything that is not row 1-30 plus A-F."""
    raise NotImplementedError


def book(requests, taken):
    """Book every seat in requests, or raise ExceptionGroup('booking failed', errors)."""
    raise NotImplementedError
