# Tolerate: suppresses the given classes and their subclasses, records them, lets others through.
lookups = Tolerate(LookupError)
steps = []
with lookups:
    steps.append("before")
    {}["towels"]
    steps.append("never reached")
steps.append("after")
assert steps == ["before", "after"], "after a suppressed exception the rest of the block is skipped and the program continues"
with lookups:
    [][3]
assert [type(e) for e in lookups.caught] == [KeyError, IndexError], "subclasses of a given class are suppressed and recorded"
assert lookups.caught[0].args == ("towels",), "caught holds the exception objects themselves"

with lookups:
    steps.append("calm")
assert len(lookups.caught) == 2, "a block that ends normally records nothing"
assert lookups.__exit__(None, None, None) in (None, False), "__exit__ returns a false value when there was no exception"

try:
    with lookups:
        raise TypeError("wrong plug")
except TypeError:
    pass
else:
    raise AssertionError("an exception of another class should carry on to the caller")
assert len(lookups.caught) == 2, "an exception that carries on is not recorded"

nothing = Tolerate()
try:
    with nothing:
        raise ValueError("loose tap")
except ValueError:
    pass
else:
    raise AssertionError("Tolerate() with no classes should suppress nothing")
assert nothing.caught == [], "Tolerate() with no classes records nothing"

with Tolerate(OSError) as first, Tolerate(ValueError) as second:
    raise FileNotFoundError("logbook.txt")
assert len(first.caught) == 1 and second.caught == [], "only the manager whose class matches records the exception"
