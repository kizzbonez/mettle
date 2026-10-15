import numpy as np
import pandas as pd

orders = pd.DataFrame(
    {
        "order_id": ["E1", "E2", "E3", "E4"],
        "dish": ["biryani", "naan", "samosa", "lassi"],
        "spice": ["medium", "mild", "medium", "mild"],
        "price": ["£9.95", "2.40", None, "3"],
        "qty": ["1", "4", None, "x2"],
        "paid": ["N", "N", "Y", "N"],
    },
    index=[11, 12, 13, 14],
)
before = orders.copy()
clean = clean_types(orders)
check_frame(orders, before, "clean_types leaves orders unchanged")
assert list(clean.columns) == list(orders.columns), "clean_types keeps the columns in order"
dtypes = {column: str(dtype) for column, dtype in clean.dtypes.items()}
assert dtypes == {
    "order_id": "str", "dish": "str", "spice": "category", "price": "float64", "qty": "Int64", "paid": "bool",
}, "each column has the dtype in the instructions"
assert clean["qty"].tolist()[:2] == [1, 4] and clean["qty"].isna().tolist() == [False, False, True, True], (
    "qty holds the numbers, and <NA> where the text is missing or not a number"
)
assert clean["spice"].cat.ordered, "spice is an ordered categorical"
assert list(clean["spice"].cat.categories) == ["mild", "medium", "hot", "fiery"], (
    "spice has all four categories in order of heat, even those no order uses"
)
check_frame(
    clean["price"],
    pd.Series([np.nan, 2.40, np.nan, 3.0], index=[11, 12, 13, 14], name="price"),
    "price is a number, and NaN where the text is not a number or missing",
)
assert clean["paid"].tolist() == [False, False, True, False], "paid is True for Y and False for N"
check_frame(clean.index, orders.index, "clean_types keeps the index")
