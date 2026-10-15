import numpy as np
import pandas as pd

rng = np.random.default_rng(31)
shelves = pd.DataFrame(
    {"shelf": [f"S{n:03d}" for n in range(200)], "books": rng.integers(0, 60, size=200)},
    index=range(1000, 1200),
)
before = shelves.copy()
picked = spot_check(shelves, 6, seed=12)
assert isinstance(picked, pd.DataFrame) and len(picked) == 6, "spot_check returns n rows"
check_frame(picked, shelves.sample(6, random_state=12), "spot_check picks its rows with sample and random_state=seed")
check_frame(spot_check(shelves, 6, seed=12), picked, "the same seed gives the same rows")
check_frame(picked, shelves.loc[picked.index], "the rows keep their index labels and values")
assert spot_check(shelves, 6, seed=13).index.tolist() != picked.index.tolist(), "another seed gives other rows"
check_frame(shelves, before, "spot_check does not change the frame")
assert sorted(spot_check(shelves.head(4), 4, seed=1).index) == [1000, 1001, 1002, 1003], (
    "asking for every row gives every row"
)

counts = pd.DataFrame(
    {
        "room": ["A", "B", "C", "D"],
        "chairs": [1, 2, 3, 4],
        "visitors": [10.0, np.nan, 30.0, 20.0],
    }
)
expected = pd.DataFrame(
    {
        "chairs": [4.0, 2.5, 1.29, 1.0, 1.75, 2.5, 3.25, 4.0],
        "visitors": [3.0, 20.0, 10.0, 10.0, 15.0, 20.0, 25.0, 30.0],
    },
    index=["count", "mean", "std", "min", "25%", "50%", "75%", "max"],
)
check_frame(numeric_summary(counts), expected, "numeric_summary gives describe's rows for the numeric columns, rounded to 2 decimals")
