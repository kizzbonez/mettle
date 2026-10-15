import numpy as np
import pandas as pd

heat = pd.CategoricalDtype(["mild", "medium", "hot", "fiery"], ordered=True)
clean = pd.DataFrame(
    {
        "order_id": ["G1", "G2", "G3", "G4", "G5", "G6"],
        "dish": ["phaal", "korma", "madras", "dal", "vindaloo", "jalfrezi"],
        "spice": pd.Categorical(["fiery", "mild", "hot", "medium", "fiery", "hot"], dtype=heat),
        "price": [13.5, 0.29, 4.35, np.nan, 19.99, 10.0],
        "qty": pd.array([1, 2, 1, 1, 1, 2], dtype="Int64"),
        "paid": [True, True, False, True, True, False],
    },
    index=[60, 50, 40, 30, 20, 10],
)
before = clean.copy()

assert at_least(clean, "medium").index.tolist() == [30, 40, 10, 60, 20], (
    "at_least sorts by heat (not alphabetically), keeps same-spice orders in their order and their labels"
)
assert at_least(clean, "fiery")["order_id"].tolist() == ["G1", "G5"], "at_least of the hottest level"
assert len(at_least(clean, "mild")) == 6, "at_least('mild') keeps every order"

rng = np.random.default_rng(8)
n = 20_000
many = pd.DataFrame(
    {
        "order_id": [f"H{i}" for i in range(n)],
        "spice": pd.Series(rng.choice(["mild", "medium", "hot", "fiery"], size=n)).astype(heat),
    }
)
codes = many["spice"].cat.codes.to_numpy()
kept = np.flatnonzero(codes >= 1)
expected = kept[np.argsort(codes[kept], kind="stable")]
check_array(
    at_least(many, "medium").index.to_numpy(),
    expected,
    "with many orders of the same spice, at_least still keeps them in their order",
)

check_frame(
    price_in_pence(clean),
    pd.Series(pd.array([1350, 29, 435, None, 1999, 1000], dtype="Int64"), index=[60, 50, 40, 30, 20, 10], name="price"),
    "price_in_pence rounds to the nearest penny (0.29, 4.35 and 19.99 are not exact in floating point), keeps gaps and the index",
)
check_frame(clean, before, "at_least and price_in_pence leave the frame unchanged")
