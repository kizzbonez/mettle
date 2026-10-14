---
title: Inheritance and Polymorphism
summary: Build classes on other classes, override and extend their methods with `super()`, test relationships with `isinstance` and `issubclass`, write code that works with any object that has the right methods, and understand multiple inheritance, the method resolution order, the diamond and mixins.
minutes: 40
objectives:
  - Define a subclass that overrides methods and extends `__init__` and other methods with `super()`
  - Use `isinstance`, `issubclass`, `type(...) is` and `__bases__` to examine a class hierarchy
  - Write polymorphic code and explain duck typing
  - Predict the method resolution order of a class with several bases, including a diamond
  - Add a capability to unrelated classes with a mixin
---

## Outline

1. Subclasses
2. Overriding and `super()`
3. Examining the hierarchy
4. Polymorphism and duck typing
5. Multiple inheritance and the method resolution order
6. The diamond and cooperative `super()`
7. Mixins

## Subclasses

**Inheritance** lets a new class start from an existing one. The new class is a **subclass** (also derived class or child); the one it builds on is its **superclass** (base class or parent). The subclass gets every attribute and method of its superclass and adds or changes what it needs. Use it when the new class really **is a** kind of the old one: a light is a device.

Here is a small smart-home model. `Device` holds what every device has; `Light` and `Heater` are subclasses, named in parentheses after the class name:

```python
class Device:
    def __init__(self, name):
        self.name = name
        self.on = False

    def switch(self, on):
        self.on = on

    def status(self):
        return f"{self.name}: {'on' if self.on else 'off'}"

    def __str__(self):
        return f"{type(self).__name__} {self.status()}"


class Light(Device):
    def __init__(self, name, brightness=100):
        super().__init__(name)
        self.brightness = brightness

    def status(self):
        if not self.on:
            return super().status()
        return f"{super().status()} at {self.brightness}%"


class Heater(Device):
    def __init__(self, name, target):
        super().__init__(name)
        self.target = target

    def status(self):
        return f"{super().status()}, holding {self.target} C"


lamp = Light("desk lamp", 60)
lamp.switch(True)
radiator = Heater("radiator", 19)
for device in [lamp, radiator, Device("router")]:
    print(device)
```

```text
Light desk lamp: on at 60%
Heater radiator: off, holding 19 C
Device router: off
```

`Light` defines no `switch` and no `__str__`, yet `lamp.switch(True)` and `print(lamp)` work: attribute lookup searches the instance, then its class, then the superclass, and so on up. A class with no parentheses inherits from `object`, the root of every class, which provides the defaults you met in lesson 7.

## Overriding and `super()`

A subclass **overrides** a method by defining one with the same name; lookup finds the subclass's version first. All Python methods can be overridden.

Often you want to **extend** the parent's method rather than replace it. `super()` returns a proxy that looks up methods starting **after** the current class, so `super().status()` runs `Device.status` with the same `self`. `Light.status` adds the brightness to what `Device.status` returns.

The most important case is `__init__`. `Light.__init__` must call `super().__init__(name)`, or the attributes `Device` sets are never created. Look at `Device.__str__` too: it calls `self.status()`, and because `self` is a `Light`, that runs `Light.status`. A method in a parent class calls the child's override; this is what makes the next sections work.

## Examining the hierarchy

These lines continue the program:

```python
print(isinstance(lamp, Light), isinstance(lamp, Device), isinstance(lamp, Heater))
print(isinstance(lamp, (Heater, Light)), issubclass(Light, Device), issubclass(Device, Light))
print(Light.__bases__, Device.__bases__)
print(type(lamp) is Light, type(lamp) is not Device)
```

```text
True True False
True True False
(<class '__main__.Device'>,) (<class 'object'>,)
True True
```

- `isinstance(obj, cls)` is true for the class and every superclass: a light **is a** device. It accepts a tuple of classes, meaning any of them.
- `issubclass(sub, cls)` asks the same about classes. A class counts as a subclass of itself.
- `__bases__` is the tuple of direct superclasses.
- `type(lamp) is Light` checks the exact class and ignores inheritance. Prefer `isinstance`, so that subclasses are accepted.

## Polymorphism and duck typing

**Polymorphism** means one piece of code works with objects of different classes, each responding in its own way. `report` below calls `status()` without knowing which kind of object it has:

```python
class Doorbell:
    def status(self):
        return "doorbell: ready"


def report(things):
    for thing in things:
        print(thing.status())


report([lamp, radiator, Doorbell()])
```

```text
desk lamp: on at 60%
radiator: off, holding 19 C
doorbell: ready
```

`Doorbell` is not a `Device` at all, and `report` does not care. Python never checks an object's class before calling a method; it only looks the method up when the call happens. "If it walks like a duck and quacks like a duck, it is a duck": this is **duck typing**. What matters is that the object has the methods you use. Passing something without them fails at the call, with `AttributeError: 'int' object has no attribute 'status'`. Duck typing is why `for` loops over lists, strings, files and dictionaries alike: each provides what `for` needs.

## Multiple inheritance and the method resolution order

A class may have several superclasses: `class Sensor(Wireless, Battery)`. Lookup then follows the class's **method resolution order** (MRO), a list of the class and all its ancestors in which each class appears once, every class comes before its parents, and parents keep the left-to-right order of the `class` line. It is stored in `__mro__`:

```python
class Device:
    def features(self):
        return ["device"]


class Wireless(Device):
    def features(self):
        return super().features() + ["wireless"]


class Battery(Device):
    def features(self):
        return super().features() + ["battery"]


class Sensor(Wireless, Battery):
    def features(self):
        return super().features() + ["sensor"]


print(Sensor().features())
print([cls.__name__ for cls in Sensor.__mro__])
```

```text
['device', 'battery', 'wireless', 'sensor']
['Sensor', 'Wireless', 'Battery', 'Device', 'object']
```

## The diamond and cooperative `super()`

`Wireless` and `Battery` both inherit from `Device`, and `Sensor` inherits from both: drawn out, the classes form a diamond. The **diamond problem** asks whether `Device` should run twice, once per path. Python's answer is the MRO: `Device` appears once, after both of its subclasses.

The surprise is that `super()` means "the next class in the MRO of this object", not "my parent". In `Wireless.features`, called on a `Sensor`, `super()` is `Battery`, a class `Wireless` knows nothing about. Each method calls `super()` once, so all four run, each exactly once, and the results are added on the way back: hence `device, battery, wireless, sensor`. This is **cooperative** multiple inheritance, and it only works when every class in the chain calls `super()` and the methods share a signature.

Some orders are impossible: `class C(A, B)` where `B` is a subclass of `A` raises `TypeError: Cannot create a consistent method resolution order (MRO) for bases A, B`, because `A` would have to come both before and after `B`.

## Mixins

A **mixin** is a small class that adds one capability and is meant to be combined with others, never used alone. This one gives any class a useful `__repr__` built from its attributes. `vars(obj)` returns `obj.__dict__`:

```python
class ReprMixin:
    def __repr__(self):
        fields = ", ".join(f"{key}={value!r}" for key, value in vars(self).items())
        return f"{type(self).__name__}({fields})"


class Fan(ReprMixin, Device):
    def __init__(self, name, speed):
        super().__init__(name)
        self.speed = speed


fan = Fan("ceiling fan", 2)
print(repr(fan))
print(fan)
print([cls.__name__ for cls in Fan.__mro__])
```

```text
Fan(name='ceiling fan', on=False, speed=2)
Fan ceiling fan: off
['Fan', 'ReprMixin', 'Device', 'object']
```

(This uses the first `Device`, with `status`.) Mixins go first in the list of bases, so their methods come first in the MRO. Keep them small, without `__init__`, and name them `...Mixin`. When something only *has* another object rather than *is* one, store it as an attribute instead of inheriting: a house has a heater, it is not one. This is called **composition**, and it is often the simpler design.

## Common mistakes

- **Forgetting `super().__init__(...)`.** A subclass `__init__` replaces the parent's, so `Kettle("kettle", 1.5).status()` fails with `AttributeError: 'Kettle' object has no attribute 'name'`.
- **Naming the parent instead of using `super()`**: `Device.status(self)` works in single inheritance but skips classes in a diamond.
- **Checking `type(x) == Device`** where `isinstance(x, Device)` is meant; the first rejects every subclass.
- **Inheriting to reuse code** when the "is a" relation does not hold. Use composition.

## Practice

1. Write `Speaker(Device)` with a `volume` attribute (default 5) whose `status()` adds `, volume 5` to the parent's.
2. Given `class A`, `class B(A)`, `class C(A)` and `class D(C, B)`, write `D`'s MRO.
3. Is `isinstance(True, int)` true? Why?

### Answers

```python
class Speaker(Device):
    def __init__(self, name, volume=5):
        super().__init__(name)
        self.volume = volume

    def status(self):
        return f"{super().status()}, volume {self.volume}"


print(Speaker("kitchen speaker"))
```

```text
Speaker kitchen speaker: off, volume 5
```

2. `D, C, B, A, object`: `D` first, its bases left to right, then their shared parent `A` once, then `object`.
3. Yes. `bool` is a subclass of `int`, so `True` is an `int` (equal to 1) as well as a `bool`.

## Key takeaways

- A subclass inherits everything and overrides what it redefines; `super()` reaches the next class in the MRO.
- Always call `super().__init__(...)` from a subclass `__init__`.
- `isinstance` respects inheritance; `type(x) is C` does not.
- Polymorphism and duck typing: code works with any object that has the methods it calls.
- With several bases, the MRO puts each class once, children before parents; mixins add one capability.

## Further reading

- [The Python Tutorial: Inheritance](https://docs.python.org/3.15/tutorial/classes.html#inheritance)
- [Built-in functions: super](https://docs.python.org/3.15/library/functions.html#super)
- [The Python 2.3 Method Resolution Order](https://docs.python.org/3.15/howto/mro.html)
