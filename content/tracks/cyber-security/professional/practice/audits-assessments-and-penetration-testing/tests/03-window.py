# review_plan: the window's first and last days, hours from the file, blackout days and passive work.
import json

with open("t3-roe.json", "w") as f:
    json.dump({
        "scope": {"in": ["203.0.113.0/27", "portal.ashgrove.example"], "out": ["payments.ashgrove.example"]},
        "window": {"start": "2027-01-11", "end": "2027-01-15", "hours_utc": [9, 17], "blackout": ["2027-01-13"]},
        "passive": ["ct-log-search", "public-dns", "osint"],
        "active": ["host-discovery", "port-scan", "service-scan", "vuln-scan", "exploit"],
        "forbidden": ["denial-of-service", "phishing"],
    }, f)
rows = [
    ("W-01", "2027-01-11T08:59:59Z", "203.0.113.5", "port-scan"),
    ("W-02", "2027-01-11T09:00:00Z", "203.0.113.5", "port-scan"),
    ("W-03", "2027-01-12T16:59:59Z", "203.0.113.5", "service-scan"),
    ("W-04", "2027-01-12T17:00:00Z", "203.0.113.5", "service-scan"),
    ("W-05", "2027-01-13T10:00:00Z", "203.0.113.6", "vuln-scan"),
    ("W-06", "2027-01-15T12:00:00Z", "portal.ashgrove.example", "exploit"),
    ("W-07", "2027-01-10T12:00:00Z", "203.0.113.6", "host-discovery"),
    ("W-08", "2027-01-16T00:30:00Z", "203.0.113.6", "host-discovery"),
    ("W-09", "2027-01-13T03:00:00Z", "portal.ashgrove.example", "osint"),
    ("W-10", "2027-01-12T10:00:00Z", "payments.ashgrove.example", "public-dns"),
]
with open("t3-plan.csv", "w") as f:
    f.write("id,time,target,technique\n")
    for row in rows:
        f.write(",".join(row) + "\n")

got = review_plan("t3-roe.json", "t3-plan.csv")
assert got == [
    "W-01 refused: outside window",
    "W-02 approved",
    "W-03 approved",
    "W-04 refused: outside window",
    "W-05 refused: outside window",
    "W-06 approved",
    "W-07 refused: outside window",
    "W-08 refused: outside window",
    "W-09 approved",
    "W-10 refused: out of scope",
], "the window from the file: first and last days included, hours_utc [9, 17], a blackout day, passive work at any time but in scope"
