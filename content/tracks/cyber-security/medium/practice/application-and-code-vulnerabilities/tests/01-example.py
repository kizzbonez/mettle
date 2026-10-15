# The example from the instructions.
import os
import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE bookings (ref TEXT, performance TEXT, surname TEXT, seat TEXT)")
db.executemany("INSERT INTO bookings VALUES (?, ?, ?, ?)", [
    ("LT-1002", "2026-10-24 19:30", "Okafor", "C12"),
    ("LT-1001", "2026-10-24 19:30", "Okafor", "C11"),
    ("LT-1007", "2026-10-24 19:30", "O'Brien", "F3"),
    ("LT-1010", "2026-10-25 14:00", "Okafor", "A1"),
])
assert find_bookings(db, "2026-10-24 19:30", "Okafor") == [("LT-1001", "C11"), ("LT-1002", "C12")], (
    "find_bookings for Okafor on 24 October should return two bookings ordered by ref"
)
try:
    got = find_bookings(db, "2026-10-24 19:30", "O'Brien")
except sqlite3.Error as error:
    raise AssertionError(f"find_bookings should handle a surname with an apostrophe, but raised {error!r}")
assert got == [("LT-1007", "F3")], "find_bookings for O'Brien should return his booking"
assert find_bookings(db, "2026-10-24 19:30", "' OR '1'='1") == [], (
    "the probe ' OR '1'='1 should be treated as a surname and match nothing"
)

Path("plan.txt").write_text("Stalls: rows A to M\n", encoding="utf-8")
if not Path("link.txt").is_symlink():
    os.symlink("plan.txt", "link.txt")
assert read_upload("plan.txt") == "Stalls: rows A to M\n", "read_upload should return the text of a regular file"
try:
    read_upload("link.txt")
except OSError:
    pass
else:
    raise AssertionError("read_upload('link.txt') should raise OSError for a symbolic link")

seen = set()
assert accept_request({"nonce": "a91f", "timestamp": 1792137600}, seen, now=1792137630) is True, "a fresh request with a new nonce should be accepted"
assert accept_request({"nonce": "a91f", "timestamp": 1792137600}, seen, now=1792137640) is False, "the same nonce again is a replay"
assert accept_request({"nonce": "b22c", "timestamp": 1792137000}, seen, now=1792137640) is False, "a request 640 seconds old is too old"
assert accept_request({"nonce": "c37d"}, seen, now=1792137640) is False, "a request without a timestamp should be refused"
assert seen == {"a91f"}, "only the accepted nonce should be added to seen"
