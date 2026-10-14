---
title: Memory and the Object Model
summary: Understand how CPython manages memory. Objects are freed by reference counting, cycles by the garbage collector; weak references point without keeping alive; sys.getsizeof measures less than you think; small integers and strings are shared; copies are shallow or deep; and tracemalloc shows where memory goes.
minutes: 35
objectives:
  - Explain reference counting and when an object is freed, and how gc collects reference cycles
  - Use weakref and WeakValueDictionary for caches that do not keep objects alive
  - Measure memory with sys.getsizeof and tracemalloc, and explain what getsizeof misses
  - Choose between copy.copy and copy.deepcopy, and reduce memory with __slots__ and generators
---

## Outline

1. Everything is an object
2. Reference counting
3. Cycles and the garbage collector
4. Weak references
5. How big is an object?
6. Shared small objects
7. Shallow and deep copies
8. Saving memory and finding where it goes

## Everything is an object

Every value in Python, an `int`, a function, a class, a module, is an **object** with an identity
(`id`), a type and a value. Variables, list slots and attributes do not contain objects; they
hold **references** to them, as the basic level showed with `a = b` making two names for one list.
So the questions of this lesson are: when does an object stop being needed, who frees it, and how
much memory does it take? The answers below describe **CPython**, the standard interpreter; the
language only promises that unreachable objects may be freed.

## Reference counting

CPython counts the references to each object. Assigning, appending or passing it as an argument
adds one; `del`, reassignment or a function returning removes one. When the count reaches zero
the object is freed **immediately**:

```python
import gc
import sys
import weakref


class Node:
    def __init__(self, name):
        self.name = name
        self.partner = None


report = Node("report")
weakref.finalize(report, print, "report freed")
alias = report
print(sys.getrefcount(report))   # one extra: the argument itself
del report
print("after del report")
del alias
print("after del alias")

a, b = Node("a"), Node("b")
a.partner, b.partner = b, a      # a reference cycle
weakref.finalize(a, print, "a freed")
del a, b
print("after del a, b")
print("collected:", gc.collect())
```

```text
3
after del report
report freed
after del alias
after del a, b
a freed
collected: 3
```

`weakref.finalize(obj, func, *args)` calls `func` when `obj` is freed, which makes the moment
visible. `del report` removed a *name*, not the object: `alias` still referred to it. Only the
second `del` brought the count to zero. Some objects, such as `None`, `True` and small integers,
are **immortal** (Python 3.12+): `sys.getrefcount(None)` shows a fixed, huge number.

## Cycles and the garbage collector

`a` and `b` refer to each other, so after `del a, b` each count is still 1, though nothing can
reach them. Reference counting alone would leak them. The **cycle garbage collector**, the `gc`
module, periodically searches containers for groups that only reference each other and frees
them. It runs automatically, more often for young objects (it sorts objects into generations);
`gc.collect()` forces a full run and returns the number of unreachable objects found.

- Cycles are freed later, not at once, so do not rely on `__del__` or finalisers for timely
  cleanup. Close files and connections with `with` (advanced level).
- `gc.disable()` is occasionally used in short-lived batch jobs that create no cycles;
  `gc.freeze()` helps servers that fork worker processes.
- Python 3.14.0 to 3.14.4 shipped an incremental collector; it was reverted in 3.14.5, and 3.15
  uses the generational collector of 3.13.

## Weak references

A **weak reference** points to an object without adding to its count, so it does not keep it
alive. `weakref.ref(obj)` returns a callable that gives the object back, or `None` once it is
gone. Its main use is a **cache** that should not hold objects nobody else uses:

```python
import weakref


class Image:
    def __init__(self, path):
        self.path = path
        self.pixels = bytearray(1_000_000)


cache = weakref.WeakValueDictionary()


def load(path):
    image = cache.get(path)
    if image is None:
        print("loading", path)
        image = Image(path)
        cache[path] = image
    return image


banner = load("banner.png")
again = load("banner.png")
print(again is banner, len(cache))
del banner, again
print(len(cache))
load("banner.png")

try:
    weakref.ref([1, 2, 3])
except TypeError as error:
    print("TypeError:", error)
```

```text
loading banner.png
True 1
0
loading banner.png
TypeError: cannot create weak reference to 'list' object
```

While someone used the image, the cache shared it; when the last user let go, the entry vanished.
`WeakKeyDictionary` and `WeakSet` work the same way for keys and members. Instances of your own
classes support weak references; `list` and `dict` do not (a subclass does), and `int` and
`tuple` cannot.

## How big is an object?

`sys.getsizeof(obj)` returns the bytes of the object itself, **not** of the objects it refers to:

```python
import copy
import sys

words = ["alpha", "beta", "gamma" * 1000]
print(sys.getsizeof(words), sum(sys.getsizeof(word) for word in words))

x, y = 1024, int("1024")
print(x is y)
x, y = 1025, int("1025")
print(x is y, x == y)
s = "".join(["ready", "_", "set"])
t = "ready_set"
print(s is t, s == t, sys.intern(s) is sys.intern(t))

config = {"name": "night shift", "staff": ["ada", "bo"]}
shallow = copy.copy(config)
deep = copy.deepcopy(config)
config["staff"].append("cy")
print(shallow["staff"], deep["staff"], shallow["staff"] is config["staff"])
```

```text
80 5132
True
False True
False True True
['ada', 'bo', 'cy'] ['ada', 'bo'] True
```

The list is 80 bytes: its header and three references. The strings it points to take 5,132 bytes
more. To measure a whole structure, measure what a program allocates instead, as the last example
shows.

## Shared small objects

CPython keeps one shared object for each small integer, so `1024 is int("1024")` is `True` but the
same test with 1025 is `False`. The range is -5 to 1024 in 3.15; it was -5 to 256 before. Many
strings that look like identifiers are **interned** (stored once), and `sys.intern` interns any
string, so repeated keys can share memory. These are implementation details: they change between
versions, as the integer range just did. Compare values with `==`, and keep `is` for `None` and
other single objects.

## Shallow and deep copies

`copy.copy` makes a new outer object that refers to the **same** inner objects, so appending to
`config["staff"]` showed through `shallow`. `copy.deepcopy` copies recursively, inner objects
included, and handles cycles. Deep copies cost time and memory; use them when the copy must be
fully independent.

## Saving memory and finding where it goes

Each ordinary instance keeps its attributes in a dictionary. `__slots__` (advanced level) gives
fixed slots instead. `tracemalloc` traces every allocation Python makes: `get_traced_memory()`
returns the current and peak bytes, `reset_peak()` starts a new peak, and `take_snapshot()` can
list allocations by source line.

```python
import tracemalloc


class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class SlotPoint:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


def measure(cls):
    tracemalloc.start()
    points = [cls(n, n) for n in range(100_000)]
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return current // len(points)


print("plain:", measure(Point), "bytes per point")
print("slots:", measure(SlotPoint), "bytes per point")

tracemalloc.start()
squares = [n * n for n in range(200_000)]
total = sum(squares)
del squares
_, list_peak = tracemalloc.get_traced_memory()
tracemalloc.reset_peak()
total = sum(n * n for n in range(200_000))
_, gen_peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
print(f"list peak {list_peak / 1e6:.1f} MB, generator peak {gen_peak / 1e3:.1f} kB")
```

```text
plain: 127 bytes per point
slots: 87 bytes per point
list peak 8.0 MB, generator peak 3.6 kB
```

The figures include each point's share of the list and its integers. Slots saved about 30 percent
here; with a million objects that matters. The generator never held more than one square at a
time.

## Common mistakes

- **`is` for equal values.** `s is "ready_set"` is unreliable, and Python warns when it compiles
  the line: `SyntaxWarning: "is" with 'str' literal. Did you mean "=="?`
- **Trusting `getsizeof` for containers.** It counts references, not what they point to.
- **A shallow copy of nested data.** Editing the inner list changes the "copy". Use `deepcopy`, or
  build new data.
- **Caches that never forget.** A module-level `dict` keeps every value alive forever; bound it
  (`lru_cache(maxsize=...)`) or use a `WeakValueDictionary`.

## Practice

1. Two `Node`s refer to each other and you `del` both names. When are they freed?
2. Print the three source lines that allocated the most memory in a block of code.
3. Why might `weakref.ref(3)` fail where `weakref.ref(Node("x"))` works?

### Answers

1. Not at once, because each still has a count of 1. The cycle collector frees them on its next
   run, or immediately when you call `gc.collect()`.
2. ```python
   import tracemalloc

   tracemalloc.start()
   data = [str(n) * 10 for n in range(10_000)]
   for stat in tracemalloc.take_snapshot().statistics("lineno")[:3]:
       print(stat)
   ```
   Here only one line allocated anything: `/tmp/top3.py:4: size=863 KiB, count=10001,
   average=88 B`, the list and its 10,000 strings.
3. `int` does not support weak references at all; instances of ordinary classes do.

## Key takeaways

- Names hold references; CPython frees an object when its reference count reaches zero.
- The `gc` module finds and frees reference cycles, later rather than at once.
- Weak references and `WeakValueDictionary` let caches share objects without keeping them alive.
- `sys.getsizeof` is shallow; `tracemalloc` measures what code really allocates.
- Use `==` for values; small-integer and string sharing are implementation details.

## Further reading

- [gc: Garbage Collector interface](https://docs.python.org/3.15/library/gc.html)
- [weakref: Weak references](https://docs.python.org/3.15/library/weakref.html)
- [tracemalloc: Trace memory allocations](https://docs.python.org/3.15/library/tracemalloc.html)
- [Data model: Objects, values and types](https://docs.python.org/3.15/reference/datamodel.html#objects-values-and-types)
