"""Name Badges: tidy singers' names for the choir's badges and seating list.

Every `raise NotImplementedError` marks code you still have to write. Keep the
function names and parameters: the tests call them.
"""

import unicodedata


def name_key(name):
    """A form of the name for comparing: NFC, casefolded, single spaces."""
    raise NotImplementedError


def fit_bytes(text, limit):
    """The longest start of text whose UTF-8 encoding is at most limit bytes."""
    raise NotImplementedError


def code_points(text):
    """Each character as U+XXXX (upper-case hex, at least 4 digits), separated by spaces."""
    raise NotImplementedError


def badge_line(seat, name, fee):
    """Seat as 3 digits, name left in 20, fee right in 9 with thousands commas and 2 decimals."""
    raise NotImplementedError
