# Aquarium shop: a validating descriptor and a base class that checks its subclasses.


class Bounded:
    """A data descriptor for a number between low and high, both allowed."""

    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        # Remember the name and the private name "_" + name.
        pass

    def __get__(self, obj, objtype=None):
        # The descriptor itself on the class; the stored value on an instance.
        raise NotImplementedError("write __get__")

    def __set__(self, obj, value):
        # Store an int or float (not a bool) within the bounds; otherwise raise
        # ValueError naming the attribute.
        raise NotImplementedError("write __set__")


class Tank:
    temperature = Bounded(18, 30)
    ph = Bounded(6, 8.5)

    def __init__(self, name, temperature, ph):
        self.name = name
        self.temperature = temperature
        self.ph = ph


class Fish:
    catalogue = {}

    # Add __init_subclass__(cls, /, water, **kwargs): water must be "fresh" or
    # "salt"; set cls.water and store the class in Fish.catalogue by name.
