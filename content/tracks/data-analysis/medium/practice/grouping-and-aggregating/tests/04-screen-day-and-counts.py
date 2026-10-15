import numpy as np
import pandas as pd

screenings = pd.DataFrame(
    {
        "film": ["A", "B", "C", "D", "E", "F", "G"],
        "screen": [2, 1, 2, 1, 2, 3, 1],
        "day": ["Tue", "Mon", "Tue", "Mon", "Mon", "Wed", "Mon"],
        "tickets": [10, 3, 11, 4, 7, 50, 4],
        "takings": [90.0, 27.0, 99.0, 36.0, 63.0, 450.0, 36.0],
        "rating": [np.nan] * 7,
    }
)
before = screenings.copy()
check_frame(
    per_screen_day(screenings),
    pd.DataFrame(
        {
            "screen": [1, 2, 2, 3],
            "day": ["Mon", "Mon", "Tue", "Wed"],
            "avg_tickets": [3.7, 7.0, 10.5, 50.0],
        }
    ),
    "per_screen_day gives one row per screen and day used, sorted by screen then day, means rounded to 1 decimal",
)

counts = screenings_per_day(screenings)
assert list(counts.index) == ["Mon", "Tue", "Wed"] and counts.tolist() == [4, 2, 1], (
    "screenings_per_day counts the screenings of each day, most first"
)
tied = pd.DataFrame(
    {
        "film": ["A", "B", "C", "D", "E"],
        "screen": [1, 1, 1, 1, 1],
        "day": ["Sun", "Fri", "Fri", "Sat", "Sun"],
        "tickets": [1, 2, 3, 4, 5],
        "takings": [9.0, 18.0, 27.0, 36.0, 45.0],
        "rating": [np.nan] * 5,
    }
)
tied_counts = screenings_per_day(tied)
assert list(tied_counts.index) == ["Sun", "Fri", "Sat"] and tied_counts.tolist() == [2, 2, 1], (
    "days with equal counts keep the order in which they first appear"
)
check_frame(screenings, before, "per_screen_day and screenings_per_day leave screenings unchanged")
