import numpy as np
import pandas as pd


def week(museums, visitors, days=None):
    count = len(museums)
    return pd.DataFrame({
        "day": pd.to_datetime(days or ["2026-09-21"] * count),
        "museum": pd.Series(museums, dtype="str"),
        "ticket": ["adult"] * count,
        "visitors": pd.Series(visitors, dtype="float64"),
    })


previous = week(["Art", "Zoo", "Science", "Maritime", "Art", "Zoo", "Science", "Maritime", "Art", "Zoo"], [100] * 10)
before = previous.copy()

assert batch_warnings(previous, previous) == [], "the same week again gives no warnings"
fifteen = week(["Art", "Zoo", "Science", "Maritime", "Art"] * 3, [100] * 15)
assert batch_warnings(previous, fifteen) == ["row count 10 -> 15 (+50%)"], "a rise in the row count is reported"
assert batch_warnings(previous, fifteen, max_change=0.5) == [], (
    "batch_warnings uses the max_change it is given, and a change of exactly max_change is not reported"
)
twelve = week(["Art", "Zoo", "Science", "Maritime"] * 3, [100] * 12)
assert batch_warnings(previous, twelve, max_change=0.1) == ["row count 10 -> 12 (+20%)"], (
    "batch_warnings uses the max_change it is given"
)
seven = week(["Art", "Zoo", "Science", "Maritime", "Art", "Zoo", "Science"], [100] * 7)
assert batch_warnings(previous, seven) == ["row count 10 -> 7 (-30%)"], "a fall in the row count is reported too"

gaps = week(
    ["Art", None, "Science", "Maritime", "Art", None, "Science", "Maritime", "Art", "Zoo"],
    [100, 100, np.nan, 100, 100, 100, 100, 100, 100, 100],
)
assert batch_warnings(previous, gaps) == [
    "museum: missing values up 20%",
    "visitors: missing values up 10%",
], "every column whose missing values rose is reported, in column order, and a missing museum is not a new value"
assert batch_warnings(previous, gaps, max_null_rise=0.15) == ["museum: missing values up 20%"], (
    "batch_warnings uses the max_null_rise it is given"
)
assert batch_warnings(gaps, previous) == [], "fewer missing values than last week is not reported"

changed = week(["Zoo", "Railway", "Science", "Maritime", "Aviation", "Zoo", "Science", "Maritime", "Zoo", "Railway"],
               [100] * 10)
assert batch_warnings(previous, changed) == [
    "museum: new value(s) Aviation, Railway",
    "museum: missing value(s) Art",
], "new and missing museums are each listed once, in alphabetical order, new ones first"
check_frame(previous, before, "batch_warnings does not change the frames it is given")
