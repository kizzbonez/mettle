import pandas as pd

indexed = pd.DataFrame(
    {
        "floor": [0, 1, 1, 2, 3],
        "beds": [2, 2, 3, 1, 4],
        "rate": [95.0, 85.0, 140.0, 90.0, 220.0],
    },
    index=pd.Index(["G01", "102", "103", "201", "PH"], name="room"),
)
before = indexed.copy()

check_frame(
    last_rooms(indexed, 1),
    pd.DataFrame({"room": ["PH"], "floor": [3], "beds": [4], "rate": [220.0]}),
    "last_rooms(indexed, 1) gives the last row with room as the first column",
)
check_frame(
    last_rooms(indexed, 5),
    pd.DataFrame(
        {
            "room": ["G01", "102", "103", "201", "PH"],
            "floor": [0, 1, 1, 2, 3],
            "beds": [2, 2, 3, 1, 4],
            "rate": [95.0, 85.0, 140.0, 90.0, 220.0],
        }
    ),
    "asking for every row gives every row, numbered from 0",
)
none = last_rooms(indexed, 0)
assert len(none) == 0, "last_rooms with n = 0 gives no rows"
assert list(none.columns) == ["room", "floor", "beds", "rate"], "with n = 0 the columns are still room and the others"
three = last_rooms(indexed, 3)
assert isinstance(three.index, pd.RangeIndex) and three.index.tolist() == [0, 1, 2], "the rows are numbered from 0"
assert three["room"].tolist() == ["103", "201", "PH"], "the last rows are taken by position"
check_frame(indexed, before, "last_rooms does not change the frame it is given")
