import pandas as pd

text = pd.Series(
    [
        "2026-03-28 09:15",
        "31/02/2026 10:00",
        "29/02/2026 08:00",
        "29/02/2028 08:00",
        "03/28/2026 09:15",
        "04/05/2026 10:00",
        "28/03/2026 09:15:30",
        "not logged",
        None,
        "",
        "4/5/2026 9:05",
        "31/12/2025 23:59",
    ],
    index=[f"s{n}" for n in range(12)],
    name="logged",
)
before = text.copy()
result = parse_log(text)
assert isinstance(result, pd.Series), "parse_log returns a Series"
expected = pd.Series(
    pd.to_datetime(
        [
            None,
            None,
            None,
            "2028-02-29 08:00",
            None,
            "2026-05-04 10:00",
            None,
            None,
            None,
            None,
            "2026-05-04 09:05",
            "2025-12-31 23:59",
        ]
    ),
    index=text.index,
    name="logged",
).astype("datetime64[us]")
check_frame(
    result,
    expected,
    "parse_log reads day first, keeps the index and name, and turns impossible dates and other layouts into NaT",
)
check_frame(text, before, "parse_log does not change its input")

assert parse_log(pd.Series(["01/01/2026 00:00"])).iloc[0] == pd.Timestamp("2026-01-01"), "parse_log of a single midnight"
