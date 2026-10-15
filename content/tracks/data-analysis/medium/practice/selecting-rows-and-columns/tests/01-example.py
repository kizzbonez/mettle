import pandas as pd

rooms = pd.DataFrame(
    {
        "room": ["G01", "G02", "101", "102", "103", "201", "202"],
        "floor": [0, 0, 1, 1, 1, 2, 2],
        "beds": [2, 1, 2, 2, 3, 1, 4],
        "view": ["garden", "street", "sea", "street", "sea", "sea", "garden"],
        "rate": [95.0, 70.0, 120.0, 85.0, 140.0, 90.0, 160.0],
    }
)
indexed = index_by_room(rooms)
check_frame(
    indexed,
    pd.DataFrame(
        {
            "floor": [0, 0, 1, 1, 1, 2, 2],
            "beds": [2, 1, 2, 2, 3, 1, 4],
            "view": ["garden", "street", "sea", "street", "sea", "sea", "garden"],
            "rate": [95.0, 70.0, 120.0, 85.0, 140.0, 90.0, 160.0],
        },
        index=pd.Index(["G01", "G02", "101", "102", "103", "201", "202"], name="room"),
    ),
    "index_by_room of the example rooms",
)
assert rate_of(indexed, "103") == 140.0, "rate_of(indexed, '103'), as in the example"
check_frame(
    block(indexed, "102", "201", ["rate", "view"]),
    pd.DataFrame(
        {"rate": [85.0, 140.0, 90.0], "view": ["street", "sea", "sea"]},
        index=pd.Index(["102", "103", "201"], name="room"),
    ),
    "block(indexed, '102', '201', ['rate', 'view']), as in the example",
)
check_frame(
    last_rooms(indexed, 2),
    pd.DataFrame(
        {"room": ["201", "202"], "floor": [2, 2], "beds": [1, 4], "view": ["sea", "garden"], "rate": [90.0, 160.0]}
    ),
    "last_rooms(indexed, 2), as in the example",
)
