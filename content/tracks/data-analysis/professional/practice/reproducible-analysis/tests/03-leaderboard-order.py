import numpy as np
import pandas as pd

rng = np.random.default_rng(31)
n = 40
pupils = pd.DataFrame({
    "name": [f"P{number:02d}" for number in rng.permutation(n)],
    "class": rng.choice(["3A", "3B"], n),
    "books": rng.integers(8, 12, n),
    "minutes": rng.choice([300, 360, 420], n),
    "last_read": pd.Timestamp("2026-07-10 17:30") + pd.to_timedelta(rng.integers(0, 300, n), unit="h"),
}).astype({"last_read": "datetime64[us]"})
before = pupils.copy()

ranked = pupils.sort_values(["books", "minutes", "name"], ascending=[False, False, True], ignore_index=True)
expected = pd.DataFrame({
    "rank": np.arange(1, n + 1, dtype="int64"),
    "name": ranked["name"],
    "class": ranked["class"],
    "books": ranked["books"],
    "hours": ranked["minutes"] / 60,
    "last_read": ranked["last_read"],
})

check_frame(
    leaderboard(pupils),
    expected,
    "leaderboard ranks 40 pupils with many ties by books, minutes and name, with the stated columns",
)
check_frame(pupils, before, "leaderboard does not change the pupils")
for seed in range(5):
    shuffled = pupils.sample(frac=1, random_state=np.random.default_rng(seed))
    check_frame(
        leaderboard(shuffled),
        expected,
        "leaderboard gives the same result whatever the order of the rows",
    )

one = pupils.head(1)
check_frame(leaderboard(one), expected[expected["name"] == one["name"].iloc[0]].assign(rank=1).reset_index(drop=True),
            "a single pupil is ranked 1")
