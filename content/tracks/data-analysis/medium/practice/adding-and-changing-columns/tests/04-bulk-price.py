import pandas as pd

orders = pd.DataFrame(
    {
        "order": ["B1", "B2", "B3", "B4", "B5"],
        "product": ["flyer-a5", "card", "flyer-a5", "poster-a2", "card"],
        "copies": [99, 100, 2000, 10, 100],
        "unit_price": [0.125, 0.40, 0.08, 4.5, 0.375],
        "src": ["W", "S", "W", "E", "W"],
        "rush": [False, True, False, False, True],
        "note": ["", "", "", "", ""],
    },
    index=[10, 20, 30, 40, 50],
)
before = orders.copy()

priced = bulk_price(orders, 100, 0.25)
check_frame(orders, before, "bulk_price leaves orders unchanged")
assert list(priced.columns) == list(orders.columns), "bulk_price keeps the same columns"
check_frame(
    priced["unit_price"],
    pd.Series([0.125, 0.3, 0.06, 4.5, 0.28], index=[10, 20, 30, 40, 50], name="unit_price"),
    "orders of at least min_copies get the discount rounded to 2 decimals, and the other prices stay exactly as they were",
)
check_frame(priced.drop(columns=["unit_price"]), before.drop(columns=["unit_price"]), "bulk_price changes only unit_price")

check_frame(
    bulk_price(orders, 5000, 0.5)["unit_price"],
    before["unit_price"],
    "when no order is large enough every price stays as it was",
)
check_frame(
    bulk_price(orders, 1, 0.0)["unit_price"],
    pd.Series([0.12, 0.4, 0.08, 4.5, 0.38], index=[10, 20, 30, 40, 50], name="unit_price"),
    "a discount of 0 still rounds the prices of the orders it applies to",
)
