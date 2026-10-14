---
title: Type Hints and Generics
summary: Annotate functions, variables and classes with types, understand what annotations do and do not do at run time, write generic functions, classes and type aliases with the modern syntax, and let a type checker find bugs before the program runs.
minutes: 40
objectives:
  - Annotate parameters, return values and variables with built-in generics, unions and `Callable`
  - Explain that annotations are not enforced at run time and are evaluated lazily since Python 3.14
  - Write generic functions and classes with type parameters, and type aliases with `type`
  - Describe dictionaries with `TypedDict`, and read a type checker's report
---

## Outline

1. Annotations and what they do at run time
2. Built-in generics and abstract collection types
3. Unions and `None`
4. Callables
5. Generic functions, classes and aliases
6. `TypedDict`
7. Type checkers

## Annotations and what they do at run time

A **type hint** (or **annotation**) states the type a value is expected to have: `name: type` on
a parameter or variable, and `-> type` for a function's return value. The typing documentation
is direct about the most important fact: **the Python runtime does not enforce annotations**.
They are read by tools (type checkers, editors, linters) and by libraries such as `dataclasses`.

```python
def total_price(quantity: int, unit_price: float = 1.0) -> float:
    return quantity * unit_price


print(total_price(3, 2.5))
print(total_price("ab", 2))
print(total_price.__annotations__)
```

```text
7.5
abab
{'quantity': <class 'int'>, 'unit_price': <class 'float'>, 'return': <class 'float'>}
```

The wrong call ran happily and repeated the string. Annotations are stored as data in
`__annotations__`; nothing checks them. Annotating `unit_price: float` also accepts an `int`:
type checkers treat `int` as acceptable where `float` is expected.

Since Python 3.14 (PEP 649 and PEP 749), annotations are **evaluated lazily**, when something
asks for them, not when the `def` runs. So a class can mention itself in its own methods without
quotes:

```python
class Node:
    def __init__(self, value: int, next: Node | None = None) -> None:
        self.value = value
        self.next = next


print(Node.__init__.__annotations__)
```

```text
{'value': <class 'int'>, 'next': __main__.Node | None, 'return': None}
```

Older code writes such **forward references** as strings (`"Node"`) or starts the file with
`from __future__ import annotations`; both still work.

## Built-in generics and abstract collection types

Containers take the types of their contents in square brackets: `list[int]`, `set[str]`,
`dict[str, float]`, `tuple[int, str]` (exactly two items) and `tuple[int, ...]` (any number of
ints). For **parameters**, prefer the most general type that the function needs, from
`collections.abc`: `Iterable[str]` if it only loops, `Sequence[str]` if it also indexes,
`Mapping[str, int]` if it only reads a dict. A caller can then pass a list, a tuple or a
`frozendict`. For **return values**, be specific: say `list[str]` if you return a list.

## Unions and `None`

`int | str` means "an `int` or a `str`". The most common union is `X | None` for a value that
may be missing; `Optional[X]` from `typing` is an older spelling of the same thing. A type
checker then insists that you handle `None` before using the value:

```python
def label(name: str | None) -> str:
    if name is None:
        return "anonymous"
    return name.upper()
```

After the `if`, the checker knows `name` is a `str`. This is called **narrowing**, and
`isinstance` checks narrow the same way. Without the check, it would report that `None` has no
`upper` attribute, a bug that would otherwise surface only when a `None` arrived at run time.

## Callables

`collections.abc.Callable[[int, str], bool]` describes a function that takes an `int` and a
`str` and returns a `bool`. `Callable[..., bool]` accepts any parameters. Use it for parameters
that receive functions, such as keys, callbacks and the decorators of lesson 1.

## Generic functions, classes and aliases

A function like "return the first item" works for any type, yet the result has the same type as
the items. A **type parameter** expresses that link. Since Python 3.12 (PEP 695) it is declared
in square brackets after the name:

```python
from collections.abc import Callable, Iterable, Sequence

type Pair[T] = tuple[T, T]
type Celsius = float


def first[T](items: Sequence[T]) -> T:
    return items[0]


def largest[N: (int, float)](values: Iterable[N]) -> N:
    return max(values)


class Box[T]:
    def __init__(self, item: T) -> None:
        self.item = item

    def map[U](self, func: Callable[[T], U]) -> Box[U]:
        return Box(func(self.item))


size: Pair[int] = (3, 4)
print(first(["kiwi", "fig"]), first((3, 4)), largest([2.5, 9, 4]))
print(Box(42).map(str).item + "!")
print(Box[int], first.__type_params__, Pair.__value__, size)
```

```text
kiwi 3 9
42!
__main__.Box[int] (T,) tuple[T, T] (3, 4)
```

- `def first[T](items: Sequence[T]) -> T` says: for some type `T`, given a sequence of `T`,
  return a `T`. A checker infers `str` for the first call and `int` for the second.
- `[N: (int, float)]` **constrains** `N` to exactly `int` or `float`. `[T: Hashable]` would set
  an upper **bound**: any subtype of `Hashable`.
- `class Box[T]` is a **generic class**; `Box[int]` is a box of ints. `map` has its own
  parameter `U`, so `Box(42).map(str)` is a `Box[str]`.
- The `type` statement creates a **type alias**. Its value is also evaluated lazily, and an
  alias can be generic, like `Pair[T]`.

At run time all of this is mostly bookkeeping: `Box[int]` is just `Box`, labelled.

## `TypedDict`

JSON and configuration often arrive as dicts with fixed keys. `typing.TypedDict` describes which
keys exist and the type of each value, while the objects stay ordinary dicts:

```python
from typing import NotRequired, TypedDict


class Track(TypedDict):
    title: str
    seconds: int
    artist: NotRequired[str]


song: Track = {"title": "Jolene", "seconds": 161}
print(song, type(song).__name__)
```

```text
{'title': 'Jolene', 'seconds': 161} dict
```

A checker reports a missing `title`, a misspelt key or a `str` stored in `seconds`. Python 3.15
adds the class arguments `closed=True`, which forbids keys that are not declared, and
`extra_items=T`, which allows other keys whose values are of type `T` (PEP 728).

## Type checkers

A **type checker** reads your code without running it and reports where the types cannot fit.
The main ones are **mypy** and **pyright**; editors run them as you type. They are installed
with pip (the lab sandbox has no network, so this part is shown, not run). Given a file
`stats.py`:

```python
def average(values: list[float]) -> float:
    return sum(values) / len(values)


print(average("34"))
```

```console
$ python -m pip install mypy
$ mypy stats.py
stats.py:5: error: Argument 1 to "average" has incompatible type "str"; expected "list[float]"  [arg-type]
Found 1 error in 1 file (checked 1 source file)
```

Run directly, this program would crash inside `sum`; the checker found the mistake at the call.
Checkers catch wrong argument types, `None` used as a value, misspelt attributes, missing
`return` statements and calls with the wrong number of arguments. They cannot see values that
only exist at run time, and mypy skips the bodies of functions that have no annotations unless
told otherwise. Two escape hatches exist: `typing.Any` switches checking off for a value, while
`object` accepts anything but allows only what every object supports. Prefer `object`.

## Common mistakes

- **Expecting annotations to validate data.** `total_price("ab", 2)` runs. Validate input from
  users and files explicitly; annotations only help tools.
- **`list[float]` for a parameter that only loops.** It rejects tuples and generators for no
  reason; use `Iterable[float]`.
- **Forgetting `| None`.** A function that can return `None` but is annotated `-> str` misleads
  every caller; the checker reports the `return None`.
- **Mutable default with a hint.** `def f(tags: list[str] = [])` still shares one list; the hint
  changes nothing.

## Practice

1. Annotate `def word_lengths(words)` that takes any iterable of strings and returns a dict from
   each word to its length.
2. Write a generic `last[T](items: Sequence[T]) -> T | None` that returns `None` for an empty
   sequence.
3. What does `print(Box[str]("x").item.upper())` print, and does `Box[str](5)` raise an error?

### Answers

1. Accept the general type, return the specific one:

   ```python
   from collections.abc import Iterable


   def word_lengths(words: Iterable[str]) -> dict[str, int]:
       return {word: len(word) for word in words}
   ```

2. The union states that the result may be missing:

   ```python
   from collections.abc import Sequence


   def last[T](items: Sequence[T]) -> T | None:
       return items[-1] if items else None
   ```

3. It prints `X`. `Box[str](5)` does not raise: annotations are not enforced, so the box simply
   holds `5`. A type checker would report the call.

## Key takeaways

- Annotations document types for tools; Python does not check them at run time.
- Since 3.14, annotations are evaluated lazily, so forward references need no quotes.
- Use `collections.abc` types for parameters, concrete types for results, and `X | None` for
  optional values.
- `def f[T](...)`, `class C[T]` and `type Alias = ...` declare generics and aliases.
- Run a type checker such as mypy or pyright to turn annotations into found bugs.

## Further reading

- [typing: support for type hints](https://docs.python.org/3.15/library/typing.html)
- [PEP 695: type parameter syntax](https://peps.python.org/pep-0695/)
- [What's new in Python 3.14: deferred evaluation of annotations](https://docs.python.org/3.15/whatsnew/3.14.html)
- [mypy: getting started](https://mypy.readthedocs.io/en/stable/getting_started.html)
