import pandas as pd

rooms = pd.DataFrame(
    {
        "view": ["park", "sea", "sea", "park"],
        "rate": [80.0, 150.0, 135.0, 60.0],
        "room": ["301", "S1", "S2", "007"],
        "beds": [2, 4, 3, 1],
        "floor": [3, 4, 4, 0],
    }
)
before = rooms.copy()
indexed = index_by_room(rooms)
check_frame(rooms, before, "index_by_room does not change the frame it is given")
assert indexed.index.name == "room", "the index is named room"
assert indexed.index.tolist() == ["301", "S1", "S2", "007"], "the index holds the room codes in the table's order"
assert list(indexed.columns) == ["view", "rate", "beds", "floor"], "room is no longer a column and the others keep their order"

assert rate_of(indexed, "S1") == 150.0, "rate_of finds a room by its code"
assert rate_of(indexed, "007") == 60.0, "rate_of finds a room whatever its position"
indexed_before = indexed.copy()
try:
    rate_of(indexed, "999")
except KeyError:
    pass
else:
    raise AssertionError("rate_of of a code that is not in the index raises KeyError")
check_frame(indexed, indexed_before, "rate_of does not change the frame it is given")

one = index_by_room(pd.DataFrame({"room": ["P1"], "rate": [210.0]}))
assert one.shape == (1, 1) and rate_of(one, "P1") == 210.0, "a table of one room"
