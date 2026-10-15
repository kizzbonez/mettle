import numpy as np
import pandas as pd

screenings = pd.DataFrame(
    {
        "film": ["Owl", "Pier", "Owl", "Lumen", "Pier", "Owl", "Lumen"],
        "screen": [1, 1, 2, 2, 1, 1, 2],
        "day": ["Fri", "Fri", "Sat", "Sat", "Sun", "Sun", "Sun"],
        "tickets": [20, 35, 15, 60, 25, 25, 0],
        "takings": [180.0, 315.0, 135.0, 540.0, 225.0, 225.0, 0.0],
        "rating": [np.nan, 3.0, np.nan, 4.25, 4.0, np.nan, 4.5],
    },
    index=[7, 3, 9, 1, 5, 2, 8],
)
before = screenings.copy()
check_frame(
    film_report(screenings),
    pd.DataFrame(
        {
            "film": ["Lumen", "Owl", "Pier"],
            "screenings": [2, 3, 2],
            "tickets": [60, 60, 60],
            "avg_rating": [4.38, np.nan, 3.5],
            "rated": [2, 0, 2],
        }
    ),
    "film_report counts rows and ratings apart, gives NaN for a film nobody rated, and orders equal tickets A to Z",
)
check_frame(screenings, before, "film_report leaves screenings unchanged")

one = film_report(screenings.loc[[3]])
assert one["film"].tolist() == ["Pier"] and one["screenings"].tolist() == [1], "a single screening gives one row"

empty = film_report(screenings.iloc[0:0])
assert len(empty) == 0, "film_report of no screenings has no rows"
assert list(empty.columns) == ["film", "screenings", "tickets", "avg_rating", "rated"], "an empty report still has the five columns"

rng = np.random.default_rng(5)
films = 40_000
n = 200_000
codes = rng.integers(0, films, size=n)
tickets = rng.integers(0, 200, size=n)
rated = rng.random(n) < 0.7
many = pd.DataFrame(
    {
        "film": [f"M{code:05d}" for code in codes],
        "screen": rng.integers(1, 3, size=n),
        "day": rng.choice(["Fri", "Sat", "Sun"], size=n),
        "tickets": tickets,
        "takings": tickets * 9.0,
        "rating": np.where(rated, 4.0, np.nan),
    }
)
report = film_report(many)
per_film = np.bincount(codes, weights=tickets, minlength=films)
present = np.flatnonzero(np.bincount(codes, minlength=films) > 0)
order = present[np.lexsort((present, -per_film[present]))]
assert len(report) == len(present), "film_report gives one row per film, for tens of thousands of films"
assert report["film"].head(50).tolist() == [f"M{code:05d}" for code in order[:50]], (
    "with many films, the report is still sorted by tickets and then by film"
)
check_array(report["tickets"].to_numpy(), per_film[order], "film_report adds up every film's tickets")
assert report["screenings"].sum() == n and report["rated"].sum() == rated.sum(), (
    "screenings counts every row and rated counts every rating"
)
