import numpy as np
import pandas as pd

orders = pd.DataFrame(
    {
        "src": ["E", "w", "S", "", "W"],
        "order": ["R1", "R2", "R3", "R4", "R5"],
        "note": ["call first", None, "", "", "repeat"],
        "product": ["poster-a1", "flyr-a5", "card", "card", "poster-a1"],
        "copies": [2, 100, 50, 25, 4],
        "unit_price": [12.0, 0.15, 0.4, 0.4, 12.0],
        "rush": [False, False, True, False, False],
    }
)
before = orders.copy()

check_frame(
    tidy(orders),
    pd.DataFrame(
        {
            "channel": ["email", np.nan, "shop", np.nan, "web"],
            "order": ["R1", "R2", "R3", "R4", "R5"],
            "product": ["poster-a1", "flyr-a5", "card", "card", "poster-a1"],
            "copies": [2, 100, 50, 25, 4],
            "unit_price": [12.0, 0.15, 0.4, 0.4, 12.0],
            "rush": [False, False, True, False, False],
        }
    ),
    "tidy keeps channel where src was, spells out the three codes, makes any other code missing and drops note",
)
check_frame(orders, before, "tidy leaves orders unchanged")

fixed = correct_products(orders, {"flyr-a5": "flyer-a5", "postr-a2": "poster-a2"})
assert fixed["product"].tolist() == ["poster-a1", "flyer-a5", "card", "card", "poster-a1"], (
    "correct_products replaces the listed codes and keeps every other one"
)
check_frame(fixed.drop(columns=["product"]), before.drop(columns=["product"]), "correct_products changes only product")
same = correct_products(orders, {"banner": "banner-xl"})
assert same["product"].tolist() == orders["product"].tolist(), "a correction for a code that is not there changes nothing"
check_frame(orders, before, "correct_products leaves orders unchanged")
