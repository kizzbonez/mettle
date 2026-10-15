"""Profile the council's incidents by threat actor type, from the attributes in the register."""
import csv
from collections import Counter


def _clean(incident, key):
    return (incident.get(key) or "").strip().lower()


def classify(incident):
    """Return the threat actor type for one incident (a dict of the register's columns)."""
    origin = _clean(incident, "origin")
    intent = _clean(incident, "intent")
    motivation = _clean(incident, "motivation")
    resources = _clean(incident, "resources")
    sophistication = _clean(incident, "sophistication")

    if origin == "internal":
        return "accidental insider" if intent == "none" else "insider"
    if motivation == "fear/chaos":
        return "terrorist"
    if resources == "very high" or motivation in {"espionage", "influence"}:
        return "state-sponsored"
    if motivation in {"political", "ideological"}:
        return "hacktivist"
    if motivation in {"financial", "extortion"}:
        return "crime syndicate"
    if motivation == "intellectual property":
        return "competitor"
    if sophistication == "low":
        return "unskilled attacker"
    return "unknown"


def is_apt(incident):
    """Return True when the incident shows an advanced persistent threat."""
    days = _clean(incident, "dwell_days")
    return (
        _clean(incident, "origin") == "external"
        and _clean(incident, "resources") in {"high", "very high"}
        and _clean(incident, "sophistication") in {"high", "very high"}
        and int(days or 0) >= 90
    )


def landscape(path):
    """Summarize the register at PATH: actors, internal and external counts, and APT incidents."""
    with open(path, newline="") as f:
        incidents = list(csv.DictReader(f))
    origins = Counter(_clean(row, "origin") for row in incidents)
    return {
        "actors": dict(Counter(classify(row) for row in incidents)),
        "internal": origins["internal"],
        "external": origins["external"],
        "apt": sorted(row["id"].strip() for row in incidents if is_apt(row)),
    }
