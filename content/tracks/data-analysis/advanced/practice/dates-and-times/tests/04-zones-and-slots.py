import pandas as pd

starts = pd.Series(
    pd.to_datetime(["2026-03-14 18:00", "2026-03-29 01:30", "2026-04-04 22:00", "2026-04-05 22:00"]),
    index=["a", "b", "c", "d"],
    name="start",
)
before = starts.copy()


def moments(texts, zone):
    return pd.Series(pd.to_datetime(texts, utc=True).tz_convert(zone), index=starts.index, name="start")


check_frame(
    listener_times(starts, "America/New_York"),
    moments(["2026-03-14 18:00Z", "2026-03-29 01:00Z", "2026-04-04 21:00Z", "2026-04-05 21:00Z"], "America/New_York"),
    "listener_times in New York, between the two countries' clock changes and across London's",
)
check_frame(
    listener_times(starts, "Australia/Sydney"),
    moments(["2026-03-14 18:00Z", "2026-03-29 01:00Z", "2026-04-04 21:00Z", "2026-04-05 21:00Z"], "Australia/Sydney"),
    "listener_times in Sydney, where the clocks go back in April",
)
kolkata = listener_times(starts, "Asia/Kolkata")
assert str(kolkata.dtype) == "datetime64[us, Asia/Kolkata]", "listener_times returns times in the listener's zone"
assert kolkata.iloc[1] == pd.Timestamp("2026-03-29 06:30", tz="Asia/Kolkata"), (
    "a London time skipped by the clocks moves forward to the first time that exists"
)
check_frame(starts, before, "listener_times does not change its input")

autumn = weekly_slots(pd.Timestamp("2026-10-17 08:30", tz="Europe/London"), 4)
assert isinstance(autumn, pd.DatetimeIndex), "weekly_slots returns a DatetimeIndex"
check_frame(
    autumn,
    pd.DatetimeIndex(
        pd.to_datetime(
            ["2026-10-17 07:30Z", "2026-10-24 07:30Z", "2026-10-31 08:30Z", "2026-11-07 08:30Z"], utc=True
        )
    ).tz_convert("Europe/London"),
    "weekly_slots keeps the London clock time across the autumn clock change",
)
one = weekly_slots(pd.Timestamp("2026-06-03 11:00", tz="Europe/London"), 1)
assert len(one) == 1 and one[0] == pd.Timestamp("2026-06-03 11:00", tz="Europe/London"), "weekly_slots with count 1 is the first date alone"
