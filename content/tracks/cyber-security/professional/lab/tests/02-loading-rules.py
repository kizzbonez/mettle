# load_findings and unknown_hosts on a small export: messy names, duplicates, informational rows, an empty file.
from pathlib import Path

import pandas as pd

FINDING_COLUMNS = ["finding_id", "host", "port", "cve", "cvss", "first_seen", "owner", "criticality", "exposure"]

Path("assets-small.csv").write_text(
    "host,ip,role,owner,criticality,exposure,asset_value_usd\n"
    "WEB-A,10.0.0.5,ticket web server,Web Team,high,internet,1000\n"
    " db-b ,10.0.0.6,ticket database,Data Team,critical,internal,2000\n",
    encoding="utf-8",
)
Path("scan-small.csv").write_text(
    "finding_id,host,ip,port,cve,cvss,title,first_seen\n"
    "S-07,web-a,10.0.0.5,443,CVE-2016-2183,7.5,SWEET32,2026-05-04\n"
    "S-02, WEB-A ,10.0.0.5,443,cve-2016-2183 ,7.5,SWEET32,2026-05-01\n"
    "S-05,web-a,10.0.0.5,22,CVE-2023-48795,5.9,Terrapin,2026-05-03\n"
    "S-04,web-a,10.0.0.5,22,CVE-2023-48795,5.9,Terrapin,2026-05-03\n"
    "S-09,web-a,10.0.0.5,8443,CVE-2016-2183,7.5,SWEET32,2026-05-06\n"
    "S-01,db-b,10.0.0.6,5432,,,Self-signed certificate,2026-05-01\n"
    "S-03,ghost-9,10.0.0.9,22,CVE-2023-48795,5.9,Terrapin,2026-05-02\n"
    "S-08,Printer-2,10.0.0.12,9100,,,Default SNMP community,2026-05-02\n",
    encoding="utf-8",
)

findings = load_findings("scan-small.csv", "assets-small.csv")
expected = pd.DataFrame({
    "finding_id": ["S-02", "S-04", "S-09"],
    "host": ["web-a", "web-a", "web-a"],
    "port": [443, 22, 8443],
    "cve": ["CVE-2016-2183", "CVE-2023-48795", "CVE-2016-2183"],
    "cvss": [7.5, 5.9, 7.5],
    "first_seen": pd.to_datetime(["2026-05-01", "2026-05-03", "2026-05-06"]),
    "owner": ["Web Team", "Web Team", "Web Team"],
    "criticality": ["high", "high", "high"],
    "exposure": ["internet", "internet", "internet"],
})
assert list(findings.columns) == FINDING_COLUMNS, f"load_findings keeps the columns of step 1, in order (got {list(findings.columns)})"
check_frame(
    findings,
    expected,
    "load_findings cleans host names and CVE ids in both files, keeps the earliest of each duplicate (the "
    "smallest finding_id on a tie), keeps different ports apart, drops rows without a CVE and hosts that are "
    "not inventoried, and sorts by finding_id",
    check_dtype=False,
)
assert pd.api.types.is_datetime64_any_dtype(findings["first_seen"]), "first_seen is a datetime64 column"

unknown = unknown_hosts("scan-small.csv", "assets-small.csv")
assert unknown == ["ghost-9", "printer-2"], (
    f"unknown_hosts lists every clean, uninventoried host once and sorted, including hosts with only informational rows (got {unknown})"
)

Path("scan-empty.csv").write_text("finding_id,host,ip,port,cve,cvss,title,first_seen\n", encoding="utf-8")
empty = load_findings("scan-empty.csv", "assets-small.csv")
assert isinstance(empty, pd.DataFrame) and len(empty) == 0, "a header-only scan gives an empty DataFrame"
assert list(empty.columns) == FINDING_COLUMNS, "the empty result still has the columns of step 1"
assert unknown_hosts("scan-empty.csv", "assets-small.csv") == [], "unknown_hosts returns [] for a header-only scan"

full = unknown_hosts("data/scan-2026-10-12.csv", "data/assets.csv")
assert full == ["nas-07"], "unknown_hosts on the October scan names each unknown host once"
