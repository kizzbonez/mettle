# prioritize: every priority boundary, SLA due dates, the overdue boundary, the sort order and an empty catalog.
import json
from pathlib import Path

import pandas as pd

COLUMNS = ["finding_id", "host", "port", "cve", "cvss", "first_seen", "owner", "criticality", "exposure"]


def entry(cve, ransomware):
    return {
        "cveID": cve, "vendorProject": "Vendor", "product": "Product", "vulnerabilityName": "Name",
        "dateAdded": "2024-01-01", "shortDescription": "", "requiredAction": "Apply updates.",
        "dueDate": "2024-01-22", "knownRansomwareCampaignUse": ransomware, "notes": "", "cwes": [],
    }


catalog = {
    "title": "CISA Catalog of Known Exploited Vulnerabilities", "catalogVersion": "2026.03.09",
    "dateReleased": "2026-03-09T18:00:00.000Z", "count": 3,
    "vulnerabilities": [
        entry("CVE-2021-44228", "Known"), entry("CVE-2023-44487", "Unknown"), entry("CVE-2022-22965", "Unknown"),
    ],
}
Path("kev-small.json").write_text(json.dumps(catalog), encoding="utf-8")
Path("kev-empty.json").write_text(json.dumps({**catalog, "count": 0, "vulnerabilities": []}), encoding="utf-8")

rows = [
    ("T-10", "h10", 443, "TEST-0010", 7.0, "2026-02-08", "Ops", "low", "internal"),
    ("T-01", "h01", 443, "CVE-2023-44487", 7.5, "2026-03-03", "Ops", "medium", "internet"),
    ("T-02", "h02", 443, "CVE-2021-44228", 10.0, "2026-03-02", "Ops", "low", "internal"),
    ("T-03", "h03", 8080, "CVE-2022-22965", 9.8, "2026-02-20", "Ops", "high", "partner"),
    ("T-04", "h04", 0, "TEST-0004", 9.0, "2026-03-01", "Ops", "low", "internal"),
    ("T-05", "h05", 443, "TEST-0005", 8.9, "2026-02-01", "Ops", "high", "internet"),
    ("T-06", "h06", 443, "TEST-0006", 7.0, "2026-02-08", "Ops", "low", "internal"),
    ("T-07", "h07", 22, "TEST-0007", 6.9, "2026-01-01", "Ops", "high", "internet"),
    ("T-08", "h08", 22, "TEST-0008", 4.0, "2026-03-09", "Ops", "critical", "internal"),
    ("T-09", "h09", 22, "TEST-0009", 3.9, "2025-12-01", "Ops", "critical", "internal"),
    ("T-11", "h11", 443, "TEST-0011", 7.2, "2026-03-05", "Ops", "high", "internet"),
]
findings = pd.DataFrame(rows, columns=COLUMNS)
findings["first_seen"] = pd.to_datetime(findings["first_seen"])
before = findings.copy()

ranked = prioritize(findings, "kev-small.json", "2026-03-10")
check_frame(findings, before, "prioritize leaves the findings it was given unchanged")

order = ["T-01", "T-02", "T-03", "T-04", "T-08", "T-05", "T-11", "T-06", "T-10", "T-09", "T-07"]
assert ranked["finding_id"].tolist() == order, (
    "rows are sorted by priority, then criticality (critical, high, medium, low), then cvss highest first, then finding_id"
)
expected = pd.DataFrame({
    "finding_id": order,
    "kev": [True, True, True, False, False, False, False, False, False, False, False],
    "ransomware": [False, True, False, False, False, False, False, False, False, False, False],
    "priority": ["P1", "P1", "P2", "P2", "P3", "P3", "P3", "P3", "P3", "P4", "P4"],
    "due": pd.to_datetime([
        "2026-03-10", "2026-03-09", "2026-03-06", "2026-03-15", "2026-04-08", "2026-03-03",
        "2026-04-04", "2026-03-10", "2026-03-10", "2026-03-01", "2026-04-01",
    ]),
    "days_open": [7, 8, 18, 9, 1, 37, 5, 30, 30, 99, 68],
    "overdue": [False, True, True, False, False, True, False, False, False, True, False],
})
check_frame(
    ranked[list(expected.columns)],
    expected,
    "kev, ransomware, priority (each rule and boundary: KEV on the internet or with ransomware, KEV elsewhere, "
    "CVSS 9.0, 7.0, critical with 4.0), due dates from the SLA days, days_open and overdue (due on as_of is not overdue)",
    check_dtype=False,
)
assert ranked.index.tolist() == list(range(len(order))), "the index is 0, 1, 2, ... after sorting"
assert str(ranked["days_open"].dtype).startswith("int"), "days_open is an integer column"
assert ranked["kev"].dtype == bool and ranked["overdue"].dtype == bool, "kev and overdue are bool columns"

no_kev = prioritize(findings, "kev-empty.json", "2026-03-10")
by_id = no_kev.set_index("finding_id")["priority"]
assert not no_kev["kev"].any(), "with an empty catalog no finding is in KEV"
assert by_id["T-02"] == "P2" and by_id["T-01"] == "P3", (
    "without KEV, the same findings fall back to the CVSS rules"
)
