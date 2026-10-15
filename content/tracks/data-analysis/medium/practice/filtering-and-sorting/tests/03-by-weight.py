import numpy as np
import pandas as pd

small = pd.DataFrame(
    {
        "name": ["A", "B", "C", "D", "E", "F"],
        "species": ["cat", "dog", "cat", "rabbit", "dog", "cat"],
        "age_years": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        "weight_kg": [4.0, None, 4.0, 1.5, None, 4.0],
        "days_here": [1, 2, 3, 4, 5, 6],
        "vaccinated": [True] * 6,
        "reserved": [False] * 6,
    },
    index=[60, 50, 40, 30, 20, 10],
)
before = small.copy()
assert by_weight(small).index.tolist() == [50, 20, 30, 60, 40, 10], (
    "not weighed first, then lightest first, with ties in their table order and labels kept"
)
check_frame(small, before, "by_weight does not change the frame it is given")

rng = np.random.default_rng(2026)
n = 200_000
weights = rng.integers(1, 40, size=n).astype(float)
weights[rng.random(n) < 0.05] = np.nan
big = pd.DataFrame(
    {
        "name": [f"animal{i}" for i in range(n)],
        "species": rng.choice(["dog", "cat", "rabbit"], size=n),
        "age_years": rng.integers(0, 15, size=n).astype(float),
        "weight_kg": weights,
        "days_here": rng.integers(0, 365, size=n),
        "vaccinated": rng.random(n) < 0.9,
        "reserved": rng.random(n) < 0.1,
    }
)
expected_order = np.argsort(np.where(np.isnan(weights), -np.inf, weights), kind="stable")
result = by_weight(big)
assert len(result) == n, "by_weight keeps every animal"
check_array(
    result.index.to_numpy(),
    expected_order,
    "with many animals of equal weight, by_weight still keeps tied animals in their table order",
)
check_frame(result.loc[[0, 1, 2]], big.loc[[0, 1, 2]], "each row keeps its values")
