import pandas as pd

shows = pd.DataFrame(
    {
        "title": ["Late Lounge", "Clock Change Special", "Dawn Chorus", "Long Lunch", "Tea Time"],
        "start": pd.to_datetime(
            ["2026-10-24 23:30", "2026-03-29 01:30", "2026-03-29 04:00", "2026-07-01 12:00", "2026-01-10 16:15"]
        ),
        "end": pd.to_datetime(
            ["2026-10-25 02:30", "2026-03-29 03:00", "2026-03-29 06:30", "2026-07-01 12:00", "2026-01-10 17:00"]
        ),
    },
    index=[50, 40, 30, 20, 10],
)
before = shows.copy()
result = show_table(shows)
assert isinstance(result, pd.DataFrame), "show_table returns a DataFrame"
assert result.columns.tolist() == ["day", "minutes"], "show_table has the columns day and minutes"
expected = pd.DataFrame(
    {
        "day": ["Saturday", "Sunday", "Sunday", "Wednesday", "Saturday"],
        "minutes": [240.0, 60.0, 150.0, 0.0, 45.0],
    },
    index=shows.index,
)
check_frame(
    result,
    expected,
    "show_table gives the real minutes on London's clocks, across both clock changes, with the shows' index",
)
check_frame(shows, before, "show_table does not change the shows")
