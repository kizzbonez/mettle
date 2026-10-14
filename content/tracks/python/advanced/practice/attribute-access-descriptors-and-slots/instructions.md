Write a reusable descriptor and a base class that checks its subclasses. The starter's `Tank`
class already uses the descriptor; do not change it.

1. `Bounded(low, high)` is a **data descriptor** for a number between `low` and `high`, both
   allowed. The starter's `__init__` stores the bounds. Add:
   - `__set_name__(self, owner, name)`: remember the attribute's name, and the private name
     `"_" + name` under which each instance keeps its value.
   - `__get__(self, obj, objtype=None)`: read through the class (`obj` is `None`), return the
     descriptor itself; read through an instance, return the value stored in that instance.
   - `__set__(self, obj, value)`: if `value` is an `int` or a `float` (but not a `bool`) and
     `low <= value <= high`, store it in the instance under the private name. Otherwise raise
     `ValueError` with a message that contains the attribute's name, and keep the old value.
2. `Fish` is a base class with a class attribute `catalogue = {}`. Give it
   `__init_subclass__(cls, /, water, **kwargs)`, which runs for every subclass:
   - call `super().__init_subclass__(**kwargs)`;
   - if `water` is not `"fresh"` or `"salt"`, raise `ValueError` and register nothing;
   - otherwise set `cls.water = water` and store the class in `Fish.catalogue` under its
     `__name__`.

A subclass written without `water=` then fails with `TypeError` on its own.

Example:

```python
tank = Tank("reef", 25, 8.2)
tank.temperature, vars(tank)   # (25, {'name': 'reef', '_temperature': 25, '_ph': 8.2})
tank.temperature = 31          # ValueError: temperature must be between 18 and 30, got 31
tank.temperature               # 25: the old value stays
type(Tank.ph).__name__         # 'Bounded'


class Guppy(Fish, water="fresh"):
    pass


class Clownfish(Fish, water="salt"):
    pass


list(Fish.catalogue), Clownfish.water   # (['Guppy', 'Clownfish'], 'salt')
```
