# load_sessions on both files: every column, type and missing value, in file order.
import pandas as pd

mar = load_sessions("data/sessions-mar.csv")
expected = pd.DataFrame(
    {
        "session_id": [f"S27{n:02d}" for n in range(1, 13)],
        "site": ["LEI", "HSP", "STN", "MKT", "LEI", "STN", "HSP", "MKT", "STN", "HSP", "STN", "LEI"],
        "connector": pd.Series(
            ["Type 2", "Type 2", "CCS", "CCS", "Type 2", "CCS", "Type 2", "Type 2", "Type 2", "CCS", "CCS", "Type 2"]
        ).astype("category"),
        "started": pd.to_datetime(
            [
                "2026-03-01 08:00", "2026-03-01 09:30", "2026-03-02 07:45", "2026-03-02 12:00",
                "2026-03-03 18:20", "2026-03-04 10:10", "2026-03-04 14:00", "2026-03-05 16:40",
                "2026-03-05 19:15", "2026-03-06 11:00", "2026-03-07 09:00", "2026-03-07 13:05",
            ]
        ),
        "kwh": [20.0, 18.0, 25.6, None, 29.0, 3.4, 21.0, None, 14.8, 0.4, 30.2, None],
        "minutes": pd.array([180, 170, 38, 4, 240, 6, 190, None, 130, 2, 44, None], dtype="Int64"),
        "status": ["ok", "ok", "ok", "fault", "ok", "aborted", "ok", "ok", "ok", "fault", "ok", "ok"],
    }
)
check_frame(mar, expected, "load_sessions reads the March file (same layout, other values) into the cleaned frame")

feb = load_sessions("data/sessions-feb.csv")
assert isinstance(feb.index, pd.RangeIndex) and feb.index[0] == 0, "the rows keep a RangeIndex from 0"
assert feb["session_id"].tolist() == [f"S26{n:02d}" for n in range(1, 65)], "rows stay in the order of the file"
assert feb["kwh"].isna().sum() == 6, "kwh is missing exactly where the file has '-' or nothing"
assert feb["minutes"].isna().sum() == 3, "minutes is missing exactly where the file has text instead of a number"
assert feb["site"].value_counts().to_dict() == {"STN": 20, "LEI": 16, "MKT": 16, "HSP": 12}, (
    "lower-case site codes are counted with their upper-case site"
)
assert list(feb["connector"].cat.categories) == ["CCS", "CHAdeMO", "Type 2"], (
    "connector is a categorical whose categories are the connector names in the file"
)
