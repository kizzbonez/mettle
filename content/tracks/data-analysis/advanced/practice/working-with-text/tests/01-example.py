import numpy as np
import pandas as pd

packets = pd.read_csv("data/packets.csv")

expected_labels = pd.DataFrame(
    {
        "crop": ["TOM", "BEA", None, "CHI", "LET", None],
        "year": [2025.0, 2024.0, np.nan, 2025.0, 2025.0, np.nan],
        "number": ["014", "003", None, "101", "022", None],
    }
)
check_frame(split_labels(packets["label"]), expected_labels, "split_labels of the example packets")

expected_kind = pd.Series(
    pd.Categorical(
        ["heirloom", "open-pollinated", "hybrid", "open-pollinated", None, None],
        categories=["heirloom", "open-pollinated", "hybrid"],
    ),
    name="kind",
)
check_frame(seed_kind(packets["kind"]), expected_kind, "seed_kind of the example packets")

check_frame(
    mentions(packets["notes"], "organic"),
    pd.Series([False, False, False, False, True, True], name="notes"),
    "mentions(packets['notes'], 'organic')",
)
check_frame(
    mentions(packets["notes"], "10+"),
    pd.Series([False, False, False, True, False, False], name="notes"),
    "mentions(packets['notes'], '10+')",
)
