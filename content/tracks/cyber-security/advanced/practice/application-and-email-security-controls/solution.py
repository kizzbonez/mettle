"""Cookie check and booking-form validation for Fernbrook Public Library's room bookings."""
import re
from datetime import date

MAX_AGE = 28800                                       # eight hours
ROOMS = {"quiet-1", "quiet-2", "studio", "makerspace"}
FIRST_DAY = date(2026, 11, 1)
LAST_DAY = date(2027, 1, 31)


def cookie_findings(value):
    """Return the problems of one Set-Cookie value, in the order of the instructions."""
    parts = [part.strip() for part in value.split(";")]
    name = parts[0].split("=", 1)[0].strip()
    attributes = {}
    for part in parts[1:]:
        if part:
            key, _, val = part.partition("=")
            attributes[key.strip().lower()] = val.strip()

    findings = []
    if "secure" not in attributes:
        findings.append("no-secure")
    if "httponly" not in attributes:
        findings.append("no-httponly")
    if attributes.get("samesite", "").lower() not in ("lax", "strict"):
        findings.append("samesite")
    if not name.startswith("__Host-"):
        findings.append("no-host-prefix")
    elif "domain" in attributes or attributes.get("path") != "/":
        findings.append("bad-host-prefix")
    if "max-age" in attributes and int(attributes["max-age"]) > MAX_AGE:
        findings.append("long-lived")
    return findings


def validate_booking(form):
    """Return the clean booking, or raise ValueError if any field is wrong. Never repair."""
    field = {key: form.get(key, "").strip() for key in ("card", "room", "day", "hours", "name")}

    if not re.fullmatch(r"FB[0-9]{8}", field["card"]):
        raise ValueError("card must be FB and 8 digits")
    room = field["room"].lower()
    if room not in ROOMS:
        raise ValueError("unknown room")
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", field["day"]):
        raise ValueError("day must be YYYY-MM-DD")
    day = date.fromisoformat(field["day"])
    if not FIRST_DAY <= day <= LAST_DAY:
        raise ValueError("day outside the booking window")
    if not re.fullmatch(r"[1-4]", field["hours"]):
        raise ValueError("hours must be 1 to 4")
    name = field["name"]
    if not 1 <= len(name) <= 60 or not all(ch.isalpha() or ch in " -'" for ch in name):
        raise ValueError("name has characters that are not allowed")
    return {"card": field["card"], "room": room, "day": day, "hours": int(field["hours"]), "name": name}
