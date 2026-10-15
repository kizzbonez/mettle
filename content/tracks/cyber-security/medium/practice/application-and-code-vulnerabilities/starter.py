"""Fixes for the box office code: injection, a TOCTOU race, and replayed requests."""
import os
from pathlib import Path


def find_bookings(db, performance, surname):
    """Return [(ref, seat), ...] for SURNAME's bookings of PERFORMANCE, ordered by ref."""
    # FIX ME: the values are pasted into the SQL text. Use ? placeholders and pass the
    # values as a tuple in the same db.execute call.
    sql = (f"SELECT ref, seat FROM bookings WHERE performance = '{performance}' "
           f"AND surname = '{surname}' ORDER BY ref")
    return [tuple(row) for row in db.execute(sql).fetchall()]


def read_upload(path):
    """Return the text of the uploaded seating plan at PATH, refusing a symbolic link."""
    # FIX ME: the file can be swapped for a link between the check and the read.
    # Open it with os.open(path, os.O_RDONLY | os.O_NOFOLLOW) and read from that descriptor.
    if Path(path).is_symlink():
        raise PermissionError("symbolic links are not allowed")
    return Path(path).read_text(encoding="utf-8")


def accept_request(request, seen, now, window=300):
    """Return True and remember the nonce if REQUEST is fresh and new; otherwise False."""
    # YOUR CODE: check the types, the timestamp window and the nonce; fail closed.
    raise NotImplementedError
