# Aquarium shop: a validating descriptor and a base class that checks its subclasses.


class Bounded:
    """A data descriptor for a number between low and high, both allowed."""

    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        self.name = name
        self.private = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        is_number = isinstance(value, (int, float)) and not isinstance(value, bool)
        if not is_number or not self.low <= value <= self.high:
            raise ValueError(f"{self.name} must be between {self.low} and {self.high}, got {value!r}")
        setattr(obj, self.private, value)


class Tank:
    temperature = Bounded(18, 30)
    ph = Bounded(6, 8.5)

    def __init__(self, name, temperature, ph):
        self.name = name
        self.temperature = temperature
        self.ph = ph


class Fish:
    catalogue = {}

    def __init_subclass__(cls, /, water, **kwargs):
        super().__init_subclass__(**kwargs)
        if water not in ("fresh", "salt"):
            raise ValueError(f"water must be 'fresh' or 'salt', got {water!r}")
        cls.water = water
        Fish.catalogue[cls.__name__] = cls
