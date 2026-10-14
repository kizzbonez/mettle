"""Seat Booking: book a basket of theatre seats, or report every problem at once."""


class BookingError(Exception):
    """Base class for every error this module raises."""


class BadSeatError(BookingError, ValueError):
    """Text that does not name a seat."""

    def __init__(self, text):
        super().__init__(f"not a seat: {text!r}")
        self.text = text


class SeatTakenError(BookingError):
    """A seat that is already sold."""

    def __init__(self, seat):
        super().__init__(f"seat {seat} is taken")
        self.seat = seat


def parse_seat(text):
    """'14c' -> '14C'; BadSeatError for anything that is not row 1-30 plus A-F."""
    cleaned = text.strip().upper()
    row_text, letter = cleaned[:-1], cleaned[-1:]
    try:
        row = int(row_text)
    except ValueError as error:
        raise BadSeatError(text) from error
    if not 1 <= row <= 30 or letter not in ("A", "B", "C", "D", "E", "F"):
        raise BadSeatError(text)
    return f"{row}{letter}"


def book(requests, taken):
    """Book every seat in requests, or raise ExceptionGroup('booking failed', errors)."""
    seats = []
    errors = []
    for number, text in enumerate(requests, start=1):
        try:
            seat = parse_seat(text)
            if seat in taken or seat in seats:
                raise SeatTakenError(seat)
            seats.append(seat)
        except BookingError as error:
            error.add_note(f"request {number}: {text!r}")
            errors.append(error)
    if errors:
        raise ExceptionGroup("booking failed", errors)
    taken.update(seats)
    return seats
