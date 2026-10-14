---
title: The Data Model and Special Methods
summary: Make your own classes behave like built-in types by defining special methods, so they support `len`, indexing, `in`, iteration, truth tests, comparisons, hashing, arithmetic and calls.
minutes: 40
objectives:
  - Explain how Python turns syntax such as `len(x)`, `x[i]` and `a + b` into special method calls on the type
  - Implement a container with `__len__`, `__getitem__`, `__iter__` and `__contains__`
  - Define `__eq__` and `__hash__` consistently, and ordering with `functools.total_ordering`
  - Implement arithmetic operators that return `NotImplemented` for types they do not handle
  - Make instances callable with `__call__`
---

## Outline

1. What the data model is
2. Containers: length, indexing, iteration and membership
3. Equality and hashing go together
4. Ordering and `functools.total_ordering`
5. Arithmetic and `NotImplemented`
6. Callable objects

## What the data model is

The **data model** is the part of the language reference that says what every operation does in
terms of methods. `len(x)` calls `type(x).__len__(x)`, `x[0]` calls `__getitem__`, `a + b`
calls `__add__`, and `print(x)` calls `__str__`. These are **special methods**, also called
**dunder methods** for their double underscores. You met `__init__`, `__str__` and `__repr__` in
Idiomatic Python; the reference calls this mechanism Python's form of **operator overloading**.

You define special methods; you rarely call them. Write `len(box)`, not `box.__len__()`. Python
also looks them up on the **type**, not the instance, so attaching `box.__len__ = ...` to one
object has no effect on `len(box)`.

## Containers: length, indexing, iteration and membership

A class becomes a container by defining four methods:

- `__len__(self)` returns an `int` of 0 or more, used by `len()`.
- `__getitem__(self, key)` is used by `obj[key]`; for sequences it should raise `IndexError`
  for a bad index.
- `__iter__(self)` returns a new iterator, used by `for` and anything that consumes an iterable.
- `__contains__(self, item)` returns a bool, used by `in`.

```python
class Playlist:
    def __init__(self, name, songs):
        self.name = name
        self._songs = list(songs)

    def __repr__(self):
        return f"Playlist({self.name!r}, {self._songs!r})"

    def __len__(self):
        return len(self._songs)

    def __getitem__(self, index):
        return self._songs[index]

    def __iter__(self):
        return iter(self._songs)

    def __contains__(self, title):
        return title.casefold() in (song.casefold() for song in self._songs)


road = Playlist("road", ["Hey Ya", "Africa", "Jolene"])
print(len(road), road[0], road[-1])
print(road[1:])
print("AFRICA" in road, "Toxic" in road)
print(", ".join(road))
print(bool(road), bool(Playlist("empty", [])))
```

```text
3 Hey Ya Jolene
['Africa', 'Jolene']
True False
Hey Ya, Africa, Jolene
True False
```

`road[1:]` passes a `slice` object to `__getitem__`, and the list handles it, so slicing came for
free. `str.join` iterated through `__iter__`. Membership uses the custom `__contains__`, which
ignores case.

Two fallbacks are worth knowing. **Truth**: without `__bool__`, Python uses `__len__`, so an
empty playlist is false; a class with neither is always true. **Membership and iteration**:
without `__contains__`, `in` loops with `__iter__`; without `__iter__`, Python calls
`__getitem__(0)`, `__getitem__(1)` and so on until `IndexError`. Define the methods directly when
you can do better, such as a set lookup in `__contains__`.

## Equality and hashing go together

By default `==` compares identity. Define `__eq__` to compare values. A **hash** is the integer
that sets and dict keys use to find an object quickly, and the rule is: **objects that compare
equal must have equal hashes**. The usual way is to hash a tuple of the fields `__eq__` compares.

```python
class Colour:
    def __init__(self, name, hex_code):
        self.name = name
        self.hex_code = hex_code.lower()

    def __eq__(self, other):
        if not isinstance(other, Colour):
            return NotImplemented
        return self.hex_code == other.hex_code

    def __hash__(self):
        return hash(self.hex_code)


red = Colour("red", "#FF0000")
also_red = Colour("signal red", "#ff0000")
print(red == also_red, red is also_red, red != also_red)
print(len({red, also_red}))
print(red == "#ff0000")
```

```text
True False False
1
False
```

`!=` needed no method: by default `__ne__` inverts `__eq__`. For an object of another type,
`__eq__` returns the special value **`NotImplemented`**, which tells Python to ask the other
operand; when both decline, `==` falls back to identity and gives `False`.

A class that defines `__eq__` without `__hash__` gets `__hash__ = None` and becomes
**unhashable**:

```python
class Badge:
    def __init__(self, code):
        self.code = code

    def __eq__(self, other):
        if not isinstance(other, Badge):
            return NotImplemented
        return self.code == other.code


print(Badge.__hash__)
{Badge("A1")}
```

```text
None
Traceback (most recent call last):
  File "/tmp/example.py", line 12, in <module>
    {Badge("A1")}
TypeError: cannot use 'Badge' as a set element (unhashable type: 'Badge')
```

Only hash fields that never change. If a field used in the hash changes while the object is in a
set, the set looks in the wrong place and can no longer find it.

## Ordering and `functools.total_ordering`

`<`, `<=`, `>` and `>=` call `__lt__`, `__le__`, `__gt__` and `__ge__`. Python implies nothing
between them, except that `a > b` can be answered by `b.__lt__(a)`, the **reflected** method.
The class decorator `functools.total_ordering` fills in the missing ones from `__eq__` and one
ordering method.

```python
import functools


@functools.total_ordering
class Version:
    def __init__(self, text):
        self.parts = tuple(int(part) for part in text.split("."))

    def __repr__(self):
        return f"Version('{'.'.join(map(str, self.parts))}')"

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts == other.parts

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts < other.parts

    def __hash__(self):
        return hash(self.parts)


releases = [Version("3.10.2"), Version("3.9.18"), Version("3.15.0")]
print(sorted(releases))
print(Version("3.9.0") <= Version("3.10.0"), max(releases))
Version("3.15.0") < "3.16"
```

```text
[Version('3.9.18'), Version('3.10.2'), Version('3.15.0')]
True Version('3.15.0')
Traceback (most recent call last):
  File "/tmp/example.py", line 29, in <module>
    Version("3.15.0") < "3.16"
TypeError: '<' not supported between instances of 'Version' and 'str'
```

Comparing tuples of integers sorts `3.9` before `3.10`, which comparing the strings would not.
`sorted` and `max` only need `__lt__`; `<=` came from `total_ordering`. The docs note that the
generated methods are slower than hand-written ones, which only matters in hot loops.

## Arithmetic and `NotImplemented`

`a + b` first tries `type(a).__add__(a, b)`. If that is missing or returns `NotImplemented`, and
`b` is of a different type, Python tries the **reflected** method `type(b).__radd__(b, a)`.
`a += b` tries `__iadd__` and falls back to `__add__`.

```python
class Duration:
    def __init__(self, minutes):
        self.minutes = minutes

    def __repr__(self):
        return f"Duration({self.minutes})"

    def __add__(self, other):
        if not isinstance(other, Duration):
            return NotImplemented
        return Duration(self.minutes + other.minutes)

    def __radd__(self, other):
        if other == 0:  # sum() starts from 0
            return self
        return NotImplemented

    def __mul__(self, factor):
        if not isinstance(factor, int):
            return NotImplemented
        return Duration(self.minutes * factor)

    __rmul__ = __mul__


print(Duration(30) + Duration(45))
print(Duration(20) * 3, 3 * Duration(20))
print(sum([Duration(10), Duration(25), Duration(5)]))
Duration(5) + 5
```

```text
Duration(75)
Duration(60) Duration(60)
Duration(40)
Traceback (most recent call last):
  File "/tmp/example.py", line 29, in <module>
    Duration(5) + 5
    ~~~~~~~~~~~~^~~
TypeError: unsupported operand type(s) for +: 'Duration' and 'int'
```

`3 * Duration(20)` works because `int.__mul__` returns `NotImplemented` for a `Duration`, so
`__rmul__` runs. `sum` starts from `0`, hence the `__radd__` case. Returning `NotImplemented`,
not raising, lets Python produce the standard `TypeError` itself.

## Callable objects

`__call__` makes an instance callable like a function, while it keeps state in attributes:

```python
class Threshold:
    def __init__(self, limit):
        self.limit = limit
        self.checked = 0

    def __call__(self, value):
        self.checked += 1
        return value > self.limit


is_heavy = Threshold(20)
parcels = [12, 25, 31, 8]
print([weight for weight in parcels if is_heavy(weight)], is_heavy.checked)
print(callable(is_heavy), callable(parcels))
```

```text
[25, 31] 4
True False
```

## Common mistakes

- **Defining `__eq__` without `__hash__`.** Instances can no longer go in sets or be dict keys.
  Add `__hash__` over the same fields, or leave it out on purpose for mutable objects.
- **Returning `False` for an unknown type.** Return `NotImplemented`, so the other operand gets a
  chance. With `return False`, `Pair(1, 2) == other` and `other == Pair(1, 2)` can disagree.
- **Hashing a field that changes.** Change it while the object is in a set, and `obj in the_set`
  becomes `False` although the object is there.
- **A negative length.** `len()` checks the result: `ValueError: __len__() should return >= 0`.

## Practice

1. Give `Playlist` an `__add__` that joins two playlists into a new one named `"mix"`.
2. Why does `{Version("3.15.0"), Version("3.15.0")}` have one element, and what would happen
   without `Version.__hash__`?
3. Write a class `Multiplier` whose instances can be called: `Multiplier(3)(7)` returns `21`.

### Answers

1. Return `NotImplemented` for anything that is not a playlist:

   ```python
   def __add__(self, other):
       if not isinstance(other, Playlist):
           return NotImplemented
       return Playlist("mix", self._songs + other._songs)
   ```

2. The two versions are equal and their hashes are equal, so the set keeps one. Without
   `__hash__`, defining `__eq__` sets `__hash__` to `None` and building the set raises
   `TypeError`.
3. Store the factor and use it in `__call__`:

   ```python
   class Multiplier:
       def __init__(self, factor):
           self.factor = factor

       def __call__(self, value):
           return value * self.factor
   ```

## Key takeaways

- Syntax and built-ins call special methods on the type: `len` calls `__len__`, `in` calls
  `__contains__`, `+` calls `__add__`.
- Containers need `__len__`, `__getitem__`, `__iter__` and `__contains__`; truth falls back to
  `__len__`.
- Equal objects must hash equally; `__eq__` alone makes a class unhashable.
- Return `NotImplemented` for unsupported operands so reflected methods and the standard errors
  work.
- `total_ordering` completes the comparisons; `__call__` makes objects callable.

## Further reading

- [Data model: special method names](https://docs.python.org/3.15/reference/datamodel.html#special-method-names)
- [functools.total_ordering](https://docs.python.org/3.15/library/functools.html#functools.total_ordering)
- [The NotImplemented constant](https://docs.python.org/3.15/library/constants.html#NotImplemented)
