import numpy as np
import pandas as pd

screenings = pd.DataFrame(
    {
        "film": ["Zed", "Alma", "Kite", "Alma", "Zed", "Brook"],
        "screen": [1, 2, 1, 1, 2, 2],
        "day": ["Fri", "Fri", "Sat", "Sat", "Sun", "Sun"],
        "tickets": [10, 30, 40, 20, 30, 50],
        "takings": [100.0, 300.0, 400.0, 200.0, 300.0, 500.0],
        "rating": [np.nan, 4.0, 3.5, np.nan, 4.5, 5.0],
    }
)
before = screenings.copy()
check_frame(
    takings_by_film(screenings),
    pd.Series(
        [500.0, 500.0, 400.0, 400.0],
        index=pd.Index(["Alma", "Brook", "Kite", "Zed"], name="film"),
        name="takings",
    ),
    "takings_by_film adds up each film's screenings, highest first, equal takings A to Z",
)
check_frame(screenings, before, "takings_by_film leaves screenings unchanged")
check_frame(
    takings_by_film(screenings.iloc[[2]]),
    pd.Series([400.0], index=pd.Index(["Kite"], name="film"), name="takings"),
    "a single screening gives a single film",
)

rng = np.random.default_rng(11)
films = 20_000
n = 200_000
codes = rng.integers(0, films, size=n)
takings = rng.integers(0, 50, size=n).astype(float)
many = pd.DataFrame(
    {
        "film": [f"F{code:05d}" for code in codes],
        "screen": rng.integers(1, 3, size=n),
        "day": rng.choice(["Fri", "Sat", "Sun"], size=n),
        "tickets": rng.integers(0, 100, size=n),
        "takings": takings,
        "rating": np.full(n, np.nan),
    }
)
totals = np.bincount(codes, weights=takings, minlength=films)
present = np.flatnonzero(np.bincount(codes, minlength=films) > 0)
order = present[np.lexsort((present, -totals[present]))]
result = takings_by_film(many)
assert len(result) == len(present), "takings_by_film gives one entry per film, for many films"
assert result.index.tolist() == [f"F{code:05d}" for code in order], (
    "with many films of equal takings, they are still ordered highest first and then A to Z"
)
check_array(result.to_numpy(), totals[order], "takings_by_film sums the takings of every film")
