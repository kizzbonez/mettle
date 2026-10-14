---
title: Attribute Access, Descriptors and Slots
summary: Follow what Python does on `obj.attr`, customise it with `__getattr__`, `__getattribute__` and `__setattr__`, write reusable descriptors, save memory with `__slots__`, hook subclass creation with `__init_subclass__`, and take a first look at metaclasses.
minutes: 40
objectives:
  - Describe the order in which Python looks for an attribute on an instance
  - Use `__getattr__` for missing attributes and `__setattr__` to control assignment without infinite recursion
  - Write a data descriptor with `__get__`, `__set__` and `__set_name__`, and explain why properties and methods are descriptors
  - Use `__slots__` and `__init_subclass__`, and explain what a metaclass is
---

## Outline

1. How attribute lookup works
2. `__getattr__` and `__getattribute__`
3. `__setattr__`
4. Descriptors
5. `__slots__`
6. `__init_subclass__`
7. A first look at metaclasses

## How attribute lookup works

Each instance stores its own attributes in a dictionary, `obj.__dict__`, and the class has one
too. Reading `obj.attr` does not simply look in the instance's dictionary. The descriptor HOWTO
in the official docs gives the full order:

1. **data descriptors** found on the class (explained below; `property` is one),
2. the **instance's `__dict__`**,
3. **non-data descriptors** and other **class attributes** (methods live here),
4. finally, if all of those fail, the class's **`__getattr__`**, if it defines one.

Assignment, `obj.attr = value`, writes to the instance's `__dict__` unless a data descriptor
intercepts it.

```python
class Config:
    theme = "light"


config = Config()
print(config.theme, config.__dict__)
config.theme = "dark"
print(config.theme, config.__dict__, Config.theme)
del config.theme
print(config.theme)
```

```text
light {}
dark {'theme': 'dark'} light
light
```

The first read found nothing in the instance and fell through to the class. Assigning created an
instance attribute that **shadows** the class attribute without changing it. Deleting it made
the class value visible again.

## `__getattr__` and `__getattribute__`

`__getattr__(self, name)` is called **only when normal lookup fails**. It suits fallbacks,
defaults and objects that forward calls to another object. It must return a value or raise
`AttributeError`.

```python
class Settings:
    defaults = {"theme": "light", "font_size": 14}

    def __init__(self, **chosen):
        self.chosen = chosen

    def __getattr__(self, name):
        print(f"__getattr__({name!r})")
        if name in self.chosen:
            return self.chosen[name]
        if name in self.defaults:
            return self.defaults[name]
        raise AttributeError(f"no setting named {name!r}")


settings = Settings(font_size=16)
print(settings.font_size, settings.theme)
print(settings.chosen)
settings.colour
```

```text
__getattr__('font_size')
__getattr__('theme')
16 light
{'font_size': 16}
__getattr__('colour')
Traceback (most recent call last):
  ...
AttributeError: no setting named 'colour'
```

`settings.chosen` was found in the instance dictionary, so `__getattr__` was not called.
Raising `AttributeError`, not `KeyError`, keeps `hasattr` and `getattr(obj, name, default)`
working.

`__getattribute__(self, name)` is the method that performs the whole lookup, for **every**
attribute. Overriding it is rarely needed and easy to get wrong: any `self.x` inside it calls it
again. When you must, call `super().__getattribute__(name)` for the normal behaviour.

## `__setattr__`

`__setattr__(self, name, value)` runs on **every** assignment, including those in `__init__`.
Inside it, `self.name = value` would call `__setattr__` again, forever, until
`RecursionError: maximum recursion depth exceeded`. Store values with
`object.__setattr__(self, name, value)` or `super().__setattr__(name, value)` instead.

```python
class ReadOnlyPoint:
    def __init__(self, x, y):
        object.__setattr__(self, "x", x)
        object.__setattr__(self, "y", y)

    def __setattr__(self, name, value):
        raise AttributeError(f"{type(self).__name__} is read-only")


point = ReadOnlyPoint(3, 4)
print(point.x + point.y)
point.x = 10
```

```text
7
Traceback (most recent call last):
  ...
AttributeError: ReadOnlyPoint is read-only
```

This is how `@dataclass(frozen=True)` works: it generates a `__setattr__` that raises
`FrozenInstanceError`, and its `__init__` uses `object.__setattr__`.

## Descriptors

A **descriptor** is an object, stored as a **class attribute**, that defines `__get__`,
`__set__` or `__delete__`. When you access that attribute through an instance, Python calls the
descriptor's method instead of returning the object. One with `__set__` or `__delete__` is a
**data descriptor** and wins over the instance dictionary; one with only `__get__` is a
**non-data descriptor**, which the instance dictionary can shadow.

`__set_name__(self, owner, name)` is called once when the owning class is created, telling the
descriptor the name it was assigned to. That makes one validator reusable for many fields:

```python
class Positive:
    """A data descriptor that only accepts numbers above zero."""

    def __set_name__(self, owner, name):
        self.name = name
        self.private = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)) or value <= 0:
            raise ValueError(f"{self.name} must be a positive number, got {value!r}")
        setattr(obj, self.private, value)


class Parcel:
    weight = Positive()
    length = Positive()

    def __init__(self, weight, length):
        self.weight = weight
        self.length = length


box = Parcel(2.5, 40)
print(box.weight, box.length, vars(box))
print(type(Parcel.weight).__name__, Parcel.weight.name)
box.weight = -1
```

```text
2.5 40 {'_weight': 2.5, '_length': 40}
Positive weight
Traceback (most recent call last):
  ...
ValueError: weight must be a positive number, got -1
```

`self.weight = weight` in `__init__` went through `Positive.__set__`, so the constructor
validates too. The value lives in the instance under `_weight`. Accessed on the class, `obj` is
`None` and the descriptor returns itself.

You have used descriptors all along. `property` is a data descriptor, which is why an instance
cannot override a property. Every **function** is a non-data descriptor: its `__get__` returns a
**bound method** that supplies `self`. `classmethod`, `staticmethod` and
`functools.cached_property` are descriptors too.

## `__slots__`

Normally every instance carries a `__dict__`. A class that lists its attributes in
`__slots__` stores them in a fixed array instead, which saves memory (the HOWTO measures 48
bytes against 152 for two attributes on 64-bit Linux) and makes reads faster. Each slot becomes a
descriptor on the class.

```python
class Pixel:
    __slots__ = ("x", "y", "colour")

    def __init__(self, x, y, colour):
        self.x, self.y, self.colour = x, y, colour


pixel = Pixel(1, 2, "red")
print(pixel.colour, hasattr(pixel, "__dict__"), type(Pixel.x).__name__)
pixel.color = "blue"
```

```text
red False member_descriptor
Traceback (most recent call last):
  ...
AttributeError: 'Pixel' object has no attribute 'color' and no __dict__ for setting new attributes. Did you mean '.colour' instead of '.color'?
```

The misspelt `color` is caught immediately, and the traceback even suggests the slot you meant. The costs: no new attributes, no class-level
defaults for slot names (`ValueError: 'x' in __slots__ conflicts with class variable`), and no
`cached_property`. Use slots for classes with many instances, or simply `@dataclass(slots=True)`.

## `__init_subclass__`

When a class is subclassed, Python calls the parent's `__init_subclass__` class method with the
new class. Keyword arguments in the class statement are passed to it. It is a simple way to
register or check subclasses without decorators:

```python
class Command:
    registry = {}

    def __init_subclass__(cls, /, name, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.name = name
        Command.registry[name] = cls


class Start(Command, name="start"):
    pass


class Stop(Command, name="stop"):
    pass


print({name: cls.__name__ for name, cls in Command.registry.items()}, Stop.name)
```

```text
{'start': 'Start', 'stop': 'Stop'} stop
```

A subclass without `name=` fails at definition time with
`TypeError: Command.__init_subclass__() missing 1 required positional argument: 'name'`.

## A first look at metaclasses

Classes are objects too, and their type is **`type`**: `type(Command)` is `<class 'type'>`. A
class statement runs its body, collects the names into a namespace, and calls
`type(name, bases, namespace)`. A **metaclass** is a subclass of `type` that changes that step,
chosen with `metaclass=` and inherited by subclasses:

```python
class Documented(type):
    def __new__(mcls, name, bases, namespace):
        if "__doc__" not in namespace:
            raise TypeError(f"class {name} needs a docstring")
        return super().__new__(mcls, name, bases, namespace)


class Job(metaclass=Documented):
    """A unit of work."""


class Untitled(Job):
    pass
```

```text
Traceback (most recent call last):
  ...
TypeError: class Untitled needs a docstring
```

Metaclasses are powerful and rarely needed. Class decorators and `__init_subclass__` cover most
uses with far less magic; reach for a metaclass only when those cannot do the job.

## Common mistakes

- **`self.x = value` inside `__setattr__`.** It recurses until `RecursionError`; use
  `super().__setattr__`.
- **Raising `KeyError` from `__getattr__`.** `hasattr` and `getattr(obj, name, default)` expect
  `AttributeError`.
- **Storing descriptor data on the descriptor.** A descriptor is shared by every instance of the
  class; keep per-instance values in the instance, as `Positive` does.
- **Adding `__slots__` and expecting `__dict__` features.** New attributes and `cached_property`
  stop working.

## Practice

1. Without running it: after `config.theme = "dark"`, what does `Config().theme` give?
2. Write a descriptor `Lowercase` that stores a string in lower case.
3. Make every subclass of `Plugin` record itself in `Plugin.loaded` (a list), in definition order.

### Answers

1. `'light'`. The assignment created an attribute on that one instance; the class attribute is
   unchanged.
2. Reuse the pattern of `Positive`:

   ```python
   class Lowercase:
       def __set_name__(self, owner, name):
           self.private = "_" + name

       def __get__(self, obj, objtype=None):
           return self if obj is None else getattr(obj, self.private)

       def __set__(self, obj, value):
           setattr(obj, self.private, value.lower())
   ```

3. Append in `__init_subclass__`:

   ```python
   class Plugin:
       loaded = []

       def __init_subclass__(cls, **kwargs):
           super().__init_subclass__(**kwargs)
           Plugin.loaded.append(cls)
   ```

## Key takeaways

- Lookup order: data descriptors, the instance `__dict__`, non-data descriptors and class
  attributes, then `__getattr__`.
- `__getattr__` handles missing attributes; `__setattr__` sees every assignment.
- Descriptors power properties, methods and slots; `__set_name__` makes them reusable.
- `__slots__` saves memory and catches typos at the cost of flexibility.
- `__init_subclass__` and class decorators usually beat a metaclass.

## Further reading

- [Descriptor HowTo Guide](https://docs.python.org/3.15/howto/descriptor.html)
- [Data model: customizing attribute access](https://docs.python.org/3.15/reference/datamodel.html#customizing-attribute-access)
- [Data model: metaclasses](https://docs.python.org/3.15/reference/datamodel.html#metaclasses)
