---
title: Pattern Matching
summary: Use the `match` statement to compare a value against the shape of the data you expect, with literal, capture, wildcard, sequence, mapping and class patterns, refined by guards, OR patterns and `as`, and learn when `match` is clearer than `if`/`elif`.
minutes: 35
objectives:
  - Write `match` statements with literal, capture and wildcard patterns, and combine patterns with `|`
  - Match sequences of different lengths with sequence patterns and `*rest`
  - Match dictionaries with mapping patterns and objects with class patterns, including `__match_args__`
  - Refine a case with a guard and keep a matched part with `as`
  - Avoid the capture-pattern trap with named constants, and choose between `match` and `if`
---

## Outline

1. `match` and `case`
2. Literal, wildcard and OR patterns
3. Sequence and capture patterns
4. Guards and `as`
5. Mapping patterns
6. Class patterns
7. Named constants and the capture trap
8. When to use `match`

## `match` and `case`

Python 3.10 added **structural pattern matching** (PEP 634, with the tutorial PEP 636). A `match` statement takes a value, the **subject**, and tries each `case` in order. Each case has a **pattern** that describes a shape the subject may have: a certain value, a list of two items, a dictionary with a `"type"` key, an instance of a class. The first case whose pattern fits runs, and the others are skipped. If none fits, nothing happens; there is no error.

A pattern is not an expression. It looks like one, but it describes a shape, and names inside it **capture** parts of the subject into variables.

## Literal, wildcard and OR patterns

```python
def describe(status):
    match status:
        case 200:
            return "OK"
        case 301 | 302:
            return "moved"
        case 404:
            return "not found"
        case _:
            return "unexpected"


print([describe(code) for code in [200, 302, 404, 500]])
```

```text
['OK', 'moved', 'not found', 'unexpected']
```

- A **literal pattern** (a number, a string, `True`, `False`, `None`) matches a subject equal to it. A negative number such as `-1` is allowed, and since Python 3.15 so is `+1`.
- `|` makes an **OR pattern**: any of the alternatives.
- `_` is the **wildcard**: it matches anything and binds nothing. As the last case, it plays the role of `else`.

## Sequence and capture patterns

Pattern matching shines when a value can take several shapes. Here a to-do program reads typed commands, split into words:

```python
def run(command):
    match command.split():
        case ["list"]:
            return "listing tasks"
        case ["add", *words] if words:
            return f"adding {' '.join(words)!r}"
        case ["done", number] if number.isdecimal():
            return f"task {int(number)} done"
        case ["remove", ("all" | "done") as which]:
            return f"removing {which} tasks"
        case ["quit" | "exit"]:
            return "bye"
        case []:
            return "type a command"
        case [verb, *rest]:
            return f"cannot {verb} with {len(rest)} argument(s)"


for text in ["list", "add buy oat milk", "done 3", "remove done", "exit", "", "add", "done x", "dance now"]:
    print(f"{text!r:20} {run(text)}")
```

```text
'list'               listing tasks
'add buy oat milk'   adding 'buy oat milk'
'done 3'             task 3 done
'remove done'        removing done tasks
'exit'               bye
''                   type a command
'add'                cannot add with 0 argument(s)
'done x'             cannot done with 1 argument(s)
'dance now'          cannot dance with 1 argument(s)
```

- A **sequence pattern** in square brackets (or parentheses) matches a list or tuple with exactly that many items, each matching its own subpattern. `["list"]` matches a one-word command `list`; `[]` matches an empty list.
- A bare name such as `number` or `verb` is a **capture pattern**: it matches anything in that position and binds it, like the unpacking `verb, *rest = words`.
- `*words` captures the remaining items as a list, possibly empty. One star is allowed per sequence pattern, and `*_` accepts any rest without binding it.
- Strings are sequences, but sequence patterns never match `str` or `bytes` subjects. That is why the example matches `command.split()` and not `command`.

Writing this with `if`/`elif` would need `len(words) == 2 and words[0] == "done"` tests and index juggling. The patterns show the expected input directly.

## Guards and `as`

- A **guard** is an `if` after the pattern. The case is chosen only if the pattern matches **and** the guard is true; otherwise matching continues with the next case. The guard runs after capturing, so it can use the captured names: `["done", number] if number.isdecimal()`. With `"done x"`, the guard fails and the last case takes it.
- `pattern as name` matches the pattern and binds the whole matched value to a name. `("all" | "done") as which` accepts either word and remembers which one.

## Mapping patterns

A **mapping pattern** in braces matches a dictionary that has the given keys, with values that match their subpatterns. Extra keys are ignored, and `**rest` captures them. This suits data from JSON files and web services, here events sent by home sensors:

```python
def handle(event):
    match event:
        case {"type": "temperature", "celsius": int(value) | float(value)}:
            return f"temperature {value} C"
        case {"type": "door", "room": room, "open": True}:
            return f"{room} door opened"
        case {"type": "door", "room": room}:
            return f"{room} door closed"
        case {"type": str(kind), **details}:
            return f"unhandled {kind} event, keys {sorted(details)}"
        case _:
            return "not an event"


events = [
    {"type": "temperature", "celsius": 21.5, "sensor": "hall"},
    {"type": "temperature", "celsius": "warm"},
    {"type": "door", "room": "kitchen", "open": True},
    {"type": "door", "room": "garage", "open": False},
    {"type": "battery", "level": 12, "device": "lock"},
    ["type", "door"],
]
for event in events:
    print(handle(event))
```

```text
temperature 21.5 C
unhandled temperature event, keys ['celsius']
kitchen door opened
garage door closed
unhandled battery event, keys ['device', 'level']
not an event
```

`int(value) | float(value)` accepts a number of either type and binds it; the reading `"warm"` fails it and falls through. For built-in types, `str(kind)` means "a `str`, bound to `kind`". The order of cases matters: the specific door case comes before the general one. A list is not a mapping, so the last event reaches `_`.

## Class patterns

A **class pattern** `ClassName(...)` matches instances of the class (and subclasses, as `isinstance` does) whose attributes match. Keyword arguments name attributes: `Point(x=0, y=y)`. Positional arguments need the class attribute `__match_args__`, which lists the attribute names in order:

```python
class Point:
    __match_args__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


def where(value):
    match value:
        case Point(0, 0):
            return "origin"
        case Point(0, y):
            return f"on the y axis at {y}"
        case Point(x=x, y=0):
            return f"on the x axis at {x}"
        case Point(x, y) if x == y:
            return f"on the diagonal at {x}"
        case Point():
            return "somewhere else"
        case (x, y):
            return f"a pair, not a Point: {x}, {y}"
        case str() | bytes():
            return "text"
        case _:
            return "not a point"


for value in [Point(0, 0), Point(0, 5), Point(3, 0), Point(2, 2), Point(1, 4), (1, 4), "xy", 7]:
    print(where(value))
```

```text
origin
on the y axis at 5
on the x axis at 3
on the diagonal at 2
somewhere else
a pair, not a Point: 1, 4
text
not a point
```

`Point()` with no arguments matches any `Point`. The advanced level shows dataclasses, which set `__match_args__` for you.

## Named constants and the capture trap

Because a bare name captures, it cannot stand for a constant:

```python
from http import HTTPStatus

NOT_FOUND = 404


def check(code):
    match code:
        case HTTPStatus.OK:
            return "fine"
        case NOT_FOUND:
            return "not found"


print(check(200), check(404), check(500), NOT_FOUND)
```

```text
fine not found not found 404
```

`case NOT_FOUND:` does not compare with 404. It captures any value into a new local variable `NOT_FOUND`, so 500 is "not found" too. A **dotted name** such as `HTTPStatus.OK` is a **value pattern**, compared with `==`. Put constants in a class or module and refer to them with a dot. Python catches the worst case: a capture pattern followed by more cases is `SyntaxError: name capture 'NOT_FOUND' makes remaining patterns unreachable`.

## When to use `match`

Use `match` when you branch on the **structure** of data: commands of different lengths, messages of different types, nested lists and dictionaries, objects of different classes. Stay with `if`/`elif` for ranges and conditions on one value (`if temperature > 30`), and with a dictionary when you only map keys to values. Bindings made in the chosen case remain available after the `match` statement.

## Common mistakes

- **A bare name as a constant**: it captures everything. Use a dotted name.
- **Matching a string with a sequence pattern**: `["a", "b"]` never matches `"ab"`. Split it first.
- **A general case before a specific one**: the first match wins, so the specific case never runs.
- **Expecting an error when nothing matches.** Add `case _:` and raise there if every input must be handled.

## Practice

1. Write `parse_size(text)` that returns `(1920, 1080)` for `"1920x1080"`, `(64, 64)` for `"64"`, and raises ValueError otherwise.
2. Write `area(shape)` for dictionaries such as `{"kind": "square", "side": 3}`, `{"kind": "rect", "w": 2, "h": 5}` and `{"kind": "circle", "r": 1}`.

### Answers

```python
def parse_size(text):
    match text.split("x"):
        case [width, height] if width.isdecimal() and height.isdecimal():
            return int(width), int(height)
        case [side] if side.isdecimal():
            return int(side), int(side)
        case _:
            raise ValueError(f"bad size: {text!r}")


def area(shape):
    match shape:
        case {"kind": "square", "side": side}:
            return side * side
        case {"kind": "rect", "w": w, "h": h}:
            return w * h
        case {"kind": "circle", "r": r}:
            return round(3.14159 * r * r, 2)
        case {"kind": kind}:
            raise ValueError(f"unknown shape {kind!r}")
        case _:
            raise TypeError("not a shape")


print(parse_size("1920x1080"), parse_size("64"))
print(area({"kind": "square", "side": 3}), area({"kind": "rect", "w": 2, "h": 5}), area({"kind": "circle", "r": 1}))
```

```text
(1920, 1080) (64, 64)
9 10 3.14
```

`parse_size("4x")` splits into `["4", ""]`, whose guard fails, so the wildcard raises ValueError.

## Key takeaways

- `match` tries each `case` in order and runs the first whose pattern fits; nothing runs if none does.
- Literals compare by value, `_` matches anything, `|` gives alternatives.
- Sequence patterns check length and items, mapping patterns check keys, class patterns check type and attributes.
- Bare names capture; a guard adds a condition; `as` binds a matched part.
- Constants in patterns must be dotted names.

## Further reading

- [The Python Tutorial: match statements](https://docs.python.org/3.15/tutorial/controlflow.html#match-statements)
- [Language reference: The match statement](https://docs.python.org/3.15/reference/compound_stmts.html#the-match-statement)
- [PEP 636: Structural pattern matching tutorial](https://peps.python.org/pep-0636/)
