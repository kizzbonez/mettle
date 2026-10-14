# temporary: restores the settings when the block raises, and lets the exception through.
hall = {"lights": "dim", "door": "locked"}
try:
    with temporary(hall, lights="bright", alarm="off"):
        raise RuntimeError("fuse blew")
except RuntimeError as error:
    assert str(error) == "fuse blew", "the block's own exception reaches the caller"
else:
    raise AssertionError("an exception raised in the block should not be suppressed by temporary")
assert hall == {"lights": "dim", "door": "locked"}, "the settings are restored when the block raises"

try:
    with temporary(hall, door="open"):
        hall["door"] = "propped"
        hall["guest"] = "late"
        raise KeyError("key card")
except KeyError:
    pass
assert hall == {"lights": "dim", "door": "locked", "guest": "late"}, "only the changed keys are restored after an error"

with Tolerate(ValueError) as quiet:
    with temporary(hall, lights="off"):
        int("ten past")
assert hall["lights"] == "dim", "temporary restores before an outer Tolerate suppresses the error"
assert len(quiet.caught) == 1, "the error passed through temporary to the outer Tolerate"

try:
    with temporary(hall, lights="party"):
        return_value = 1 / 0
except ZeroDivisionError:
    pass
assert hall["lights"] == "dim", "the settings are restored after any kind of exception"
