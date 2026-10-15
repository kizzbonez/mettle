# validate_booking: the name allow list, missing fields and the exact result.
from datetime import date

good = {"card": "FB12345678", "room": "quiet-2", "day": "2026-12-14", "hours": "3", "name": "Ada Byrne"}

for name in ["<script>alert(1)</script>", "Robert'); DROP TABLE bookings;--", "R2D2", "Ada_Byrne", "   ",
             "x" * 61, "Ada​Byrne", "Ada\nByrne"]:
    try:
        validate_booking({**good, "name": name})
    except ValueError:
        continue
    raise AssertionError(f"validate_booking should raise ValueError for the name {name!r}")

for name in ["Zoë Ní Bhriain-Smith", "D'Arcy", "x" * 60, "  Mei Lin  ", "Ólafur"]:
    got = validate_booking({**good, "name": name})
    assert got["name"] == name.strip(), f"validate_booking should accept the name {name!r} (spaces around it removed)"

for missing in ["card", "room", "day", "hours", "name"]:
    form = {key: value for key, value in good.items() if key != missing}
    try:
        validate_booking(form)
    except ValueError:
        continue
    except Exception as error:
        raise AssertionError(f"a form without {missing} should raise ValueError, not {type(error).__name__}")
    raise AssertionError(f"a form without {missing} should raise ValueError")

got = validate_booking({"card": "FB55500011", "room": "Quiet-2", "day": "2027-01-05", "hours": "1", "name": "Tomás Ruiz"})
assert got == {"card": "FB55500011", "room": "quiet-2", "day": date(2027, 1, 5), "hours": 1, "name": "Tomás Ruiz"}, (
    "validate_booking returns exactly the five cleaned fields with a date and an int"
)
assert type(got["hours"]) is int and type(got["day"]) is date, "hours is an int and day a datetime.date"
