# temporary: applies changes, then restores exactly the changed keys after a normal exit.
room = {"heating": 20, "blinds": "up", "fan": 0}
with temporary(room) as same:
    assert same is room and room == {"heating": 20, "blinds": "up", "fan": 0}, "no changes leave the settings as they are"
assert room == {"heating": 20, "blinds": "up", "fan": 0}, "no changes, nothing to restore"

with temporary(room, fan=3, kettle="on"):
    room["guests"] = 4
    room["blinds"] = "down"
assert room == {"heating": 20, "blinds": "down", "fan": 0, "guests": 4}, "keys not named in the changes stay as the block left them"

with temporary(room, heating=24):
    room["heating"] = 30
assert room["heating"] == 20, "a changed key gets its old value back even if the block changed it again"

with temporary(room, fan=2):
    del room["fan"]
assert room["fan"] == 0, "a changed key that the block deleted is put back"

with temporary(room, radio="on"):
    del room["radio"]
assert "radio" not in room, "a new key that the block already deleted causes no error"

with temporary(room, heating=22):
    with temporary(room, heating=25, lamp="dim"):
        assert room["heating"] == 25 and room["lamp"] == "dim", "the inner changes are applied"
    assert room["heating"] == 22 and "lamp" not in room, "the inner block restores the outer block's values"
assert room["heating"] == 20, "the outer block restores the original value"

empty = {}
with temporary(empty, sauna="hot", café="open"):
    assert empty == {"sauna": "hot", "café": "open"}, "changes can add keys to an empty dict"
assert empty == {}, "keys that were missing are deleted afterwards"
