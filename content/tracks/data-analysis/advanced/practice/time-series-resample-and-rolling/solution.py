"""Meter Readings: a household's electricity use, day by day."""

import pandas as pd


def daily_use(readings):
    """Total kWh of every date from the first to the last, missing for a date without readings."""
    use = readings.set_index("time")["kwh"].sort_index()
    return use.resample("D").sum(min_count=1).round(2)


def compare_days(daily):
    """Every date with kwh, the change from the day before and that change as a fraction."""
    kwh = daily.asfreq("D")
    return pd.DataFrame(
        {
            "kwh": kwh,
            "change": kwh.diff().round(2),
            "pct": kwh.pct_change().round(3),
        }
    )


def smooth(daily):
    """kwh, the mean of the last 7 calendar days and the highest day so far."""
    return pd.DataFrame(
        {
            "kwh": daily,
            "week_avg": daily.rolling("7D").mean().round(2),
            "record": daily.expanding().max(),
        }
    )
