# The aquarium example from the instructions.
tank = Tank("reef", 25, 8.2)
assert tank.temperature == 25, "reading the attribute gives the stored value"
assert vars(tank) == {"name": "reef", "_temperature": 25, "_ph": 8.2}, "each value is stored in the instance under '_' + its name"

try:
    tank.temperature = 31
except ValueError as error:
    assert "temperature" in str(error), "the ValueError message names the attribute"
else:
    raise AssertionError("a temperature of 31 is above 30 and should raise ValueError")
assert tank.temperature == 25, "a refused value leaves the old value in place"
assert type(Tank.ph).__name__ == "Bounded", "reading the attribute on the class gives the descriptor itself"


class Guppy(Fish, water="fresh"):
    pass


class Clownfish(Fish, water="salt"):
    pass


assert list(Fish.catalogue) == ["Guppy", "Clownfish"], "each subclass is stored in Fish.catalogue under its name, in order"
assert Fish.catalogue["Guppy"] is Guppy, "the catalogue holds the classes themselves"
assert Clownfish.water == "salt", "__init_subclass__ sets the water attribute"
