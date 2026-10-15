import pandas as pd

orders = pd.DataFrame(
    {
        "order_id": ["F1", "F2", "F3", "F4", "F5", "F6"],
        "dish": ["korma", "dal", "naan", "rice", "korma", "dal"],
        "spice": ["mild", "mild", "mild", "mild", "mild", "mild"],
        "price": ["8.00", None, "n/a", "1,95", "8.00", "n/a"],
        "qty": ["1", "2", None, "3", "10", "1"],
        "paid": ["Y", "Y", "Y", "Y", "Y", "Y"],
    }
)
before = orders.copy()
assert unreadable(orders, "price") == ["n/a", "1,95", "n/a"], (
    "unreadable lists every value that is present but not a number, repeats included, in row order"
)
assert unreadable(orders, "qty") == [], "a column whose values are numbers or missing has nothing unreadable"
assert unreadable(orders, "dish") == ["korma", "dal", "naan", "rice", "korma", "dal"], "unreadable works on any text column"
check_frame(orders, before, "unreadable leaves orders unchanged")

result = unreadable(orders.iloc[[0]], "price")
assert isinstance(result, list) and result == [], "unreadable returns a list, empty for a single readable value"
