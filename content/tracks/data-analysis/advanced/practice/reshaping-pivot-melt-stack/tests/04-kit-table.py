import pandas as pd

orders = pd.DataFrame(
    {
        "member": ["Una", "Raj", "Tess", "Olu", "Pim"],
        "size": ["XL", "S", "M", "S", "M"],
        "kit": [[], ["cap", "vest", "cap"], ["gloves"], ["vest"], []],
    },
    index=["o5", "o4", "o3", "o2", "o1"],
)
before = orders.copy()
result = kit_table(orders)
assert isinstance(result, pd.DataFrame), "kit_table returns a DataFrame"
expected = pd.DataFrame(
    {"M": [0, 1, 0], "S": [2, 0, 2]},
    index=pd.Index(["cap", "gloves", "vest"], name="kit"),
)
expected.columns.name = "size"
check_frame(
    result,
    expected,
    "kit_table counts every item, twice when ordered twice, skips empty orders, and sorts the items and sizes",
)
check_frame(orders, before, "kit_table does not change the orders")

one = pd.DataFrame({"member": ["Ana"], "size": ["L"], "kit": [["socks", "socks"]]})
expected_one = pd.DataFrame({"L": [2]}, index=pd.Index(["socks"], name="kit"))
expected_one.columns.name = "size"
check_frame(kit_table(one), expected_one, "a single order of one item twice")
