"""Ferry Line Vulnerability and Risk Report: prioritize scan findings and build the risk register summary.

Reference solution.
"""

import json

import numpy as np
import pandas as pd

FINDING_COLUMNS = ["finding_id", "host", "port", "cve", "cvss", "first_seen", "owner", "criticality", "exposure"]
CRITICALITY_ORDER = ["critical", "high", "medium", "low"]
SLA_DAYS = {"P1": 7, "P2": 14, "P3": 30, "P4": 90}


def _clean_host(hosts):
    return hosts.str.strip().str.lower()


def _read_assets(assets_path):
    assets = pd.read_csv(assets_path)
    assets["host"] = _clean_host(assets["host"])
    return assets


def load_findings(scan_path, assets_path):
    """One row per distinct (host, port, cve) on an inventoried host, joined to the inventory."""
    scan = pd.read_csv(scan_path, dtype={"finding_id": "str", "host": "str", "cve": "str"})
    scan["host"] = _clean_host(scan["host"])
    scan["cve"] = scan["cve"].str.strip().str.upper()
    scan = scan[scan["cve"].notna() & scan["cve"].ne("")].copy()
    scan["first_seen"] = pd.to_datetime(scan["first_seen"])
    scan = (
        scan.sort_values(["first_seen", "finding_id"])
        .drop_duplicates(["host", "port", "cve"], keep="first")
    )
    assets = _read_assets(assets_path)[["host", "owner", "criticality", "exposure"]]
    findings = scan.merge(assets, on="host", how="inner", validate="many_to_one")
    return findings[FINDING_COLUMNS].sort_values("finding_id").reset_index(drop=True)


def unknown_hosts(scan_path, assets_path):
    """Sorted host names that appear anywhere in the scan but not in the inventory."""
    scan_hosts = set(_clean_host(pd.read_csv(scan_path, dtype={"host": "str"})["host"]).dropna())
    known = set(_read_assets(assets_path)["host"])
    return sorted(scan_hosts - known)


def prioritize(findings, kev_path, as_of):
    """Add kev, ransomware, priority, due, days_open and overdue, sorted by the stated order."""
    with open(kev_path, encoding="utf-8") as handle:
        catalog = json.load(handle)["vulnerabilities"]
    in_kev = {entry["cveID"] for entry in catalog}
    ransomware = {entry["cveID"] for entry in catalog if entry["knownRansomwareCampaignUse"] == "Known"}

    df = findings.copy()
    df["kev"] = df["cve"].isin(in_kev)
    df["ransomware"] = df["cve"].isin(ransomware)
    p1 = df["kev"] & (df["exposure"].eq("internet") | df["ransomware"])
    p2 = df["kev"] | df["cvss"].ge(9.0)
    p3 = df["cvss"].ge(7.0) | (df["criticality"].eq("critical") & df["cvss"].ge(4.0))
    df["priority"] = pd.Series(np.select([p1, p2, p3], ["P1", "P2", "P3"], default="P4"), index=df.index, dtype="str")

    as_of = pd.Timestamp(as_of)
    df["due"] = df["first_seen"] + pd.to_timedelta(df["priority"].map(SLA_DAYS), unit="D")
    df["days_open"] = (as_of - df["first_seen"]).dt.days.astype("int64")
    df["overdue"] = df["due"].lt(as_of)

    rank = df["criticality"].map({name: i for i, name in enumerate(CRITICALITY_ORDER)})
    order = (
        df.assign(_rank=rank)
        .sort_values(["priority", "_rank", "cvss", "finding_id"], ascending=[True, True, False, True])
        .index
    )
    return df.loc[order].reset_index(drop=True)


def annual_loss(risks_path, losses_path, assets_path, as_of, years=5):
    """SLE, ARO and ALE for each stated risk, from the loss history in the years before as_of."""
    risks = pd.read_csv(risks_path)
    risks["host"] = _clean_host(risks["host"])
    assets = _read_assets(assets_path)[["host", "asset_value_usd"]]
    losses = pd.read_csv(losses_path, parse_dates=["date"])

    end = pd.Timestamp(as_of)
    start = end - pd.DateOffset(years=years)
    in_window = losses[losses["date"].ge(start) & losses["date"].lt(end)]
    events = in_window.groupby("risk_id").size()

    table = risks.merge(assets, on="host", how="left", validate="many_to_one")
    table = table.rename(columns={"asset_value_usd": "asset_value"})
    table["events"] = table["risk_id"].map(events).fillna(0).astype("int64")
    table["aro"] = np.where(table["events"].gt(0), table["events"] / years, table["industry_aro"])
    single = table["asset_value"] * table["exposure_factor"]
    table["sle"] = single.round(2)
    table["ale"] = (single * table["aro"]).round(2)
    columns = ["title", "owner", "host", "asset_value", "exposure_factor", "sle", "events", "aro", "ale"]
    return table.set_index("risk_id")[columns].sort_index()


def register_summary(losses_table, prioritized, appetite):
    """One row per risk: ALE, open findings on its host, appetite check and the action."""
    counts = (
        prioritized.assign(_p1=prioritized["priority"].eq("P1"))
        .groupby("host")
        .agg(open_findings=("finding_id", "size"), p1_findings=("_p1", "sum"), overdue_findings=("overdue", "sum"))
    )
    table = losses_table[["title", "owner", "host", "ale"]].join(counts, on="host")
    for column in ["open_findings", "p1_findings", "overdue_findings"]:
        table[column] = table[column].fillna(0).astype("int64")
    table["exceeds_appetite"] = table["ale"].gt(appetite)
    overdue = table["overdue_findings"].gt(0)
    urgent = table["p1_findings"].gt(0)
    table["action"] = pd.Series(
        np.select(
            [table["exceeds_appetite"] & overdue, table["exceeds_appetite"] | overdue | urgent],
            ["escalate", "treat"],
            default="monitor",
        ),
        index=table.index,
        dtype="str",
    )
    table = table.reset_index().sort_values(["ale", "risk_id"], ascending=[False, True])
    return table.set_index("risk_id")


if __name__ == "__main__":
    pd.set_option("display.width", 160)
    pd.set_option("display.max_columns", 20)
    findings = load_findings("data/scan-2026-10-12.csv", "data/assets.csv")
    print("unknown hosts:", unknown_hosts("data/scan-2026-10-12.csv", "data/assets.csv"))
    ranked = prioritize(findings, "data/kev.json", "2026-10-16")
    print(ranked[["finding_id", "host", "cve", "cvss", "priority", "due", "days_open", "overdue"]])
    losses = annual_loss("data/risks.csv", "data/losses.csv", "data/assets.csv", "2026-10-16")
    print(losses[["sle", "events", "aro", "ale"]])
    print(register_summary(losses, ranked, 15000).drop(columns=["title", "owner"]))
