import numpy as np
import pandas as pd

orders = pd.read_csv("data/orders.csv", dtype="str")
before = orders.copy()
clean = clean_types(orders)
expected = pd.DataFrame(
    {
        "order_id": ["D101", "D102", "D103", "D104", "D105", "D106", "D107", "D108"],
        "dish": ["korma", "vindaloo", "jalfrezi", "madras", "raita", "phaal", "dal", "bhuna"],
        "spice": pd.Series(["mild", "fiery", "hot", "hot", "mild", "fiery", "mild", "medium"]).astype(
            pd.CategoricalDtype(["mild", "medium", "hot", "fiery"], ordered=True)
        ),
        "price": [11.50, 12.95, 12.25, 10.95, 1.15, np.nan, 8.50, 11.75],
        "qty": pd.array([2, 1, None, 1, 3, 1, None, 1], dtype="Int64"),
        "paid": [True, True, False, True, False, True, True, False],
    }
)
check_frame(clean, expected, "clean_types of data/orders.csv: every column with its dtype and values")
assert unreadable(orders, "qty") == ["two"], "unreadable(orders, 'qty'), as in the example"
assert unreadable(orders, "price") == ["free"], "unreadable(orders, 'price'), as in the example"
assert at_least(clean, "hot")["order_id"].tolist() == ["D103", "D104", "D102", "D106"], "at_least(clean, 'hot'), as in the example"
check_frame(
    price_in_pence(clean),
    pd.Series(pd.array([1150, 1295, 1225, 1095, 115, None, 850, 1175], dtype="Int64"), name="price"),
    "price_in_pence of the example orders",
)
check_frame(orders, before, "the functions leave orders as it was")
