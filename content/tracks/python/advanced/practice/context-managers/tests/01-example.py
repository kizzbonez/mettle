# The settings panel example from the instructions.
settings = {"heating": 19, "lights": "off"}
with temporary(settings, heating=23, music="jazz") as current:
    assert current is settings, "temporary yields the settings dict itself"
    assert settings == {"heating": 23, "lights": "off", "music": "jazz"}, "inside the block the changes are applied"
assert settings == {"heating": 19, "lights": "off"}, "after the block the old values are back and new keys are gone"

quiet = Tolerate(KeyError, ValueError)
with quiet:
    int("warm")
with quiet as same:
    settings["sauna"]
assert same is quiet, "__enter__ returns the Tolerate object itself"
assert [type(e).__name__ for e in quiet.caught] == ["ValueError", "KeyError"], "caught lists the suppressed exceptions in order"

try:
    with quiet:
        1 / 0
except ZeroDivisionError:
    pass
else:
    raise AssertionError("an exception of a class that was not given should reach the caller")
assert len(quiet.caught) == 2, "an exception that is let through is not recorded"
