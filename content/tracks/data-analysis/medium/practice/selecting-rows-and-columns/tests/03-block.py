import pandas as pd

indexed = pd.DataFrame(
    {
        "floor": [2, 0, 1, 1, 3, 0],
        "beds": [1, 2, 2, 3, 4, 1],
        "view": ["sea", "garden", "street", "sea", "sea", "garden"],
        "rate": [90.0, 95.0, 85.0, 140.0, 220.0, 70.0],
    },
    index=pd.Index(["201", "G01", "102", "103", "PH", "G02"], name="room"),
)
before = indexed.copy()

check_frame(
    block(indexed, "G01", "103", ["view", "floor", "rate"]),
    pd.DataFrame(
        {"view": ["garden", "street", "sea"], "floor": [0, 1, 1], "rate": [95.0, 85.0, 140.0]},
        index=pd.Index(["G01", "102", "103"], name="room"),
    ),
    "block includes both labels, follows the table's order (not sorted codes) and the order of columns",
)
check_frame(
    block(indexed, "PH", "PH", ["rate"]),
    pd.DataFrame({"rate": [220.0]}, index=pd.Index(["PH"], name="room")),
    "one room and one column still give a DataFrame",
)
check_frame(
    block(indexed, "201", "G02", ["beds"]),
    pd.DataFrame({"beds": [1, 2, 2, 3, 4, 1]}, index=indexed.index),
    "from the first label to the last label gives every room",
)
check_frame(indexed, before, "block does not change the frame it is given")
