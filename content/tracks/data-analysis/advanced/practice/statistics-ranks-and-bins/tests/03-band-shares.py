import numpy as np
import pandas as pd

entries = pd.DataFrame(
    {
        "vegetable": ["swede", "beet", "swede", "beet", "swede", "beet", "swede"],
        "kg": [5.0, 0.0, 20.0, 4.99, 19.99, 99.9, 7.5],
    },
    index=["e1", "e2", "e3", "e4", "e5", "e6", "e7"],
)
before = entries.copy()
shares = band_shares(entries)
assert isinstance(shares, pd.DataFrame), "band_shares returns a DataFrame"
assert list(shares.columns) == ["small", "medium", "large", "giant"], (
    "band_shares has a column for every band in order, even a band no entry falls in"
)
assert list(shares.index) == ["beet", "swede"] and shares.index.name == "vegetable", (
    "band_shares has one row per vegetable, sorted, with the index named vegetable"
)
check_array(
    shares.to_numpy(dtype=float),
    np.array([[0.667, 0.0, 0.333, 0.0], [0.0, 0.75, 0.25, 0.0]]),
    "band_shares puts each band's lower edge in the band, shares each vegetable's entries and rounds to 3",
)
check_frame(entries, before, "band_shares does not change the entries")

single = band_shares(pd.DataFrame({"vegetable": ["chilli"], "kg": [100.0]}))
check_array(single.to_numpy(dtype=float), np.array([[0.0, 0.0, 0.0, 1.0]]), "a single entry of exactly 100 kg is giant")
