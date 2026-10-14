# Bounded accepts ints and floats within the bounds, both ends included, and refuses the rest.
tank = Tank("cold", 18, 6)
assert (tank.temperature, tank.ph) == (18, 6), "the lower bounds themselves are allowed"
tank.temperature, tank.ph = 30, 8.5
assert (tank.temperature, tank.ph) == (30, 8.5), "the upper bounds themselves are allowed"
tank.temperature = 22.75
assert tank.temperature == 22.75, "a float within the bounds is allowed"

for bad in (17.99, 30.01, -5, 1000, True, False, "25", None, [25]):
    try:
        tank.temperature = bad
    except ValueError as error:
        assert "temperature" in str(error), "the ValueError message names the attribute"
    else:
        raise AssertionError(f"temperature should refuse {bad!r} with ValueError")
    assert tank.temperature == 22.75, "a refused value leaves the old value in place"

try:
    tank.ph = 9
except ValueError as error:
    assert "ph" in str(error), "each descriptor's message names its own attribute"
else:
    raise AssertionError("a pH of 9 is above 8.5 and should raise ValueError")

class Heater:
    power = Bounded(0, 1)


heater = Heater()
heater.power = 0
heater.power = 1
heater.power = 0.5
for flag in (True, False):
    try:
        heater.power = flag
    except ValueError:
        pass
    else:
        raise AssertionError(f"a bool is not a number reading, so {flag!r} should raise ValueError even within the bounds")
assert heater.power == 0.5, "a refused bool leaves the old value in place"

try:
    Tank("hot", 40, 7)
except ValueError:
    pass
else:
    raise AssertionError("assignments in __init__ go through the descriptor too, so Tank('hot', 40, 7) should raise ValueError")
