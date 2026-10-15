# validate_booking: probe inputs for card, room, day and hours are rejected; boundaries still accepted.
from datetime import date

good = {"card": "FB12345678", "room": "quiet-1", "day": "2026-12-14", "hours": "3", "name": "Ada Byrne"}

rejected = {
    "card": ["FB1234567", "FB123456789", "fb12345678", "FB 1234 5678", "FB12345678'--", "FB١٢٣٤٥٦٧٨",
             "FB12345678\nFB87654321", "' OR 1=1 --"],
    "room": ["studio; DROP TABLE rooms", "../studio", "board-room", ""],
    "day": ["20261214", "2026-12-4", "2026-W51-1", "2026-02-30", "2026-10-31", "2027-02-01", "2026-12-14T09:00",
            "2026-12-14' OR '1'='1"],
    "hours": ["0", "5", "4.5", "02", "+2", "2_0", "٢", "-1", ""],
}
for field, values in rejected.items():
    for value in values:
        try:
            validate_booking({**good, field: value})
        except ValueError:
            continue
        raise AssertionError(f"validate_booking should raise ValueError for the probe {field} = {value!r}")

accepted = [
    ("card", "\tFB00000000 ", "card", "FB00000000"),
    ("room", " MAKERSPACE", "room", "makerspace"),
    ("day", "2026-11-01", "day", date(2026, 11, 1)),
    ("day", "2027-01-31", "day", date(2027, 1, 31)),
    ("hours", "1", "hours", 1),
    ("hours", " 4 ", "hours", 4),
]
for field, value, key, expected in accepted:
    got = validate_booking({**good, field: value})
    assert got[key] == expected, f"validate_booking should accept {field} = {value!r} and return the cleaned value"
