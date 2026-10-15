"""Larkfield Dental investigation: find and classify the indicators in one day of logs."""

import csv
import re
from collections import Counter, defaultdict
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from urllib.parse import unquote_plus

SSH_LINE = re.compile(
    r"sshd\[\d+\]: (Failed|Accepted) \S+ for (?:invalid user )?(\S+) from (\S+) port \d+ ssh2"
)
ACCESS_LINE = re.compile(r'^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]*)" (\d{3}) ')
INJECTION_MARKERS = ("' or ", "union select", "sleep(", "<script", "${jndi:")


def km_between(lat1, lon1, lat2, lon2):
    """Great-circle distance in km (haversine formula, Earth radius 6371.0 km)."""
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * 6371.0 * asin(sqrt(a))


def ssh_attacks(path):
    """Classify SSH sources as brute-force or password-spraying."""
    failures = defaultdict(Counter)          # ip -> Counter of usernames
    accepted = defaultdict(set)              # ip -> usernames accepted
    for line in Path(path).read_text().splitlines():
        match = SSH_LINE.search(line)
        if not match:
            continue
        outcome, user, ip = match.groups()
        if outcome == "Failed":
            failures[ip][user] += 1
        else:
            accepted[ip].add(user)
    results = []
    for ip, per_user in failures.items():
        total, accounts, top = sum(per_user.values()), len(per_user), max(per_user.values())
        if top >= 10:
            kind = "brute-force"
        elif accounts >= 5 and top <= 3:
            kind = "password-spraying"
        else:
            continue
        results.append({"ip": ip, "kind": kind, "failures": total, "accounts": accounts,
                        "accepted": sorted(accepted[ip])})
    results.sort(key=lambda r: (-r["failures"], r["ip"]))
    return results


def impossible_travel(path, max_kmh=900, min_km=500):
    """Consecutive successful sign-ins of one user too far apart for the time between them."""
    by_user = defaultdict(list)
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            if row["result"] == "success":
                when = datetime.fromisoformat(row["time"].replace("Z", "+00:00"))
                by_user[row["user"]].append((when, row))
    flagged = []
    for user in sorted(by_user):
        signins = sorted(by_user[user], key=lambda item: item[0])
        for (t1, a), (t2, b) in zip(signins, signins[1:]):
            km = km_between(float(a["lat"]), float(a["lon"]), float(b["lat"]), float(b["lon"]))
            hours = (t2 - t1).total_seconds() / 3600
            if km >= min_km and km > max_kmh * hours:
                flagged.append({"user": user, "from_city": a["city"], "to_city": b["city"],
                                "from_time": a["time"], "to_time": b["time"],
                                "km": round(km), "hours": round(hours, 2)})
    return flagged


def web_probes(path):
    """Requests whose target, decoded twice, shows traversal or injection."""
    probes = []
    for line in Path(path).read_text().splitlines():
        match = ACCESS_LINE.match(line)
        if not match:
            continue
        ip, time, request, status = match.groups()
        parts = request.split(" ")
        if len(parts) != 3:
            continue
        target = parts[1]
        decoded = unquote_plus(unquote_plus(target)).lower()
        if "../" in decoded or "..\\" in decoded:
            kind = "traversal"
        elif any(marker in decoded for marker in INJECTION_MARKERS):
            kind = "injection"
        else:
            continue
        probes.append({"time": time, "ip": ip, "kind": kind, "status": int(status), "target": target})
    return probes


def _appears(value, text):
    """True if value occurs in text as a whole token (no letter, digit, dot or hyphen around it)."""
    pattern = r"(?<![A-Za-z0-9.-])" + re.escape(value) + r"(?![A-Za-z0-9.-])"
    return re.search(pattern, text, re.IGNORECASE) is not None


def ioc_matches(processes_path, iocs_path):
    """One result per process that matches the IoC list: by hash, else domain, else IPv4."""
    iocs = {"sha256": [], "domain": [], "ipv4": []}
    with open(iocs_path, newline="") as f:
        for row in csv.DictReader(f):
            if row["type"] in iocs:
                iocs[row["type"]].append(row["value"])
    results = []
    with open(processes_path, newline="") as f:
        for row in csv.DictReader(f):
            found = None
            for value in iocs["sha256"]:
                if row["sha256"].lower() == value.lower():
                    found = ("sha256", value)
                    break
            for kind in ("domain", "ipv4"):
                if found:
                    break
                for value in iocs[kind]:
                    if _appears(value, row["command_line"]):
                        found = (kind, value)
                        break
            if found:
                results.append({"host": row["host"], "time": row["time"], "image": row["image"],
                                "match": found[0], "indicator": found[1]})
    return results


def report(data_dir):
    """The investigation summary, one finding per line."""
    folder = Path(data_dir)
    lines = []
    for attack in ssh_attacks(folder / "auth.log"):
        line = f"SSH {attack['kind']}: {attack['ip']} ({attack['failures']} failures, {attack['accounts']} accounts)"
        if attack["accepted"]:
            line += "; accepted: " + ", ".join(attack["accepted"])
        lines.append(line)
    for trip in impossible_travel(folder / "signins.csv"):
        lines.append(f"Impossible travel: {trip['user']} {trip['from_city']} -> {trip['to_city']} "
                     f"({trip['km']} km in {trip['hours']:.2f} h)")
    probes = web_probes(folder / "access.log")
    kinds = Counter(p["kind"] for p in probes)
    lines.append(f"Web probes: {len(probes)} ({kinds['traversal']} traversal, {kinds['injection']} injection) "
                 f"from {len({p['ip'] for p in probes})} IPs, {sum(p['status'] == 200 for p in probes)} answered 200")
    for hit in ioc_matches(folder / "processes.csv", folder / "iocs.csv"):
        lines.append(f"IoC {hit['match']}: {hit['host']} {hit['image']} ({hit['indicator']})")
    return lines


if __name__ == "__main__":
    print("\n".join(report("data")))
