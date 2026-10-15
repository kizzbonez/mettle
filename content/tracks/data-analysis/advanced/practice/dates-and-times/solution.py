"""Radio Schedule: the community station's show log, on every listener's clock."""

import pandas as pd

HOME = "Europe/London"


def parse_log(text):
    """Times written DD/MM/YYYY HH:MM as datetimes; anything else becomes NaT."""
    return pd.to_datetime(text, format="%d/%m/%Y %H:%M", errors="coerce")


def on_london_clock(times):
    """Naive London clock times made aware; a time skipped by the clocks moves forward."""
    return times.dt.tz_localize(HOME, nonexistent="shift_forward")


def show_table(shows):
    """The day name of each show's start and the real minutes from start to end."""
    start = on_london_clock(shows["start"])
    end = on_london_clock(shows["end"])
    return pd.DataFrame(
        {
            "day": start.dt.day_name(),
            "minutes": (end - start).dt.total_seconds() / 60,
        }
    )


def listener_times(starts, zone):
    """London clock times as the same moments on the clock of zone."""
    return on_london_clock(starts).dt.tz_convert(zone)


def weekly_slots(first, count):
    """count dates a week apart from first, at the same London clock time."""
    return pd.date_range(first, periods=count, freq="7D")
