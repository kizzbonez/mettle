import ast

import numpy as np
import pandas as pd

with open("solution.py", encoding="utf-8") as file:
    tree = ast.parse(file.read())
loops = (ast.For, ast.While, ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)
assert not any(isinstance(node, loops) for node in ast.walk(tree)), "solution.py has no loops and no comprehensions"
slow = {"apply", "iterrows", "itertuples", "vectorize"}
assert not any(isinstance(node, ast.Attribute) and node.attr in slow for node in ast.walk(tree)), (
    "solution.py uses no apply, iterrows, itertuples or np.vectorize"
)

# A year of stays across the town: far too many for a Python function per row.
n = 1_000_000
rng = np.random.default_rng(2027)
codes = rng.integers(0, 4, n, dtype=np.int8)
minutes = rng.integers(1, 1500, n)
badge = rng.random(n) < 0.05
index = pd.RangeIndex(0, 2 * n, 2)
names = np.array(["station", "high street", "leisure centre", "bus garage"], dtype=object)
stays = pd.DataFrame(
    {"car_park": pd.Series(names[codes], index=index).astype("str"), "minutes": minutes, "blue_badge": badge},
    index=index,
)
assert str(stays["car_park"].dtype) == "str" and stays["car_park"].notna().all()

base = np.where(
    minutes <= 30,
    0.0,
    np.where(minutes <= 120, 2.0, np.where(minutes <= 240, 3.5, np.minimum(3.5 + -((240 - minutes) // 60), 10.0))),
)
expected = np.where(badge, 0.0, np.round(base * np.array([1.5, 1.0, 0.5, np.nan])[codes], 2))
del base

result = charges(stays)
assert isinstance(result, pd.Series) and len(result) == n, "charges returns one value per stay"
assert result.index.equals(stays.index), "charges keeps the stays' index"
check_array(result.to_numpy(), expected, "charges of 1,000,000 stays", equal_nan=True)
del result, expected

bands = stay_band(stays)
assert isinstance(bands, pd.Series) and len(bands) == n, "stay_band returns one value per stay"
expected_counts = {
    "quick": int((minutes <= 30).sum()),
    "short": int(((minutes > 30) & (minutes <= 120)).sum()),
    "half day": int(((minutes > 120) & (minutes <= 240)).sum()),
    "long": int((minutes > 240).sum()),
}
assert bands.value_counts().to_dict() == expected_counts, "stay_band of 1,000,000 stays"
labels = np.array(["quick", "short", "half day", "long"])
sample = labels[np.searchsorted([30, 120, 240], minutes[::997])]
assert (bands.iloc[::997].to_numpy() == sample).all(), "stay_band of 1,000,000 stays, row by row"
