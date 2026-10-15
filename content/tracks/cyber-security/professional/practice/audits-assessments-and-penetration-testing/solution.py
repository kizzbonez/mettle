"""Check a penetration tester's planned activities against the rules of engagement."""
import csv
import ipaddress
import json
from datetime import datetime


def as_network(text):
    """The network for an address or network, or None for a host name."""
    try:
        return ipaddress.ip_network(text.strip())
    except ValueError:
        return None


def in_scope(target, scope):
    """True when TARGET is inside the in-scope list and touches nothing out of scope."""
    net = as_network(target)
    if net is None:
        name = target.strip().lower()
        inside = {t.lower() for t in scope["in"] if as_network(t) is None}
        outside = {t.lower() for t in scope["out"] if as_network(t) is None}
        return name in inside and name not in outside
    ins = [as_network(t) for t in scope["in"] if as_network(t) is not None]
    outs = [as_network(t) for t in scope["out"] if as_network(t) is not None]
    return any(net.subnet_of(n) for n in ins) and not any(net.overlaps(n) for n in outs)


def review_plan(roe_path, plan_path):
    """Return "ID DECISION" for every planned activity, in plan order."""
    with open(roe_path) as f:
        roe = json.load(f)
    window = roe["window"]
    first_hour, last_hour = window["hours_utc"]
    results = []
    with open(plan_path, newline="") as f:
        for row in csv.DictReader(f):
            technique = row["technique"]
            when = datetime.fromisoformat(row["time"])
            day = when.date().isoformat()
            if technique in roe["forbidden"]:
                decision = "refused: forbidden technique"
            elif technique not in roe["passive"] and technique not in roe["active"]:
                decision = "refused: unknown technique"
            elif not in_scope(row["target"], roe["scope"]):
                decision = "refused: out of scope"
            elif technique in roe["active"] and (
                day < window["start"] or day > window["end"] or day in window["blackout"]
                or not first_hour <= when.hour < last_hour
            ):
                decision = "refused: outside window"
            else:
                decision = "approved"
            results.append(f"{row['id']} {decision}")
    return results
