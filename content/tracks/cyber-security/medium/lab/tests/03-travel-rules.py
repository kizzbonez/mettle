# The travel rules on a file built for the test: order, failures, both thresholds, rounding.
import tempfile
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

PLACES = {
    "Paris": (48.8566, 2.3522), "Tokyo": (35.6762, 139.6503), "Madrid": (40.4168, -3.7038),
    "Sydney": (-33.8688, 151.2093), "Barcelona": (41.3874, 2.1686), "Berlin": (52.5200, 13.4050),
    "London": (51.5074, -0.1278), "Rome": (41.9028, 12.4964), "Southampton": (50.9097, -1.4044),
    "Lisbon": (38.7223, -9.1393),
}
ROWS = [  # time, user, result, city: deliberately not in time order
    ("2026-10-15T03:00:00Z", "alice", "success", "Tokyo"),
    ("2026-10-15T01:00:00Z", "alice", "success", "Paris"),
    ("2026-10-15T08:00:00Z", "bea", "success", "Madrid"),
    ("2026-10-15T09:00:00Z", "bea", "failure", "Sydney"),
    ("2026-10-15T10:00:00Z", "bea", "success", "Barcelona"),
    ("2026-10-15T10:30:00Z", "bea", "success", "Berlin"),
    ("2026-10-15T12:00:00Z", "carl", "success", "London"),
    ("2026-10-15T12:00:01Z", "carl", "success", "Rome"),
    ("2026-10-15T14:00:00Z", "dan", "success", "Southampton"),
    ("2026-10-15T14:01:00Z", "dan", "success", "London"),
    ("2026-10-15T16:00:00Z", "eve", "success", "Lisbon"),
    ("2026-10-15T16:30:00Z", "eve", "success", "Madrid"),
]
folder = Path(tempfile.mkdtemp())
text = "time,user,result,ip,city,country,lat,lon,app\n" + "".join(
    f"{t},{u},{r},192.0.2.1,{c},XX,{PLACES[c][0]},{PLACES[c][1]},Outlook\n" for t, u, r, c in ROWS
)
(folder / "signins.csv").write_text(text)


def km(a, b):
    (lat1, lon1), (lat2, lon2) = PLACES[a], PLACES[b]
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    h = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * 6371.0 * asin(sqrt(h))


def pair(user, a, ta, b, tb):
    hours = (datetime.fromisoformat(tb.replace("Z", "+00:00")) - datetime.fromisoformat(ta.replace("Z", "+00:00"))).total_seconds() / 3600
    return {"user": user, "from_city": a, "to_city": b, "from_time": ta, "to_time": tb,
            "km": round(km(a, b)), "hours": round(hours, 2)}


alice = pair("alice", "Paris", "2026-10-15T01:00:00Z", "Tokyo", "2026-10-15T03:00:00Z")
bea = pair("bea", "Barcelona", "2026-10-15T10:00:00Z", "Berlin", "2026-10-15T10:30:00Z")
carl = pair("carl", "London", "2026-10-15T12:00:00Z", "Rome", "2026-10-15T12:00:01Z")
dan = pair("dan", "Southampton", "2026-10-15T14:00:00Z", "London", "2026-10-15T14:01:00Z")
eve = pair("eve", "Lisbon", "2026-10-15T16:00:00Z", "Madrid", "2026-10-15T16:30:00Z")

got = impossible_travel(folder / "signins.csv")
assert isinstance(got, list), "impossible_travel returns a list"
users = [g.get("user") for g in got]
assert "dan" not in users, "a pair closer than min_km (500 km by default) is not flagged, however fast"
assert not any(g.get("to_city") == "Sydney" or g.get("from_city") == "Sydney" for g in got), (
    "failed sign-ins are ignored"
)
assert not any(g.get("from_city") == "Madrid" and g.get("user") == "bea" for g in got), (
    "a long but slow pair (under max_kmh) is not flagged"
)
assert alice in got, "each user's sign-ins are sorted by time before comparing, and the pair keeps from and to in time order"
assert carl in got, "two far-apart sign-ins a second apart are flagged, with hours rounded to 2 decimals"
assert got == [alice, bea, carl, eve], "with the defaults, the flagged pairs are exactly right, ordered by user then from_time"
assert isinstance(got[0]["km"], int), "km is a whole number (int)"

got = impossible_travel(folder / "signins.csv", max_kmh=1100, min_km=100)
assert got == [alice, bea, carl, dan], "max_kmh and min_km are taken from the parameters"

(folder / "header.csv").write_text("time,user,result,ip,city,country,lat,lon,app\n")
assert impossible_travel(folder / "header.csv") == [], "a file with only a header gives an empty list"
