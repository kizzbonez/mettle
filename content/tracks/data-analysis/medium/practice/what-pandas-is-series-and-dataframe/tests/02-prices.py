import numpy as np
import pandas as pd

prices = {"wildflower": 7.25, "acacia": 9.5, "manuka": 24.0, "borage": 8.75}
before = dict(prices)
listed = price_list(prices)
assert isinstance(listed, pd.Series), "price_list returns a Series"
check_frame(
    listed,
    pd.Series([7.25, 9.5, 24.0, 8.75], index=["wildflower", "acacia", "manuka", "borage"], name="price"),
    "price_list keeps the dict's order (not sorted) and names the Series price",
)
assert prices == before, "price_list does not change the dict"
check_frame(
    price_list({"heather": 8.0}),
    pd.Series([8.0], index=["heather"], name="price"),
    "price_list of a single honey",
)

old = price_list({"clover": 6.5, "acacia": 9.5, "heather": 8.0})
new = price_list({"heather": 7.5, "clover": 7.0, "acacia": 9.5})
check_frame(
    price_changes(old, new),
    pd.Series([0.0, 0.5, -0.5], index=["acacia", "clover", "heather"], name="price"),
    "price_changes matches the honeys by name, not by position, and a lower price gives a negative change",
)

old_copy = old.copy()
apart = price_changes(old, price_list({"manuka": 24.0, "borage": 8.75}))
check_frame(
    apart,
    pd.Series([np.nan] * 5, index=["acacia", "borage", "clover", "heather", "manuka"], name="price"),
    "when no honey is in both lists every change is NaN, and every name is kept",
)
check_frame(old, old_copy, "price_changes does not change the Series it is given")

check_frame(
    price_changes(price_list({"clover": 6.5, "heather": 8.0}), price_list({"clover": 6.0})),
    pd.Series([-0.5, np.nan], index=["clover", "heather"], name="price"),
    "a honey dropped from the new list has a NaN change",
)
