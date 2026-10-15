# The example from the instructions.
from datetime import date

with open("data/staging-headers.txt") as handle:
    cookies = [line.split(": ", 1)[1].rstrip("\n") for line in handle if line.startswith("Set-Cookie: ")]

expected = [
    [],
    ["no-secure", "samesite", "no-host-prefix", "long-lived"],
    ["bad-host-prefix"],
    ["no-secure", "no-httponly", "samesite", "no-host-prefix"],
]
for cookie, want in zip(cookies, expected):
    got = cookie_findings(cookie)
    assert got == want, f"cookie_findings for the {cookie.split('=')[0]} cookie in data/staging-headers.txt, got {got!r}"

good = {"card": " FB00412977 ", "room": "Studio", "day": "2026-11-03", "hours": "2", "name": "Siobhán O'Neill"}
got = validate_booking(good)
assert got == {"card": "FB00412977", "room": "studio", "day": date(2026, 11, 3), "hours": 2, "name": "Siobhán O'Neill"}, (
    f"validate_booking for the good form in the example, got {got!r}"
)
for field, bad in [("card", "FB0041' OR '1'='1"), ("day", "2027-02-01"), ("hours", "4.5")]:
    try:
        validate_booking({**good, field: bad})
    except ValueError:
        continue
    raise AssertionError(f"validate_booking with {field} = {bad!r} should raise ValueError")
