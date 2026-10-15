# concurrent_sessions(): touching and open sessions, country case, pairs and ordering.
from pathlib import Path

Path("t4-sessions.csv").write_text(
    "session,user,start,end,country,device\n"
    "X-30,ana,2026-10-18T09:00:00Z,2026-10-18T10:00:00Z,IE,laptop\n"
    "X-12,ana,2026-10-18T09:30:00Z,,FR,unknown browser\n"
    "X-05,ana,2026-10-18T12:00:00Z,2026-10-18T12:30:00Z,ES,unknown browser\n"
    "X-40,ben,2026-10-18T08:00:00Z,,GB,laptop\n"
    "X-41,ben,2026-10-18T09:00:00Z,,US,phone\n"
    "X-50,cy,2026-10-18T08:00:00Z,2026-10-18T09:00:00Z,gb,laptop\n"
    "X-51,cy,2026-10-18T08:30:00Z,2026-10-18T08:45:00Z,GB,phone\n"
    "X-60,dee,2026-10-18T07:00:00Z,2026-10-18T08:00:00Z,GB,laptop\n"
    "X-61,dee,2026-10-18T08:00:00Z,2026-10-18T09:00:00Z,DE,laptop\n"
    "X-70,eve,2026-10-18T10:00:00Z,2026-10-18T11:00:00Z,GB,laptop\n"
    "X-71,eve,2026-10-18T11:30:00Z,,NG,phone\n"
    "X-80,fay,2026-10-18T10:00:00Z,2026-10-18T11:00:00Z,GB,laptop\n"
    "X-81,gus,2026-10-18T10:30:00Z,2026-10-18T11:30:00Z,BR,laptop\n"
)

expected = [
    ("ana", "X-05", "X-12"),
    ("ana", "X-12", "X-30"),
    ("ben", "X-40", "X-41"),
]
got = concurrent_sessions("t4-sessions.csv")
assert ("ana", "X-05", "X-12") in got, "a session that is still active overlaps every later session"
assert ("ana", "X-12", "X-30") in got, "the session IDs of a pair should be in sorted order"
assert ("ben", "X-40", "X-41") in got, "two active sessions overlap"
assert not any(row[0] == "cy" for row in got), "country codes should be compared ignoring case"
assert not any(row[0] == "dee" for row in got), "a session that ends exactly when the other starts does not overlap"
assert not any(row[0] == "eve" for row in got), "an active session that starts after the other ended does not overlap"
assert not any(row[0] in ("fay", "gus") for row in got), "only sessions of the same user are compared"
assert got == expected, "the pairs sorted by user, then session IDs"

Path("t4-none.csv").write_text("session,user,start,end,country,device\n")
assert concurrent_sessions("t4-none.csv") == [], "an export with only the header has no pairs"
