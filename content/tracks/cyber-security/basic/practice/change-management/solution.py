"""Check requests for change against the water authority's change policy before the CAB meets.

Loading, the helpers and the report are written. Write the body of check_change (YOUR CODE).
"""
import json

WINDOW_START = "22:00"   # the maintenance window, every night, in UTC
WINDOW_END = "23:59"


def load_changes(path):
    """Return the list of change requests (dicts) in a JSON file."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def text(change, key):
    """Return a text field with the spaces around it removed; "" when it is missing or empty."""
    return str(change.get(key) or "").strip()


def window_times(window):
    """Return ("HH:MM", "HH:MM") from a window such as "2026-11-05 22:00-22:30", or None if malformed."""
    try:
        day, times = window.split(" ")
        start, end = times.split("-")
    except (AttributeError, ValueError):
        return None
    if len(start) != 5 or len(end) != 5:
        return None
    return start, end


def check_change(change):
    """Return the list of problem codes for one request, in the order of the instructions."""
    problems = []
    kind = text(change, "type").lower()

    if not text(change, "owner"):
        problems.append("NO-OWNER")

    if kind == "standard":
        approved = bool(text(change, "sop"))
    elif kind == "emergency":
        approved = True
    else:
        approved = text(change, "approval").lower() == "approved"
    if not approved:
        problems.append("NOT-APPROVED")

    if kind not in ("standard", "emergency") and not text(change, "test_results"):
        problems.append("UNTESTED")

    if not text(change, "backout_plan") and not text(change, "fail_forward_plan"):
        problems.append("NO-BACKOUT")

    if change.get("restart") is True and kind != "emergency":
        times = window_times(text(change, "window"))
        if times is None or not (WINDOW_START <= times[0] < times[1] <= WINDOW_END):
            problems.append("OUTSIDE-WINDOW")

    approved_files = change.get("scope") or []
    if any(name not in approved_files for name in change.get("files_changed") or []):
        problems.append("OUT-OF-SCOPE")

    return problems


def review(path):
    """Return one line per change: its id, then OK or its codes joined with commas."""
    lines = []
    for change in load_changes(path):
        problems = check_change(change)
        lines.append(f"{text(change, 'id')} {','.join(problems) or 'OK'}")
    return lines


if __name__ == "__main__":
    for line in review("data/changes.json"):
        print(line)
