import pandas as pd

texts = ["2.675", "1.005", "0.125", "0.375", "2.665", "0.005", "-0.125", "-2.675", "12.5", "0.1", "7", "1.999",
         "4.355", "8.165", "0.004", "-0.004"]
prices = pd.Series(texts, index=[f"line {n}" for n in range(len(texts), 0, -1)], name="unit_price", dtype="str")
before = prices.copy()
check_frame(
    to_pence(prices),
    pd.Series(
        [268, 101, 13, 38, 267, 1, -13, -268, 1250, 10, 700, 200, 436, 817, 0, 0],
        index=prices.index,
        name="unit_price",
    ),
    "to_pence rounds every half exactly and away from zero, refunds included, and keeps the index and name",
)
check_frame(prices, before, "to_pence does not change the prices it is given")

one = to_pence(pd.Series(["19.995"], name="price", dtype="str"))
check_frame(one, pd.Series([2000], name="price"), "a single price rounds up into the next pound")

empty = to_pence(pd.Series([], name="price", dtype="str"))
assert isinstance(empty, pd.Series) and len(empty) == 0 and str(empty.dtype) == "int64", (
    "no prices give an empty int64 Series"
)
