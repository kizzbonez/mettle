# The October report from the instructions: findings, unknown hosts, priorities, losses and the register.
import pandas as pd

FINDING_COLUMNS = ["finding_id", "host", "port", "cve", "cvss", "first_seen", "owner", "criticality", "exposure"]
ADDED = ["kev", "ransomware", "priority", "due", "days_open", "overdue"]

findings = load_findings("data/scan-2026-10-12.csv", "data/assets.csv")
assert isinstance(findings, pd.DataFrame), "load_findings returns a DataFrame"
assert list(findings.columns) == FINDING_COLUMNS, (
    f"load_findings has the columns named in step 1, in order (got {list(findings.columns)})"
)
assert len(findings) == 14, (
    f"load_findings keeps one row per distinct finding on an inventoried host (got {len(findings)} rows)"
)
assert findings["finding_id"].tolist()[:3] == ["F-1001", "F-1002", "F-1003"], (
    "the duplicate F-0998 gives way to F-1001, which was seen earlier, and rows are sorted by finding_id"
)

unknown = unknown_hosts("data/scan-2026-10-12.csv", "data/assets.csv")
assert unknown == ["nas-07"], f"unknown_hosts lists the scanned host missing from the inventory (got {unknown})"

ranked = prioritize(findings, "data/kev.json", "2026-10-16")
assert list(ranked.columns) == FINDING_COLUMNS + ADDED, (
    f"prioritize adds kev, ransomware, priority, due, days_open and overdue after the input columns (got {list(ranked.columns)})"
)
top = pd.DataFrame({
    "finding_id": ["F-1001", "F-1004", "F-1002", "F-1005", "F-1011"],
    "kev": [True, True, True, True, True],
    "ransomware": [True, True, False, True, True],
    "priority": ["P1", "P1", "P1", "P1", "P1"],
    "due": pd.to_datetime(["2026-10-05", "2026-10-16", "2026-09-21", "2026-10-08", "2026-10-17"]),
    "days_open": [18, 7, 32, 15, 6],
    "overdue": [True, False, True, True, False],
})
check_frame(
    ranked.head(5)[["finding_id"] + ADDED],
    top,
    "the first five prioritized findings match the example",
    check_dtype=False,
)

losses = annual_loss("data/risks.csv", "data/losses.csv", "data/assets.csv", "2026-10-16")
two = pd.DataFrame(
    {"sle": [288000.0, 7500.0], "events": [0, 4], "aro": [0.15, 0.8], "ale": [43200.0, 6000.0]},
    index=pd.Index(["R01", "R05"], name="risk_id"),
)
check_frame(
    losses.loc[["R01", "R05"], ["sle", "events", "aro", "ale"]],
    two,
    "SLE, events, ARO and ALE of R01 and R05 match the worked example",
    check_dtype=False,
    atol=0.01,
)

summary = register_summary(losses, ranked, 15000)
head = pd.DataFrame(
    {
        "ale": [43200.0, 18000.0, 16800.0, 15000.0],
        "open_findings": [3, 1, 3, 1],
        "p1_findings": [2, 0, 2, 1],
        "overdue_findings": [3, 0, 3, 0],
        "exceeds_appetite": [True, True, True, False],
        "action": ["escalate", "treat", "escalate", "treat"],
    },
    index=pd.Index(["R01", "R06", "R02", "R03"], name="risk_id"),
)
check_frame(
    summary.head(4)[list(head.columns)],
    head,
    "the first four rows of the register summary match the example",
    check_dtype=False,
    atol=0.01,
)
