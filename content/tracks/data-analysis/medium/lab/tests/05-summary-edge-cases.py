# site_summary on another month and on filtered and empty input: ties, faults, gaps, no sessions.
import pandas as pd

prices = load_prices("data/sites.json")
mar = add_cost(load_sessions("data/sessions-mar.csv"), prices)


def expected_frame(sites, sessions, energy, revenue, minutes, faults):
    return pd.DataFrame(
        {
            "site": sites,
            "sessions": sessions,
            "energy_kwh": energy,
            "revenue": revenue,
            "avg_minutes": pd.array(minutes, dtype="Float64"),
            "faults": faults,
        }
    )


check_frame(
    site_summary(mar),
    expected_frame(
        ["STN", "LEI", "HSP", "MKT"], [4, 3, 3, 2], [74.0, 49.0, 39.4, 0.0], [33.30, 19.11, 19.11, 0.0],
        [54.5, 210.0, 120.7, 4.0], [0, 0, 1, 1],
    ),
    "site_summary of March: equal revenue is ordered by energy, and gaps and faults are counted as stated",
)

feb = add_cost(load_sessions("data/sessions-feb.csv"), prices)
week = completed_in_period(feb, "2026-02-10 00:00", "2026-02-16 23:59")
check_frame(
    site_summary(week),
    expected_frame(
        ["MKT", "STN", "LEI", "HSP"], [5, 3, 4, 1], [90.4, 67.6, 40.7, 11.0], [47.00, 30.42, 15.89, 5.37],
        [72.8, 81.7, 141.8, 99.0], [0, 0, 0, 0],
    ),
    "site_summary of the completed sessions of one February week",
)

tied = pd.DataFrame(
    {
        "session_id": ["T1", "T2", "T3"],
        "site": ["STN", "HSP", "LEI"],
        "connector": pd.Series(["CCS", "CCS", "Type 2"]).astype("category"),
        "started": pd.to_datetime(["2026-03-09 08:00", "2026-03-09 09:00", "2026-03-09 10:00"]),
        "kwh": [10.0, 10.0, 10.0],
        "minutes": pd.array([30, 60, 90], dtype="Int64"),
        "status": ["ok", "ok", "ok"],
        "cost": [5.0, 5.0, 5.0],
    }
)
assert site_summary(tied)["site"].tolist() == ["HSP", "LEI", "STN"], (
    "sites with equal revenue and equal energy are ordered by site code, A to Z"
)

summary = site_summary(mar)
assert "PKR" not in summary["site"].tolist(), "a site without sessions does not appear"
assert isinstance(summary.index, pd.RangeIndex) and summary.index.tolist() == [0, 1, 2, 3], (
    "the summary is numbered from 0 in its sorted order"
)

empty = site_summary(completed_in_period(mar, "2026-04-01 00:00", "2026-04-30 23:59"))
assert len(empty) == 0, "the summary of no sessions has no rows"
assert list(empty.columns) == ["site", "sessions", "energy_kwh", "revenue", "avg_minutes", "faults"], (
    "the summary of no sessions still has the six columns"
)
