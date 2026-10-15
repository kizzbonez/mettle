import numpy as np
import pandas as pd

rng = np.random.default_rng(77)
n = 60
pupils = pd.DataFrame({
    "name": [f"Pupil {number:02d}" for number in range(n)],
    "class": rng.choice(["5A", "5B", "5C"], n),
    "books": rng.integers(0, 25, n),
    "minutes": rng.integers(30, 2_000, n),
    "last_read": pd.Timestamp("2026-07-01 18:00") + pd.to_timedelta(rng.integers(0, 600, n), unit="h"),
}).astype({"last_read": "datetime64[us]"})
pupils.loc[[3, 4], "books"] = [10, 9]
before = pupils.copy()


def expected(seed, count):
    eligible = pupils[pupils["books"] >= 10]
    return eligible.sample(n=count, random_state=np.random.default_rng(seed))["name"].tolist()


first = prize_draw(pupils, 5, seed=11)
assert first == expected(11, 5), (
    "prize_draw draws among pupils with at least 10 books, using np.random.default_rng(seed) with sample"
)
np.random.seed(0)
np.random.random(3)
np.random.default_rng(5).random(3)
assert prize_draw(pupils, 5, seed=11) == first, (
    "prize_draw gives the same names on every call with the same seed, whatever was drawn in between"
)
assert prize_draw(pupils, 5, seed=12) == expected(12, 5), "another seed gives that seed's draw"
assert prize_draw(pupils, 5, seed=12) != first, "different seeds give different draws"

eligible = (pupils["books"] >= 10).sum()
everyone = prize_draw(pupils, int(eligible), seed=3)
assert everyone == expected(3, int(eligible)), "drawing every eligible pupil returns them all in the drawn order"
assert "Pupil 03" in everyone and "Pupil 04" not in everyone, "exactly 10 books is enough, 9 is not"
check_frame(pupils, before, "prize_draw does not change the pupils")
