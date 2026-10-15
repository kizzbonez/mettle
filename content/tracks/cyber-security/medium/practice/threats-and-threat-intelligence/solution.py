"""Triage the merged threat feed before it is loaded into the shared SIEM."""
import csv

LEVELS = ["low", "medium", "high"]

# The lesson's matrix: MATRIX[likelihood][impact].
MATRIX = {
    "high": {"low": "medium", "medium": "high", "high": "critical"},
    "medium": {"low": "low", "medium": "medium", "high": "high"},
    "low": {"low": "low", "medium": "low", "high": "medium"},
}
RISK_ORDER = ["critical", "high", "medium", "low"]
SHAREABLE = {"TLP:CLEAR", "TLP:GREEN", "TLP:AMBER"}


def risk(likelihood, impact):
    """Return the risk level for a likelihood and an impact rated low, medium or high."""
    likelihood = likelihood.strip().lower()
    impact = impact.strip().lower()
    if likelihood not in LEVELS or impact not in LEVELS:
        raise ValueError(f"ratings must be low, medium or high: {likelihood!r}, {impact!r}")
    return MATRIX[likelihood][impact]


def triage(path, today):
    """Return the valid, shareable indicators of the feed at PATH, merged and ranked."""
    with open(path, newline="") as f:
        lines = [line for line in f if line.strip() and not line.lstrip().startswith("#")]

    best = {}      # (type, value) -> the row kept
    sources = {}   # (type, value) -> set of sources
    for row in csv.DictReader(lines):
        row = {key: value.strip() for key, value in row.items()}
        if row["valid_until"] < today:
            continue
        if row["tlp"].upper() not in SHAREABLE:
            continue
        kind = row["type"].lower()
        key = (kind, row["value"].lower())
        confidence = row["confidence"].lower()
        sources.setdefault(key, set()).add(row["source"])
        kept = best.get(key)
        if kept is None or LEVELS.index(confidence) > LEVELS.index(kept["confidence"]):
            best[key] = {
                "type": kind,
                "value": key[1],
                "risk": risk(row["likelihood"], row["impact"]),
                "confidence": confidence,
            }

    result = []
    for key, item in best.items():
        item["sources"] = sorted(sources[key])
        result.append(item)
    result.sort(key=lambda item: (RISK_ORDER.index(item["risk"]),
                                  -LEVELS.index(item["confidence"]),
                                  item["type"], item["value"]))
    return result
