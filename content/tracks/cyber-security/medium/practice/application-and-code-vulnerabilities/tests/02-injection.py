# find_bookings(): well-known SQL injection probes, values kept out of the SQL text, normal names.
import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE bookings (ref TEXT, performance TEXT, surname TEXT, seat TEXT)")
conn.executemany("INSERT INTO bookings VALUES (?, ?, ?, ?)", [
    ("LT-2001", "2026-12-19 19:00", "Nakamura", "D4"),
    ("LT-2003", "2026-12-19 19:00", "D'Souza", "D5"),
    ("LT-2002", "2026-12-19 19:00", "Nakamura", "D3"),
    ("LT-2004", "2026-12-20 15:00", "Nakamura", "B9"),
    ("LT-2005", "2026-12-19 19:00", "nakamura", "K1"),
])


class Recorder:
    """Stands in for the connection and remembers every execute call."""
    def __init__(self, conn):
        self.conn = conn
        self.calls = []

    def execute(self, sql, params=()):
        self.calls.append((sql, params))
        return self.conn.execute(sql, params)


probes = [
    "' OR '1'='1",
    "Nakamura' --",
    "x' UNION SELECT name, sql FROM sqlite_master --",
    "'; DROP TABLE bookings; --",
    "Nakamura' OR surname LIKE '%",
]
for probe in probes:
    db = Recorder(conn)
    try:
        got = find_bookings(db, "2026-12-19 19:00", probe)
    except sqlite3.Error as error:
        raise AssertionError(f"find_bookings raised {type(error).__name__} for the probe {probe!r}: it was read as SQL")
    assert got == [], f"the probe {probe!r} should match no booking"
    assert db.calls, "find_bookings should call db.execute"
    for sql, _ in db.calls:
        assert probe not in sql, f"the probe {probe!r} should be passed as a parameter, not pasted into the SQL text"

db = Recorder(conn)
assert find_bookings(db, "' OR '1'='1", "Nakamura") == [], "a probe in the performance argument should match nothing"
for sql, _ in db.calls:
    assert "' OR '1'='1" not in sql, "the performance should be passed as a parameter too"

assert conn.execute("SELECT count(*) FROM bookings").fetchone()[0] == 5, "the bookings table should be intact after the probes"

db = Recorder(conn)
assert find_bookings(db, "2026-12-19 19:00", "D'Souza") == [("LT-2003", "D5")], "a surname with an apostrophe should work"
for sql, _ in db.calls:
    assert "D'Souza" not in sql, "the surname should be passed as a parameter"
db = Recorder(conn)
assert find_bookings(db, "2026-12-19 19:00", "Nakamura") == [("LT-2001", "D4"), ("LT-2002", "D3")], (
    "the surname must match exactly (not nakamura) and only that performance, ordered by ref"
)
assert len(db.calls) == 1, "find_bookings should make one db.execute call"
sql, params = db.calls[0]
assert "Nakamura" not in sql and "2026-12-19" not in sql, (
    "no value should be in the SQL text, not even escaped by hand: use ? placeholders"
)
assert sorted(params) == ["2026-12-19 19:00", "Nakamura"], "the parameters should be the performance and the surname"
