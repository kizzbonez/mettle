"""Cookie check and booking-form validation for Fernbrook Public Library's room bookings."""
import re
from datetime import date

MAX_AGE = 28800                                       # eight hours
ROOMS = {"quiet-1", "quiet-2", "studio", "makerspace"}
FIRST_DAY = date(2026, 11, 1)
LAST_DAY = date(2027, 1, 31)


def cookie_findings(value):
    """Return the problems of one Set-Cookie value, in the order of the instructions."""
    # YOUR CODE: split on ";", read the name and the attributes (names ignoring case), then
    # no-secure, no-httponly, samesite, no-host-prefix or bad-host-prefix, long-lived.
    raise NotImplementedError


def validate_booking(form):
    """Return the clean booking, or raise ValueError if any field is wrong. Never repair."""
    # YOUR CODE: card, room, day, hours and name, each checked against an allow list.
    raise NotImplementedError
