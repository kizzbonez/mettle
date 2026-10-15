import numpy as np
import pandas as pd

entries = pd.read_csv("data/entries.csv")

expected_places = pd.DataFrame(
    {
        "grower": ["Elspeth", "Cerys", "Hamish", "Kit", "Jory", "Dafydd", "Gwen", "Lowri", "Aldous", "Fergus", "Bryony", "Isla"],
        "vegetable": ["marrow"] * 4 + ["onion"] * 3 + ["pumpkin"] * 5,
        "kg": [52.0, 48.2, 48.2, 19.5, 5.0, 4.1, 3.8, 1850.0, 212.5, 212.5, 187.0, 96.0],
        "place": [1, 2, 2, 3, 1, 2, 3, 1, 2, 2, 3, 4],
    }
)
check_frame(places(entries), expected_places, "places of the example entries")

shares = band_shares(entries)
assert list(shares.columns) == ["small", "medium", "large", "giant"], "band_shares of the example entries: the band columns"
assert list(shares.index) == ["marrow", "onion", "pumpkin"] and shares.index.name == "vegetable", (
    "band_shares of the example entries: one row per vegetable"
)
check_array(
    shares.to_numpy(dtype=float),
    np.array([[0.0, 0.25, 0.75, 0.0], [0.667, 0.333, 0.0, 0.0], [0.0, 0.0, 0.2, 0.8]]),
    "band_shares of the example entries: the shares",
)

pumpkins = entries.loc[entries["vegetable"] == "pumpkin", "kg"]
check_frame(
    outlier_report(pumpkins),
    pd.DataFrame(
        {"z": [-0.4, -0.43, -0.4, -0.55, 1.79], "iqr_outlier": [False, False, False, True, True]},
        index=[0, 1, 5, 8, 11],
    ),
    "outlier_report of the example pumpkins",
)
