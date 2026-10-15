"""Fixes for the box office code: injection, a TOCTOU race, and replayed requests."""
import os


def find_bookings(db, performance, surname):
    """Return [(ref, seat), ...] for SURNAME's bookings of PERFORMANCE, ordered by ref."""
    rows = db.execute(
        "SELECT ref, seat FROM bookings WHERE performance = ? AND surname = ? ORDER BY ref",
        (performance, surname),
    )
    return [tuple(row) for row in rows.fetchall()]


def read_upload(path):
    """Return the text of the uploaded seating plan at PATH, refusing a symbolic link."""
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)   # check and use in one step
    with os.fdopen(fd, encoding="utf-8") as f:
        return f.read()


def accept_request(request, seen, now, window=300):
    """Return True and remember the nonce if REQUEST is fresh and new; otherwise False."""
    if not isinstance(request, dict):
        return False
    nonce = request.get("nonce")
    timestamp = request.get("timestamp")
    if not isinstance(nonce, str) or not nonce or not isinstance(timestamp, int):
        return False
    if abs(now - timestamp) > window or nonce in seen:
        return False
    seen.add(nonce)
    return True
