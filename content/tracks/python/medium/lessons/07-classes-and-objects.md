---
title: Classes and Objects
summary: Define your own types with `class`, build instances with `__init__` and `self`, tell instance attributes from class attributes, write methods, give objects readable `__str__` and `__repr__`, see how default equality works, and inspect objects with `hasattr`, `getattr`, `type` and `__dict__`.
minutes: 40
objectives:
  - Define a class with `__init__` and methods, create instances and call their methods
  - Distinguish instance attributes from class attributes and avoid a shared mutable class attribute
  - Write `__str__` and `__repr__` and say which one `print`, `repr` and containers use
  - Predict `==` and `is` for two instances of a class that does not define equality
  - Inspect objects and classes with `__dict__`, `hasattr`, `getattr`, `setattr`, `type`, `__name__` and `__module__`
---

## Outline

1. Why classes
2. Defining a class: `__init__` and `self`
3. Methods
4. Instance attributes and class attributes
5. `__str__` and `__repr__`
6. Equality and identity
7. Looking inside objects

## Why classes

Every value in Python is an **object**, and every object has a **type**, also called its **class**: `5` is an `int`, `"fern"` a `str`. The type decides what data the object holds and what you can do with it. A **class** statement defines a new type of your own. Its **instances**, the objects made from it, bundle related data, called **attributes**, with the functions that work on that data, called **methods**. Instead of a dictionary for each house plant and loose functions that take it, you write a `Plant` class whose instances know how to look after themselves. This way of organising code is **object-oriented programming**.

## Defining a class: `__init__` and `self`

```python
class Plant:
    """A house plant and how often it needs water."""

    kind = "house plant"

    def __init__(self, name, every_days):
        self.name = name
        self.every_days = every_days
        self.last_watered = 0

    def water(self, day):
        self.last_watered = day

    def needs_water(self, today):
        return today - self.last_watered >= self.every_days


fern = Plant("fern", 3)
cactus = Plant("cactus", 14)
fern.water(5)
print(fern.name, fern.last_watered, cactus.last_watered)
print(fern.needs_water(7), fern.needs_water(8), cactus.needs_water(8))
print(Plant.needs_water(fern, 8))
print(fern.kind, Plant.kind, type(fern))
print(fern)
```

```text
fern 5 0
False True False
True
house plant house plant <class '__main__.Plant'>
<__main__.Plant object at 0x73a06005c830>
```

Class names use `CapWords` (PEP 8). Calling the class, `Plant("fern", 3)`, **constructs** an instance: Python creates an empty object, then calls the special method `__init__` on it with your arguments. `__init__` is the **initializer**, often called the constructor. It returns nothing; its job is to set the starting attributes.

The first parameter of every method receives the instance itself. It is called `self` by a strong convention, not by a keyword. `self.name = name` creates an attribute `name` on this particular object; attributes need no declaration, they appear when first assigned. `fern` and `cactus` each have their own `name`, `every_days` and `last_watered`.

The last line shows what `print` gives for an object whose class says nothing about how to print it: its class and its memory address, which differs on every run. We fix that below.

## Methods

A **method** is a function defined in the class body. `fern.water(5)` looks up `water` on the class and calls it with `fern` as `self`: it is exactly `Plant.water(fern, 5)`, as `Plant.needs_water(fern, 8)` shows. So a method with `n` parameters after `self` is called with `n` arguments. Methods reach the object's data, and its other methods, through `self`: `self.every_days`, `self.water(...)`. A bare `every_days` inside a method is a NameError, because attributes are not variables.

## Instance attributes and class attributes

An assignment in the class body, like `kind = "house plant"`, creates a **class attribute**: one value stored on the class and shared by all instances. Looking up `fern.kind` checks the instance first, then its class. Each object's instance attributes live in a dictionary, `__dict__`:

```python
class Plant:
    planted = 0
    notes = []

    def __init__(self, name):
        self.name = name
        Plant.planted += 1

    def add_note(self, text):
        self.notes.append(text)


fern = Plant("fern")
ivy = Plant("ivy")
fern.add_note("repot in spring")
print(Plant.planted, ivy.notes)
fern.planted = 99
print(fern.planted, ivy.planted, Plant.planted)
print(fern.__dict__)
print([name for name in Plant.__dict__ if not name.startswith("__")])
```

```text
2 ['repot in spring']
99 2 2
{'name': 'fern', 'planted': 99}
['planted', 'notes', 'add_note']
```

- `Plant.planted += 1` updates the class attribute through the class name, so it counts every plant created. Writing `self.planted += 1` would instead create an instance attribute on each object.
- `notes = []` is a mistake: one list shared by every plant, so a note added to the fern shows up on the ivy. Create mutable attributes in `__init__`: `self.notes = []`.
- Assigning `fern.planted = 99` does not change the class. It creates an instance attribute that **shadows** the class attribute for `fern` only.
- The class has a `__dict__` too, holding its class attributes and methods.

Use class attributes for constants and data that truly belong to the class; use instance attributes for everything that describes one object.

## `__str__` and `__repr__`

Python calls two special methods to turn an object into text. Names with two leading and two trailing underscores are such hooks, called **special** or "dunder" methods:

```python
class Plant:
    def __init__(self, name, every_days):
        self.name = name
        self.every_days = every_days

    def __repr__(self):
        return f"Plant({self.name!r}, {self.every_days!r})"

    def __str__(self):
        return f"{self.name}, water every {self.every_days} days"


fern = Plant("fern", 3)
print(fern)
print(repr(fern))
print([fern, Plant("ivy", 7)])
print(f"{fern} | {fern!r}")
```

```text
fern, water every 3 days
Plant('fern', 3)
[Plant('fern', 3), Plant('ivy', 7)]
fern, water every 3 days | Plant('fern', 3)
```

- `__str__` is the readable text for users: `print`, `str()` and f-strings use it.
- `__repr__` is the precise text for developers: `repr()`, the interactive shell, `!r`, and the items inside a printed list use it. Make it look like the expression that would rebuild the object, if possible.
- If you write only one, write `__repr__`: `str()` falls back to it.

## Equality and identity

```python
first = Plant("fern", 3)
second = Plant("fern", 3)
same = first
print(first == second, first is second, first == same, first is same)
```

```text
False False True True
```

`is` asks whether two names refer to the **same object**. `==` asks whether two objects are **equal**, and a class that does not define equality falls back to identity. So two plants with identical attributes are not equal. `first` and `same` are two names for one object. Lesson 2 of the advanced level teaches `__eq__` to define your own equality.

## Looking inside objects

Python lets a program examine objects while it runs, which is called **introspection**:

```python
fern = Plant("fern", 3)
print(hasattr(fern, "name"), hasattr(Plant, "name"), hasattr(Plant, "__repr__"))
print(getattr(fern, "every_days"), getattr(fern, "colour", "unknown"))
setattr(fern, "colour", "green")
print(fern.colour, fern.__dict__)
print(type(fern) is Plant, isinstance(fern, Plant), type(fern).__name__, Plant.__module__)
```

```text
True False True
3 unknown
green {'name': 'fern', 'every_days': 3, 'colour': 'green'}
True True Plant __main__
```

- `hasattr(obj, "name")` tells whether the attribute exists. Instance attributes belong to the object, not the class, so `hasattr(Plant, "name")` is `False`, while methods and class attributes are found on both.
- `getattr(obj, "name", default)` reads an attribute whose name is in a string; without the default, a missing attribute raises `AttributeError: 'Plant' object has no attribute 'colour'`. `setattr` assigns one.
- `type(obj)` returns the class; `isinstance(obj, Plant)` also accepts subclasses (lesson 9). A class knows its `__name__` and its `__module__`, the module it was defined in: `__main__` for the script you ran.

## Common mistakes

- **Forgetting `self` in a method definition**: `def water(day):` then `fern.water(3)` raises `TypeError: Plant.water() takes 1 positional argument but 2 were given`, because the instance was passed too.
- **Assigning a local variable instead of an attribute**: `litres = litres` in `__init__` stores nothing. Write `self.litres = litres`.
- **A mutable class attribute** used as per-object data. Create it in `__init__`.
- **Expecting `==` to compare attributes.** Without `__eq__`, it compares identity.

## Practice

1. Write a class `Timer` for a kitchen timer: `Timer("eggs", 300)` stores a label and the seconds remaining; `tick(seconds=1)` counts down but never below 0; `is_done()` says whether it reached 0.
2. Give `Timer` a `__str__` showing `eggs: 3:45` and a `__repr__` showing `Timer('eggs', 225)`.
3. Count the timers created in a class attribute `made`.

### Answers

```python
class Timer:
    """A kitchen timer that counts down whole seconds."""

    made = 0

    def __init__(self, label, seconds):
        self.label = label
        self.remaining = seconds
        Timer.made += 1

    def tick(self, seconds=1):
        self.remaining = max(0, self.remaining - seconds)

    def is_done(self):
        return self.remaining == 0

    def __repr__(self):
        return f"Timer({self.label!r}, {self.remaining!r})"

    def __str__(self):
        minutes, seconds = divmod(self.remaining, 60)
        return f"{self.label}: {minutes}:{seconds:02d}"


eggs = Timer("eggs", 300)
pasta = Timer("pasta", 540)
eggs.tick(75)
print(eggs, repr(pasta), Timer.made)
eggs.tick(500)
print(eggs.is_done(), eggs)
```

```text
eggs: 3:45 Timer('pasta', 540) 2
True eggs: 0:00
```

`divmod(225, 60)` returns `(3, 45)`, and `:02d` pads the seconds to two digits.

## Key takeaways

- A class defines a type; calling it creates an instance and runs `__init__` with `self` set to the new object.
- Instance attributes are per object, in its `__dict__`; class attributes are shared and are found through instances too.
- `obj.method(args)` means `Class.method(obj, args)`.
- `__str__` is for users, `__repr__` for developers; `str` falls back to `__repr__`.
- Without `__eq__`, `==` is identity. `hasattr`, `getattr`, `setattr`, `type` and `isinstance` inspect objects at run time.

## Further reading

- [The Python Tutorial: Classes](https://docs.python.org/3.15/tutorial/classes.html)
- [Data model: Basic customization (`__repr__`, `__str__`)](https://docs.python.org/3.15/reference/datamodel.html#basic-customization)
- [Built-in functions: getattr, hasattr, setattr](https://docs.python.org/3.15/library/functions.html#getattr)
