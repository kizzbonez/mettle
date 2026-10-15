# register_summary: counts per host, the appetite boundary, every action rule, ties, risks with no findings, no findings at all.
import pandas as pd

risks = pd.DataFrame(
    {
        "title": ["Risk six", "Risk one", "Risk two", "Risk three", "Risk four", "Risk five"],
        "owner": ["O6", "O1", "O2", "O3", "O4", "O5"],
        "host": ["h1", "h1", "h2", "h3", "h4", "h5"],
        "asset_value": [100000, 100000, 80000, 50000, 10000, 10000],
        "exposure_factor": [0.3, 0.3, 0.25, 0.5, 0.5, 0.5],
        "sle": [30000.0, 30000.0, 20000.0, 25000.0, 5000.0, 5000.0],
        "events": [5, 5, 5, 5, 5, 5],
        "aro": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        "ale": [30000.0, 30000.0, 20000.0, 25000.0, 5000.0, 5000.0],
    },
    index=pd.Index(["Y6", "Y1", "Y2", "Y3", "Y4", "Y5"], name="risk_id"),
)
prioritized = pd.DataFrame({
    "finding_id": ["Q-1", "Q-2", "Q-3", "Q-4", "Q-5", "Q-6"],
    "host": ["h1", "h1", "h2", "h4", "h5", "h9"],
    "port": [443, 22, 443, 443, 22, 443],
    "cve": ["A", "B", "C", "D", "E", "F"],
    "cvss": [9.8, 7.5, 9.1, 7.5, 5.0, 9.8],
    "first_seen": pd.to_datetime(["2026-01-01"] * 6),
    "owner": ["x"] * 6,
    "criticality": ["high"] * 6,
    "exposure": ["internal"] * 6,
    "kev": [True, False, False, True, False, True],
    "ransomware": [True, False, False, False, False, True],
    "priority": ["P1", "P3", "P2", "P1", "P4", "P1"],
    "due": pd.to_datetime(["2026-01-08", "2026-01-31", "2026-01-15", "2026-01-08", "2026-04-01", "2026-01-08"]),
    "days_open": [30] * 6,
    "overdue": [True, False, True, False, False, True],
})

summary = register_summary(risks, prioritized, 20000)
columns = ["title", "owner", "host", "ale", "open_findings", "p1_findings", "overdue_findings", "exceeds_appetite", "action"]
assert list(summary.columns) == columns, f"register_summary has the columns of step 5, in order (got {list(summary.columns)})"
expected = pd.DataFrame(
    {
        "title": ["Risk one", "Risk six", "Risk three", "Risk two", "Risk four", "Risk five"],
        "owner": ["O1", "O6", "O3", "O2", "O4", "O5"],
        "host": ["h1", "h1", "h3", "h2", "h4", "h5"],
        "ale": [30000.0, 30000.0, 25000.0, 20000.0, 5000.0, 5000.0],
        "open_findings": [2, 2, 0, 1, 1, 1],
        "p1_findings": [1, 1, 0, 0, 1, 0],
        "overdue_findings": [1, 1, 0, 1, 0, 0],
        "exceeds_appetite": [True, True, True, False, False, False],
        "action": ["escalate", "escalate", "treat", "treat", "treat", "monitor"],
    },
    index=pd.Index(["Y1", "Y6", "Y3", "Y2", "Y4", "Y5"], name="risk_id"),
)
check_frame(
    summary,
    expected,
    "counts per host (two risks may share one; findings on other hosts are ignored), ALE equal to the appetite "
    "is within it, every action rule, and the sort by ALE then risk_id",
    check_dtype=False,
)
for column in ["open_findings", "p1_findings", "overdue_findings"]:
    assert str(summary[column].dtype).startswith("int"), f"{column} is an integer column"

none = register_summary(risks, prioritized.iloc[0:0], 20000)
assert none["open_findings"].tolist() == [0] * 6, "with no findings at all, every count is 0"
assert none["action"].tolist() == ["treat", "treat", "treat", "monitor", "monitor", "monitor"], (
    "with no findings, only risks above the appetite need treatment"
)
