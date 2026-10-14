# Bike is a named tuple: immutable, unpackable, with a default for electric.
assert issubclass(Bike, tuple), "Bike should be a named tuple, so a tuple subclass"
assert Bike._fields == ("code", "size", "electric"), "Bike has the fields code, size and electric, in that order"

tandem = Bike("T1", Size.LARGE)
code, size, electric = tandem
assert (code, size, electric) == ("T1", Size.LARGE, False), "a Bike unpacks into code, size and electric"
assert tandem[0] == "T1" and tandem.code == "T1", "fields are reachable by position and by name"
assert len(tandem) == 3, "a Bike always has three items"
assert Bike("E9", Size.SMALL, True).electric is True, "electric can be given by position"
assert tandem._replace(electric=True) == ("T1", "large", True), "_replace builds a changed copy"
assert tandem.electric is False, "_replace leaves the original alone"
assert tandem._asdict() == {"code": "T1", "size": "large", "electric": False}, "_asdict gives the fields as a dict"

try:
    tandem.code = "T2"
except AttributeError:
    pass
else:
    raise AssertionError("assigning to a field of a Bike should raise AttributeError")

assert len({Bike("A", Size.SMALL), Bike("A", Size.SMALL), Bike("B", Size.SMALL)}) == 2, "equal bikes count once in a set"
