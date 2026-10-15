import pandas as pd

TEXT = {"visit_id": "str", "pet": "str", "species": "str", "date": "str", "weight_kg": "float64"}
visits = pd.read_csv("data/visits.csv", dtype=TEXT)
before = visits.copy()

reasons = find_reasons(visits)
check_frame(
    reasons,
    pd.Series(
        ["", "", "", "missing pet", "", "unknown species", "replaced", "bad date", "bad weight", "", "", "bad weight", ""],
        name="reason",
        dtype="str",
    ),
    "find_reasons gives each row of the example its first broken rule, or an empty string",
)

clean, quarantine = split_visits(visits)
check_frame(
    clean,
    pd.DataFrame({
        "visit_id": ["V2001", "V2002", "V2003", "V2005", "V2010", "V2007", "V2012"],
        "pet": ["Biscuit", "Mittens", "Thumper", "Rex", "Willow", "Luna", "Maple"],
        "species": ["dog", "cat", "rabbit", "dog", "rabbit", "cat", "dog"],
        "date": pd.to_datetime(
            ["2026-03-02", "2026-03-02", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-04", "2026-03-05"]
        ).astype("datetime64[us]"),
        "weight_kg": [14.2, 4.1, 1.9, 31.0, 2.3, 3.8, 9.7],
    }),
    "clean holds the example's good rows, cleaned, with parsed dates and the index 0 to n-1",
)
check_frame(
    quarantine,
    visits.iloc[[3, 5, 6, 7, 8, 11]]
    .reset_index(drop=True)
    .assign(reason=["missing pet", "unknown species", "replaced", "bad date", "bad weight", "bad weight"]),
    "quarantine holds the example's bad rows as they were read, with their reason",
)
check_frame(
    reason_counts(quarantine),
    pd.Series(
        [1, 2, 1, 1, 1],
        index=pd.Index(["bad date", "bad weight", "missing pet", "replaced", "unknown species"], name="reason"),
        name="count",
    ),
    "reason_counts counts the example's quarantine by reason, in alphabetical order",
)
check_frame(visits, before, "the functions do not change the frame they are given")
