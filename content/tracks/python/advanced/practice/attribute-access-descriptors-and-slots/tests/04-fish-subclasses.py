# Fish.__init_subclass__: checks water, sets it, and registers subclasses in order.
assert Fish.catalogue == {}, "the catalogue is empty before any subclass is defined"


class Tetra(Fish, water="fresh"):
    pass


try:
    class Eel(Fish, water="brackish"):
        pass
except ValueError:
    pass
else:
    raise AssertionError("water other than 'fresh' or 'salt' should raise ValueError")
assert "Eel" not in Fish.catalogue, "a refused subclass is not registered"

try:
    class Mystery(Fish):
        pass
except TypeError:
    pass
else:
    raise AssertionError("a subclass without water= should fail with TypeError")


class Tang(Fish, water="salt"):
    pass


class NeonTetra(Tetra, water="fresh"):
    pass


try:
    class Coral(Tang, water="Salt"):
        pass
except ValueError:
    pass
else:
    raise AssertionError("water is checked exactly, so 'Salt' should raise ValueError")

assert list(Fish.catalogue) == ["Tetra", "Tang", "NeonTetra"], "the catalogue holds the accepted subclasses in definition order"
assert (Tetra.water, Tang.water, NeonTetra.water) == ("fresh", "salt", "fresh"), "each subclass gets its own water"
assert Tang.catalogue is Fish.catalogue, "there is one catalogue, shared through Fish"
assert not hasattr(Fish, "water"), "the base class itself has no water"
assert isinstance(NeonTetra(), Fish), "registered subclasses are ordinary classes"
