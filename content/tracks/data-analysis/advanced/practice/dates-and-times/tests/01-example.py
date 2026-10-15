import pandas as pd

shows = pd.read_csv("data/shows.csv")
shows["start"] = parse_log(shows["start"])
shows["end"] = parse_log(shows["end"])

expected_start = pd.Series(
    pd.to_datetime(["2026-03-27 07:00", "2026-03-28 23:00", "2026-03-29 19:30", "2026-03-30 18:45"]),
    name="start",
).astype("datetime64[us]")
check_frame(shows["start"], expected_start, "parse_log of the example start column")

expected_table = pd.DataFrame(
    {
        "day": ["Friday", "Saturday", "Sunday", "Monday"],
        "minutes": [120.0, 180.0, 90.0, 90.0],
    }
)
check_frame(show_table(shows), expected_table, "show_table of the example shows")

new_york = pd.Series(
    pd.to_datetime(
        ["2026-03-27 03:00-04:00", "2026-03-28 19:00-04:00", "2026-03-29 14:30-04:00", "2026-03-30 13:45-04:00"]
    ).tz_convert("America/New_York"),
    name="start",
)
check_frame(listener_times(shows["start"], "America/New_York"), new_york, "listener_times of the example shows in New York")

slots = pd.DatetimeIndex(
    pd.to_datetime(["2026-03-21 20:00+00:00", "2026-03-28 20:00+00:00", "2026-04-04 20:00+01:00"], utc=True)
).tz_convert("Europe/London")
check_frame(
    weekly_slots(pd.Timestamp("2026-03-21 20:00", tz="Europe/London"), 3),
    slots,
    "weekly_slots(Timestamp('2026-03-21 20:00', tz='Europe/London'), 3)",
)
