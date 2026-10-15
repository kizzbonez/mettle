import pandas as pd

orders = pd.DataFrame(
    {
        "order": ["Q1", "Q2", "Q3"],
        "product": ["card", "banner", "flyer-a6"],
        "copies": [3, 1, 40],
        "unit_price": [0.333, 89.99, 0.0525],
        "src": ["S", "E", "W"],
        "rush": [True, False, True],
        "note": ["gold ink", None, ""],
    },
    index=[7, 3, 5],
)
before = orders.copy()
totals = add_totals(orders)
assert totals is not orders, "add_totals returns a new frame"
check_frame(orders, before, "add_totals leaves orders unchanged: no new column, no changed value")
assert list(totals.columns) == list(orders.columns) + ["subtotal", "rush_fee", "total"], (
    "the three new columns come at the end, in order"
)
check_frame(totals[list(orders.columns)], before, "add_totals keeps every existing column as it was")
check_frame(
    totals[["subtotal", "rush_fee", "total"]],
    pd.DataFrame(
        {
            "subtotal": [0.999, 89.99, 2.1],
            "rush_fee": [15.0, 0.0, 15.0],
            "total": [16.0, 89.99, 17.1],
        },
        index=[7, 3, 5],
    ),
    "subtotal is copies times price, a rush costs 15.0, and total is rounded to 2 decimals",
)

empty = orders.iloc[0:0]
none = add_totals(empty)
assert len(none) == 0 and list(none.columns)[-3:] == ["subtotal", "rush_fee", "total"], (
    "orders without rows still get the three columns"
)
