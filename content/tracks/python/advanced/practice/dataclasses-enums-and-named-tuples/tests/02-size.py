# Size is a StrEnum with three members whose values come from auto().
import enum

assert isinstance(Size, enum.EnumType) and issubclass(Size, enum.StrEnum), "Size should be a StrEnum"
assert [member.name for member in Size] == ["SMALL", "MEDIUM", "LARGE"], "Size has SMALL, MEDIUM and LARGE, in that order"
assert [member.value for member in Size] == ["small", "medium", "large"], "auto() in a StrEnum gives the lower-case names"
assert Size("medium") is Size.MEDIUM and Size["SMALL"] is Size.SMALL, "members can be looked up by value and by name"
assert isinstance(Size.LARGE, str) and Size.LARGE == "large", "a StrEnum member is a string equal to its value"
assert f"{Size.SMALL}-frame" == "small-frame", "a StrEnum member formats as its value"

try:
    Size("huge")
except ValueError:
    pass
else:
    raise AssertionError("looking up an unknown size should raise ValueError")
