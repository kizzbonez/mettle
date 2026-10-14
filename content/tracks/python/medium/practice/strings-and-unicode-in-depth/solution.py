"""Name Badges: tidy singers' names for the choir's badges and seating list."""

import unicodedata


def name_key(name):
    """A form of the name for comparing: NFC, casefolded, single spaces."""
    folded = unicodedata.normalize("NFC", name).casefold()
    return " ".join(folded.split())


def fit_bytes(text, limit):
    """The longest start of text whose UTF-8 encoding is at most limit bytes."""
    return text.encode("utf-8")[:limit].decode("utf-8", errors="ignore")


def code_points(text):
    """Each character as U+XXXX, separated by spaces."""
    return " ".join([f"U+{ord(char):04X}" for char in text])


def badge_line(seat, name, fee):
    """One line of the seating list: seat, name and fee in fixed columns."""
    return f"{seat:03d} {name:<20} {fee:>9,.2f}"
