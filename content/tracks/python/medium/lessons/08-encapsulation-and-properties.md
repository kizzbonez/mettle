---
title: Encapsulation and Properties
summary: Keep an object's internals behind a clear interface. Mark names as internal with an underscore, see what name mangling with two underscores really does, validate assignments with `@property` setters, offer read-only and computed attributes, and add alternative constructors with `@classmethod` and helpers with `@staticmethod`.
minutes: 35
objectives:
  - Explain Python's naming conventions for internal attributes and what name mangling does
  - Write a property with a setter that validates, and a read-only computed property
  - Write alternative constructors with `@classmethod` and explain what `cls` receives
  - Choose between an instance method, a class method and a static method
---

## Outline

1. Encapsulation in Python
2. Internal names: one underscore
3. Name mangling: two underscores
4. Properties
5. Read-only and computed properties
6. `@classmethod`: alternative constructors
7. `@staticmethod`
8. Which kind of method?

## Encapsulation in Python

**Encapsulation** means an object keeps its data consistent by controlling how it is read and changed, and offers the rest of the program a small, stable **interface**: the attributes and methods others are meant to use. Then the inside can change without breaking the code outside.

Languages such as Java and C# enforce this with `private` fields. Python has no such keyword. Every attribute can be reached, and the language relies on **conventions** that everyone follows, plus a tool, properties, that lets a plain-looking attribute run code.

## Internal names: one underscore

A name that starts with one underscore, such as `self._attempts`, means "internal: not part of the interface, may change without notice". Nothing stops access, but tools and readers treat it as private. You met the module version in lesson 1: `from module import *` skips such names.

## Name mangling: two underscores

A name inside a class that starts with **two** underscores and does not end with two is rewritten by the compiler: `__code` in class `SmartLock` becomes `_SmartLock__code`. This is **name mangling**:

```python
class SmartLock:
    def __init__(self, code):
        self._attempts = 0
        self.__code = code

    def unlock(self, code):
        self._attempts += 1
        return code == self.__code


lock = SmartLock("4821")
print(lock.unlock("1111"), lock.unlock("4821"), lock._attempts)
print(lock.__dict__)
print(lock._SmartLock__code)
lock.__code
```

```text
False True 2
{'_attempts': 2, '_SmartLock__code': '4821'}
4821
Traceback (most recent call last):
  File "/tmp/a.py", line 15, in <module>
    lock.__code
AttributeError: 'SmartLock' object has no attribute '__code'
```

Inside the class, `self.__code` works because it is mangled there too. Outside, `lock.__code` is not mangled and finds nothing, yet `lock._SmartLock__code` reads the value. So mangling is not security. It exists to stop a **subclass** (lesson 9) from overwriting a parent's attribute by accident, since each class gets its own prefix. It applies to methods and class attributes too, and never to dunder names like `__init__`. Prefer one underscore, and use two only when you expect subclasses that might clash.

## Properties

Suppose a thermostat must never be set outside 5 to 30 degrees. With a plain attribute, any code can write `hall.target = 45`. A **property** keeps the attribute syntax but runs a method on every read and write:

```python
class Thermostat:
    """Holds one room at a target temperature in degrees Celsius."""

    LOWEST, HIGHEST = 5.0, 30.0

    def __init__(self, room, target):
        self.room = room
        self.target = target

    @property
    def target(self):
        """The temperature to hold, in degrees Celsius."""
        return self._target

    @target.setter
    def target(self, value):
        if not self.LOWEST <= value <= self.HIGHEST:
            raise ValueError(f"target must be {self.LOWEST} to {self.HIGHEST}, not {value}")
        self._target = float(value)

    @property
    def target_f(self):
        return self._target * 9 / 5 + 32


hall = Thermostat("hall", 19)
print(hall.target, hall.target_f)
hall.target = 21.5
print(hall.target, hall.__dict__)
try:
    hall.target = 45
except ValueError as error:
    print(error)
hall.target_f = 70
```

```text
19.0 66.2
21.5 {'room': 'hall', '_target': 21.5}
target must be 5.0 to 30.0, not 45
Traceback (most recent call last):
  File "/tmp/c.py", line 34, in <module>
    hall.target_f = 70
    ^^^^^^^^^^^^^
AttributeError: property 'target_f' of 'Thermostat' object has no setter
```

How it works:

- `@property` above `def target(self)` turns the method into the **getter**: reading `hall.target` calls it, without parentheses.
- `@target.setter` above a second method **of the same name** adds the **setter**: `hall.target = 21.5` calls it with `value=21.5`. It validates, then stores the real value in the internal attribute `_target`. The rejected 45 never reaches it.
- `__init__` assigns `self.target`, not `self._target`, so even the first value is validated: `Thermostat("attic", 2)` raises the same ValueError.
- The getter must return `self._target`. Writing `return self.target` inside it calls the getter again, forever, until `RecursionError: maximum recursion depth exceeded`.

The `@` lines are **decorators**: `@property` applied to a function replaces it with a property object built from it. The advanced level shows how to write your own.

Properties let you start with a plain attribute and add validation later without changing a single caller, which is why Python code does not write `get_target()` and `set_target()` methods.

## Read-only and computed properties

A property without a setter is **read-only**: `target_f` above can be read, and assigning it raises AttributeError. It is also **computed**: nothing is stored, and the value is worked out from `_target` on each read, so it can never be out of date. Use a computed property for values derived from other attributes, as long as the calculation is cheap.

## `@classmethod`: alternative constructors

A **class method** receives the class itself as its first argument, named `cls` by convention, instead of an instance. Its main use is an **alternative constructor**: another way to create an instance. Add these methods to the class body:

```python
    @classmethod
    def from_fahrenheit(cls, room, fahrenheit):
        return cls(room, cls.f_to_c(fahrenheit))

    @classmethod
    def from_setting(cls, text):
        room, _, value = text.partition("=")
        return cls(room.strip(), float(value))

    @staticmethod
    def f_to_c(fahrenheit):
        return round((fahrenheit - 32) * 5 / 9, 1)
```

and use them:

```python
study = Thermostat.from_fahrenheit("study", 68)
kitchen = Thermostat.from_setting("kitchen = 20.5")
print(study.room, study.target, kitchen.room, kitchen.target)
print(Thermostat.f_to_c(212), study.f_to_c(50))
```

```text
study 20.0 kitchen 20.5
100.0 10.0
```

`cls(...)` calls the class, so the normal `__init__` and its validation still run: `Thermostat.from_setting("attic = 2")` raises `ValueError: target must be 5.0 to 30.0, not 2.0`. Write `cls(...)`, not `Thermostat(...)`: when a subclass calls the method, `cls` is that subclass, and the method builds the right type. The standard library uses this pattern widely, for example `dict.fromkeys` and `datetime.date.fromisoformat`.

## `@staticmethod`

A **static method** receives neither the instance nor the class. It is a plain function placed in the class because it belongs with it, like `f_to_c`. It can be called on the class or on an instance, and needs no `self`.

## Which kind of method?

| The method needs | Use |
| --- | --- |
| this object's data | an instance method (`self`) |
| the class, for example to create an instance | `@classmethod` (`cls`) |
| neither | `@staticmethod`, or a module-level function |

## Common mistakes

- **Recursion in a property**: `return self.target` inside the `target` getter. Store the value under another name, such as `_target`.
- **Giving the setter a different name.** `@target.setter` on `def set_target` creates a second property `set_target`, and `target` stays read-only.
- **Assigning `self._target` in `__init__`**, which skips the validation.
- **Thinking two underscores make data secret.** They prevent clashes, not access.
- **Writing `Thermostat(...)` in a class method.** Use `cls(...)` so subclasses work.

## Practice

1. Write a `Rectangle` whose `width` and `height` properties reject values of 0 or less with ValueError, and a read-only `area`.
2. Add class methods `square(side)` and `parse("0.9x2.1")`, and a static method `is_valid_side(value)`.

### Answers

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError(f"width must be positive, not {value}")
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError(f"height must be positive, not {value}")
        self._height = value

    @property
    def area(self):
        return self.width * self.height

    @classmethod
    def square(cls, side):
        return cls(side, side)

    @classmethod
    def parse(cls, text):
        width, _, height = text.partition("x")
        return cls(float(width), float(height))

    @staticmethod
    def is_valid_side(value):
        return value > 0


tile = Rectangle.square(3)
door = Rectangle.parse("0.9x2.1")
print(tile.area, round(door.area, 2), Rectangle.is_valid_side(-1))
```

```text
9 1.89 False
```

`tile.width = 0` raises ValueError and `tile.area = 10` raises AttributeError, because `area` has no setter.

## Key takeaways

- `_name` marks an internal attribute by convention; `__name` is mangled to `_Class__name` to avoid clashes, not to hide it.
- `@property` makes a method run on attribute access; `@name.setter` validates assignments.
- A property without a setter is read-only, and can compute its value from other attributes.
- `@classmethod` receives `cls` and suits alternative constructors; `@staticmethod` receives nothing extra.

## Further reading

- [Built-in functions: property](https://docs.python.org/3.15/library/functions.html#property)
- [Built-in functions: classmethod and staticmethod](https://docs.python.org/3.15/library/functions.html#classmethod)
- [The Python Tutorial: Private variables](https://docs.python.org/3.15/tutorial/classes.html#private-variables)
