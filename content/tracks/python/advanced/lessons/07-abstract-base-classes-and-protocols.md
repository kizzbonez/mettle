---
title: Abstract Base Classes and Protocols
summary: Define interfaces in Python two ways, by inheritance with `abc.ABC` and `@abstractmethod` and by shape with `typing.Protocol`, use the ready-made interfaces in `collections.abc`, and choose the right tool for a job.
minutes: 35
objectives:
  - Write an abstract base class whose subclasses cannot be created until they implement its abstract methods
  - Implement a `collections.abc` interface and get its mixin methods for free
  - Explain how `isinstance` works with ABCs, registration and `__subclasshook__`
  - Define a `typing.Protocol`, use it with a type checker, and know what `@runtime_checkable` checks
---

## Outline

1. Interfaces and duck typing
2. Abstract base classes
3. The interfaces in `collections.abc`
4. How `isinstance` works with ABCs
5. Protocols: structural typing
6. Choosing between them

## Interfaces and duck typing

Idiomatic Python described **duck typing**: code that calls `thing.close()` works with any object
that has a `close` method, whatever its class. That flexibility has two costs. A class that
forgets a method fails only when the method is called, perhaps in production. And nothing in the
code says which methods are expected. An **interface** is that list of expected methods, written
down. Python offers two ways to write one: abstract base classes, checked through inheritance,
and protocols, checked by shape.

## Abstract base classes

An **abstract base class** (ABC) is a class meant to be subclassed, not used directly. Derive
from `abc.ABC` and mark the methods every subclass must provide with `@abstractmethod`. Python
then refuses to create an instance of any class that still has an abstract method.

```python
from abc import ABC, abstractmethod


class Sensor(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def read(self) -> float:
        """Return the current reading."""

    def report(self) -> str:
        return f"{self.name}: {self.read():.1f}"


class Thermometer(Sensor):
    def read(self) -> float:
        return 21.456


class Hygrometer(Sensor):
    def measure(self) -> float:  # wrong name: read() is still abstract
        return 40.0


print(Thermometer("hall").report())
for cls in (Sensor, Hygrometer):
    try:
        cls("x")
    except TypeError as error:
        print(f"TypeError: {error}")
```

```text
hall: 21.5
TypeError: Can't instantiate abstract class Sensor without an implementation for abstract method 'read'
TypeError: Can't instantiate abstract class Hygrometer without an implementation for abstract method 'read'
```

The mistake in `Hygrometer` is caught when the object is **created**, not later when someone
calls `read`. An ABC can also hold shared, concrete code: `report` works for every sensor
because it relies on the abstract `read`, a pattern called a **template method**. An abstract
method may have a body, which subclasses can reach with `super()`. Combined with `@property`,
`@classmethod` or `@staticmethod`, `@abstractmethod` goes innermost, directly above the `def`.

## The interfaces in `collections.abc`

The standard library defines ABCs for the container protocols of lesson 2: `Iterable`,
`Sized`, `Container`, `Sequence`, `Mapping`, `Set`, their `Mutable...` versions and more. Each
lists a few **abstract methods** and supplies **mixin methods** built on them. A `Mapping` needs
only `__getitem__`, `__iter__` and `__len__`, and provides `__contains__`, `keys`, `items`,
`values`, `get`, `__eq__` and `__ne__`.

```python
from collections.abc import Mapping


class Headers(Mapping):
    """Read-only HTTP headers whose names ignore case."""

    def __init__(self, pairs):
        self._data = {name.lower(): value for name, value in pairs}

    def __getitem__(self, name):
        return self._data[name.lower()]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)


headers = Headers([("Content-Type", "text/html"), ("ETag", "v7")])
print(headers["CONTENT-TYPE"], "etag" in headers, headers.get("Server", "none"))
print(list(headers.items()), headers == {"content-type": "text/html", "etag": "v7"})
print(isinstance(headers, Mapping), isinstance(headers, dict))
```

```text
text/html True none
[('content-type', 'text/html'), ('etag', 'v7')] True
True False
```

Three methods gave a full read-only mapping. `"etag" in headers` came from the mixin
`__contains__`, which calls `__getitem__` and so ignores case too. Subclassing `dict` would not
have worked as well: `dict.get` and `in` do not go through an overridden `__getitem__`.

## How `isinstance` works with ABCs

`isinstance(obj, SomeABC)` is true in three cases, as the `collections.abc` documentation
explains:

1. The class **inherits** from the ABC, like `Headers` above.
2. The class was **registered** as a **virtual subclass** with `SomeABC.register(cls)`. The ABC
   then does not appear in the class's MRO, and its methods are not inherited.
3. The ABC recognises the class by the **presence of methods**, through a class method called
   `__subclasshook__`. The simple ABCs such as `Iterable`, `Sized` and `Hashable` work this way.

```python
from collections.abc import Iterable, Mapping, Sequence


class Countdown:
    def __iter__(self):
        return iter([3, 2, 1])


class OldStyle:
    def __getitem__(self, index):
        if index >= 2:
            raise IndexError(index)
        return index


print(isinstance(Countdown(), Iterable), isinstance(OldStyle(), Iterable), list(OldStyle()))
print(isinstance([], Sequence), isinstance({}, Mapping), isinstance(frozendict(), Mapping))
```

```text
True False [0, 1]
True True True
```

`Countdown` never mentions `Iterable`, yet passes, because it has `__iter__`. `OldStyle` is
iterable through the old `__getitem__` protocol, but `Iterable` does not detect that; the docs
say the reliable test is to call `iter(obj)`. The built-in containers, and the new
`frozendict`, are registered with the matching ABCs, which is why checking for `Mapping` is the
way to accept "any read-only dict-like object".

## Protocols: structural typing

An ABC is **nominal**: a class conforms because it names the ABC as a base, or is registered. A
**protocol** is **structural**: a class conforms if it has the right methods and attributes, with
no inheritance at all. That is duck typing, written down so that a type checker can verify it.
Define one by subclassing `typing.Protocol`:

```python
from typing import Protocol, runtime_checkable


@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...


class Door:
    def close(self) -> None:
        print("door shut")


class Ticket:
    def close(self) -> None:
        print("ticket resolved")


def close_all(things: list[Closable]) -> None:
    for thing in things:
        thing.close()


class Lid:
    close = "not a method"


close_all([Door(), Ticket()])
print(isinstance(Door(), Closable), isinstance("text", Closable), isinstance(Lid(), Closable))
```

```text
door shut
ticket resolved
True False True
```

`Door` and `Ticket` know nothing about `Closable`, yet a type checker accepts them in
`close_all`, and would reject a `str`. The `...` body is the usual way to write a member that
only describes a signature. A protocol cannot be instantiated: `Closable()` raises
`TypeError: Protocols cannot be instantiated`.

By default, protocols exist only for type checkers, and `isinstance` with one raises
`TypeError`. `@runtime_checkable` allows it, but the documentation warns that it checks **only
that the members exist**, not their signatures or types. That is why `Lid`, whose `close` is a
string, passed. Python 3.15 also deprecates `isinstance` checks against a protocol that inherits
from a runtime-checkable one without being marked `@runtime_checkable` itself.

## Choosing between them

- **An ABC** suits a family of classes you design: it enforces the methods at instantiation and
  can share code with its subclasses.
- **A protocol** suits a parameter that should accept anything with the right shape, including
  classes from other libraries that you cannot change. Its checks happen in the type checker.
- **`collections.abc`** already defines the container interfaces; subclass one to get mixins,
  and use them in annotations, as `Iterable[str]` was used in lesson 6.

## Common mistakes

- **Misspelling the method in a subclass.** The ABC still has an abstract `read`, so the class
  cannot be instantiated. That error is the point; rename the method rather than removing
  `@abstractmethod`.
- **Trusting `@runtime_checkable` too much.** `isinstance(obj, Closable)` only means a `close`
  attribute exists. Call it inside `try` if the object comes from outside.
- **`isinstance(x, Iterable)` to test iterability.** It misses `__getitem__` iteration; call
  `iter(x)` and catch `TypeError`.
- **Subclassing `dict` to change lookups.** Its other methods bypass your `__getitem__`; build on
  `collections.abc.Mapping` or `MutableMapping`.

## Practice

1. Write an ABC `Shape` with an abstract `area()` and a concrete `describe()` returning
   `"<ClassName> with area <area>"`, and a `Square` that implements it.
2. Write a protocol `HasLength` that requires `__len__`, and a function `total_length(items:
   list[HasLength]) -> int`.
3. A class defines `__len__`, `__iter__` and `__contains__` but inherits from nothing. Is an
   instance an instance of `collections.abc.Collection`?

### Answers

1. Only the abstract method needs implementing:

   ```python
   class Shape(ABC):
       @abstractmethod
       def area(self) -> float: ...

       def describe(self) -> str:
           return f"{type(self).__name__} with area {self.area()}"


   class Square(Shape):
       def __init__(self, side):
           self.side = side

       def area(self) -> float:
           return self.side**2
   ```

   `Square(3).describe()` returns `'Square with area 9'`.
2. `class HasLength(Protocol): def __len__(self) -> int: ...` and
   `return sum(len(item) for item in items)`. Strings, lists and dicts all conform.
3. Yes. `Collection` recognises classes with all three methods through `__subclasshook__`.

## Key takeaways

- `abc.ABC` and `@abstractmethod` stop incomplete subclasses from being instantiated.
- `collections.abc` classes give mixin methods for a few abstract ones, and serve in `isinstance`
  checks and annotations.
- `isinstance` with an ABC honours inheritance, registration and method presence.
- A `Protocol` is a structural interface checked by type checkers; `@runtime_checkable` checks
  only that members exist.
- Use ABCs for hierarchies you own and protocols for "anything with this shape".

## Further reading

- [abc: abstract base classes](https://docs.python.org/3.15/library/abc.html)
- [collections.abc: abstract base classes for containers](https://docs.python.org/3.15/library/collections.abc.html)
- [typing.Protocol](https://docs.python.org/3.15/library/typing.html#typing.Protocol)
- [Typing specification: protocols](https://typing.python.org/en/latest/spec/protocol.html)
