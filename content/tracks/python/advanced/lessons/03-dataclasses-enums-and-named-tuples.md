---
title: Dataclasses, Enums and Named Tuples
summary: Replace hand-written record classes with `@dataclass`, use named tuples for small immutable records, enums for fixed sets of choices, and the new `frozendict` for read-only mappings, and know which to pick.
minutes: 40
objectives:
  - Declare dataclasses with defaults, `field(default_factory=...)` and validation in `__post_init__`
  - Use `frozen`, `order` and `slots`, and explain when a dataclass is hashable
  - Define and use `typing.NamedTuple` records and `Enum`, `IntEnum`, `StrEnum` and `Flag` types
  - Use `frozendict` (new in 3.15) and choose the right record or constant type for a job
---

## Outline

1. Dataclasses
2. Defaults, `field` and `__post_init__`
3. Frozen, ordered and slotted dataclasses
4. Named tuples
5. Enums
6. `frozendict`
7. Choosing between them

## Dataclasses

A class that only holds data needs an `__init__` that stores each argument, a `__repr__` and an
`__eq__`: the special methods of the last lesson, written the same way every time. The class
decorator `@dataclasses.dataclass` writes them for you. Each **field** is declared as a class
variable with a **type annotation**, `name: type`. Lesson 6 covers annotations; for now, know
that the dataclass reads them to find the fields and does not check the types at run time.

```python
from dataclasses import dataclass, field


@dataclass
class Plant:
    name: str
    water_every_days: int = 7
    tags: list[str] = field(default_factory=list)


fern = Plant("fern", 3)
cactus = Plant("cactus", water_every_days=21, tags=["desert"])
print(fern)
print(fern == Plant("fern", 3), fern == cactus)
fern.tags.append("shade")
print(fern.tags, Plant("ivy").tags)
```

```text
Plant(name='fern', water_every_days=3, tags=[])
True False
['shade'] []
```

The generated `__init__` takes the fields in order, as positional or keyword arguments. `__repr__`
shows them all, and `__eq__` compares them field by field when both objects have exactly the same
class.

## Defaults, `field` and `__post_init__`

A default written after the annotation becomes the default argument of `__init__`. A field
without a default may not follow one with a default, just like function parameters.

A mutable default would be shared by every instance, the pitfall you know from function
defaults, so the decorator refuses any unhashable default:

```python
from dataclasses import dataclass


@dataclass
class Bad:
    tags: list = []
```

```text
Traceback (most recent call last):
  ...
ValueError: mutable default <class 'list'> for field tags is not allowed: use default_factory
```

`field(default_factory=list)` calls `list()` for each new instance instead, which is why the
`ivy` above got its own empty list. `field` takes other options too: `init=False` leaves a field
out of `__init__`, and `repr=False` or `compare=False` leave it out of `__repr__` or `__eq__`.

The generated `__init__` calls `__post_init__(self)` last, if you define it. That is the place to
validate arguments and compute derived fields:

```python
from dataclasses import dataclass, field


@dataclass
class Booking:
    guest: str
    nights: int
    rate: int
    total: int = field(init=False)

    def __post_init__(self):
        if self.nights < 1:
            raise ValueError(f"nights must be at least 1, got {self.nights}")
        self.total = self.nights * self.rate


print(Booking("Okafor", 3, 90))
Booking("Lund", 0, 90)
```

```text
Booking(guest='Okafor', nights=3, rate=90, total=270)
Traceback (most recent call last):
  ...
ValueError: nights must be at least 1, got 0
```

## Frozen, ordered and slotted dataclasses

The decorator takes keyword options. Three are used often:

- `frozen=True` makes assignment to a field raise `FrozenInstanceError`, a subclass of
  `AttributeError`. With `eq` and `frozen` both true, a `__hash__` is generated, so instances can
  be set members and dict keys.
- `order=True` generates `<`, `<=`, `>` and `>=`, comparing the fields as a tuple, in order.
- `slots=True` stores fields in `__slots__` instead of a per-instance `__dict__` (lesson 8),
  which saves memory and forbids new attributes.

```python
from dataclasses import dataclass, replace


@dataclass(frozen=True, order=True, slots=True)
class Coordinate:
    lat: float
    lon: float


home = Coordinate(51.5, -0.12)
print(sorted([Coordinate(48.85, 2.35), home, Coordinate(48.85, 2.29)]))
print({home: "home"}[Coordinate(51.5, -0.12)])
moved = replace(home, lon=0.0)
print(moved, home)
home.lat = 0.0
```

```text
[Coordinate(lat=48.85, lon=2.29), Coordinate(lat=48.85, lon=2.35), Coordinate(lat=51.5, lon=-0.12)]
home
Coordinate(lat=51.5, lon=0.0) Coordinate(lat=51.5, lon=-0.12)
Traceback (most recent call last):
  ...
dataclasses.FrozenInstanceError: cannot assign to field 'lat'
```

`dataclasses.replace` builds a new instance with some fields changed, the usual way to "modify" a
frozen object. A plain mutable dataclass, like `Plant`, has `__hash__` set to `None`: it compares
by value and can change, so it cannot be hashed safely. `dataclasses.asdict(obj)` converts an
instance to a dict, recursing into nested dataclasses and lists.

## Named tuples

`typing.NamedTuple` creates a **tuple subclass** whose positions also have names. It is
immutable, unpacks like any tuple and costs no more memory than one.

```python
from typing import NamedTuple


class Reading(NamedTuple):
    sensor: str
    celsius: float
    ok: bool = True


reading = Reading("kitchen", 21.5)
sensor, celsius, ok = reading
print(reading, reading[1], reading.celsius, ok)
print(reading._replace(celsius=22.0))
print(reading._asdict())
print(reading == ("kitchen", 21.5, True))
```

```text
Reading(sensor='kitchen', celsius=21.5, ok=True) 21.5 21.5 True
Reading(sensor='kitchen', celsius=22.0, ok=True)
{'sensor': 'kitchen', 'celsius': 21.5, 'ok': True}
True
```

The last line shows the price of being a tuple: a `Reading` equals any tuple with the same items.
The leading underscore in `_replace` and `_asdict` avoids clashes with field names; the methods
are public. The older `collections.namedtuple("Reading", "sensor celsius ok")` builds the same
kind of class without annotations.

## Enums

An **enumeration** is a fixed set of named constants. Each **member** has a `name` and a `value`,
is created once, and is compared by identity. `auto()` picks the values for you.

```python
from enum import Enum, Flag, IntEnum, StrEnum, auto


class Status(Enum):
    PENDING = auto()
    SHIPPED = auto()
    DELIVERED = auto()


print(Status.SHIPPED, Status.SHIPPED.name, Status.SHIPPED.value)
print(Status(3), Status["PENDING"], [status.name for status in Status])
print(Status.SHIPPED == 2, Status.SHIPPED is Status(2))


class Size(StrEnum):
    SMALL = auto()
    LARGE = auto()


class Priority(IntEnum):
    LOW = 1
    HIGH = 3


class Permission(Flag):
    READ = auto()
    WRITE = auto()
    EXECUTE = auto()


print(Size.SMALL == "small", f"size={Size.LARGE}", Priority.HIGH > Priority.LOW)
rw = Permission.READ | Permission.WRITE
print(rw, Permission.WRITE in rw, Permission.EXECUTE in rw)
```

```text
Status.SHIPPED SHIPPED 2
Status.DELIVERED Status.PENDING ['PENDING', 'SHIPPED', 'DELIVERED']
False True
True size=large True
Permission.READ|WRITE True False
```

`Status(3)` looks a member up by value and `Status["PENDING"]` by name; an unknown value raises
`ValueError: 7 is not a valid Status`. A plain `Enum` member never equals its value, which stops a
status from being confused with an ordinary number. `IntEnum` and `StrEnum` members *are* ints
and strings, for code that must interoperate with them; `auto()` in a `StrEnum` gives the
lower-cased name. `Flag` members are powers of two that combine with `|` and are tested with
`in`.

## `frozendict`

Python 3.15 adds a built-in **`frozendict`** (PEP 814): a mapping that cannot be changed after
it is created. It is not a subclass of `dict`. It keeps insertion order, compares equal to a dict
with the same items regardless of order, and is hashable when all its keys and values are.

```python
defaults = frozendict(theme="dark", font_size=14)
print(defaults["theme"], defaults == {"font_size": 14, "theme": "dark"})
profiles = {defaults: "profile A"}
bigger = defaults | {"font_size": 16}
print(bigger, defaults["font_size"])
defaults["theme"] = "light"
```

```text
dark True
frozendict({'theme': 'dark', 'font_size': 16}) 14
Traceback (most recent call last):
  ...
TypeError: 'frozendict' object does not support item assignment
```

`|` returns a new `frozendict` and leaves the original alone. Code that checks
`isinstance(x, dict)` does not accept one; check for `collections.abc.Mapping` instead.

## Choosing between them

| You need | Use |
| --- | --- |
| A record with behaviour, mutable or not | `@dataclass` (`frozen=True` for values) |
| A small immutable record that unpacks like a tuple | `typing.NamedTuple` |
| A fixed set of named choices | `Enum`, or `StrEnum`/`IntEnum` to mix with text or numbers |
| Options that combine | `Flag` |
| A read-only or hashable mapping | `frozendict` |

## Common mistakes

- **A mutable default.** `tags: list = []` raises `ValueError`; use
  `field(default_factory=list)`.
- **Expecting type checks.** `Plant(name=42)` is accepted; dataclasses do not validate types.
  Check values in `__post_init__` if they matter.
- **Hashing a mutable dataclass.** `{Plant("fern")}` raises `TypeError` because `__hash__` is
  `None`; use `frozen=True`.
- **Comparing an `Enum` to its value.** `Status.SHIPPED == 2` is `False`; compare members, or
  convert with `Status(2)`.

## Practice

1. Write a frozen dataclass `Ingredient` with `name: str` and `grams: int`, which raises
   `ValueError` in `__post_init__` when `grams` is negative.
2. Write a `StrEnum` `Unit` with members `GRAM` and `LITRE` and show what `Unit.LITRE` prints.
3. Why does `Reading("hall", 19.0) == ("hall", 19.0, True)` give `True`, and how would a frozen
   dataclass behave instead?

### Answers

1. Validation works the same in a frozen class, since it only reads the field:

   ```python
   @dataclass(frozen=True)
   class Ingredient:
       name: str
       grams: int

       def __post_init__(self):
           if self.grams < 0:
               raise ValueError(f"grams cannot be negative, got {self.grams}")
   ```

2. `class Unit(StrEnum)` with `GRAM = auto()` and `LITRE = auto()`; `print(Unit.LITRE)` prints
   `litre`, because a `StrEnum` member is a string and `auto()` used the lower-cased name.
3. A named tuple is a tuple, and tuples compare item by item. A dataclass's `__eq__` returns
   `NotImplemented` for any other class, so the comparison falls back to identity and gives
   `False`.

## Key takeaways

- `@dataclass` generates `__init__`, `__repr__` and `__eq__` from annotated fields.
- Use `field(default_factory=...)` for mutable defaults and `__post_init__` for validation.
- `frozen=True` gives immutability and a hash; `order=True` adds comparisons; `slots=True`
  saves memory.
- Named tuples are lightweight immutable records that are still tuples.
- Enums name a fixed set of values; `frozendict` (3.15) is an immutable, hashable mapping.

## Further reading

- [dataclasses: data classes](https://docs.python.org/3.15/library/dataclasses.html)
- [enum: support for enumerations](https://docs.python.org/3.15/library/enum.html)
- [typing.NamedTuple](https://docs.python.org/3.15/library/typing.html#typing.NamedTuple)
- [PEP 814: add frozendict built-in type](https://peps.python.org/pep-0814/)
