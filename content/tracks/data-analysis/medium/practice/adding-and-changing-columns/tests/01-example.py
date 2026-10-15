import numpy as np
import pandas as pd

orders = pd.DataFrame(
    {
        "order": ["P101", "P102", "P103", "P104", "P105"],
        "product": ["flyer-a5", "poster-a2", "card", "flyer-a5", "postr-a2"],
        "copies": [500, 20, 250, 1000, 5],
        "unit_price": [0.12, 4.50, 0.30, 0.10, 4.50],
        "src": ["W", "S", "E", "W", "X"],
        "rush": [False, True, False, True, False],
        "note": ["", "matt", None, "two boxes", ""],
    }
)
before = orders.copy()

totals = add_totals(orders)
assert list(totals.columns) == list(orders.columns) + ["subtotal", "rush_fee", "total"], "add_totals adds subtotal, rush_fee and total at the end"
check_frame(
    totals[["subtotal", "rush_fee", "total"]],
    pd.DataFrame(
        {
            "subtotal": [60.0, 90.0, 75.0, 100.0, 22.5],
            "rush_fee": [0.0, 15.0, 0.0, 15.0, 0.0],
            "total": [60.0, 105.0, 75.0, 115.0, 22.5],
        }
    ),
    "add_totals of the example orders",
)
check_frame(
    tidy(orders),
    pd.DataFrame(
        {
            "order": ["P101", "P102", "P103", "P104", "P105"],
            "product": ["flyer-a5", "poster-a2", "card", "flyer-a5", "postr-a2"],
            "copies": [500, 20, 250, 1000, 5],
            "unit_price": [0.12, 4.50, 0.30, 0.10, 4.50],
            "channel": ["web", "shop", "email", "web", np.nan],
            "rush": [False, True, False, True, False],
        }
    ),
    "tidy of the example orders",
)
check_frame(
    bulk_price(orders, 250, 0.1)["unit_price"],
    pd.Series([0.11, 4.5, 0.27, 0.09, 4.5], name="unit_price"),
    "bulk_price(orders, 250, 0.1), as in the example",
)
assert correct_products(orders, {"postr-a2": "poster-a2"})["product"].tolist() == [
    "flyer-a5", "poster-a2", "card", "flyer-a5", "poster-a2"
], "correct_products of the example orders"
check_frame(orders, before, "the functions leave orders as it was")
