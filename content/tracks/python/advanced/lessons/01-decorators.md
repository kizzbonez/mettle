---
title: Decorators
summary: Write functions that take a function and return an improved one, apply them with `@`, keep the original's name and docstring with `functools.wraps`, and build decorators that take arguments, stack, and decorate classes.
minutes: 35
objectives:
  - Write a decorator that wraps any function with `*args` and `**kwargs` and keeps its identity with `functools.wraps`
  - Write a decorator that takes arguments, and explain its three layers of functions
  - Predict the order in which stacked decorators are built and applied
  - Use class decorators and decorators for real jobs such as timing, retrying and registration
---

## Outline

1. A decorator is a function that takes a function
2. The `@` syntax
3. Keeping the identity with `functools.wraps`
4. Decorators that take arguments
5. Stacking decorators
6. Class decorators and real uses

## A decorator is a function that takes a function

Idiomatic Python showed that functions are objects: you can pass one as an argument, return one
from another function, and a nested function remembers the variables of the function around it
(a closure). A **decorator** combines those three ideas. It is a callable that receives a function
and returns a replacement, usually a new function that does something extra before or after
calling the original.

```python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper()
    return wrapper


def greet(name):
    return f"hello, {name}"


loud_greet = shout(greet)
print(loud_greet("ada"))
print(greet("ada"))
```

```text
HELLO, ADA
hello, ada
```

`shout(greet)` does not call `greet`. It builds `wrapper`, a closure that remembers `func`, and
returns it. Only when `loud_greet("ada")` runs does `wrapper` call the original and change its
result. Because `wrapper` accepts `*args, **kwargs` and passes them on unchanged, it works for a
function with any parameters.

## The `@` syntax

Writing `@shout` on the line above a `def` means "define the function, pass it to `shout`, and
bind the name to whatever `shout` returns". The language reference describes `@f` above
`def func` as roughly `func = f(func)`, done once, when the `def` statement runs. Continuing the
file above:

```python
@shout
def farewell(name):
    """Say goodbye."""
    return f"goodbye, {name}"


print(farewell("bo"))
print(farewell.__name__, farewell.__doc__)
```

```text
GOODBYE, BO
wrapper None
```

The behaviour is right, but the name `farewell` now refers to `wrapper`, which has its own name
and no docstring. `help(farewell)`, tracebacks and logging would all describe the wrong function.

## Keeping the identity with `functools.wraps`

`functools.wraps(func)` is itself a decorator, applied to the wrapper. It copies the wrapped
function's `__module__`, `__name__`, `__qualname__`, `__doc__`, `__annotations__` and
`__type_params__` onto the wrapper, merges its `__dict__`, and adds `__wrapped__`, a reference to
the original. Use it in every decorator you write.

```python
import functools


def counted(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)

    wrapper.calls = 0
    return wrapper


@counted
def area(width, height):
    """Return the area of a rectangle."""
    return width * height


print(area(3, 4), area(2, 5))
print(area.calls)
print(area.__name__, "|", area.__doc__)
print(area.__wrapped__(1, 1), area.calls)
```

```text
12 10
2
area | Return the area of a rectangle.
1 2
```

A function can carry attributes, so `wrapper.calls` is a simple per-function counter. Calling
`area.__wrapped__` reaches the original directly, which skips the counting: the count stays at 2.

## Decorators that take arguments

`@retry(times=3)` has parentheses, so Python first *calls* `retry(times=3)`, and the value it
returns is the real decorator. That gives three layers: the outer function receives the
settings, the middle one receives the function, and the inner one runs at each call.

```python
import functools


def retry(times, exceptions=(Exception,)):
    def decorate(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as error:
                    print(f"{func.__name__}: attempt {attempt} failed ({error})")
                    if attempt == times:
                        raise

        return wrapper

    return decorate


replies = iter([ConnectionError("timeout"), ConnectionError("reset"), "200 OK"])


@retry(times=3, exceptions=(ConnectionError,))
def fetch_status():
    reply = next(replies)
    if isinstance(reply, Exception):
        raise reply
    return reply


print(fetch_status())
```

```text
fetch_status: attempt 1 failed (timeout)
fetch_status: attempt 2 failed (reset)
200 OK
```

The iterator stands in for a network that fails twice. A bare `raise` in the last attempt
re-raises the error, so the caller still learns what went wrong. Only the listed exception types
are retried; any other error passes straight through.

## Stacking decorators

Several decorators can sit on one function. The reference states that
`@f1(arg)` over `@f2` over `def func` is roughly `func = f1(arg)(f2(func))`. The decorator
expressions are evaluated from the top down, but they are *applied* from the bottom up: the one
nearest the `def` wraps first.

```python
import functools


def tag(name):
    print(f"building tag({name!r})")

    def decorate(func):
        print(f"applying {name} to {func.__name__}")

        @functools.wraps(func)
        def wrapper():
            return f"<{name}>{func()}</{name}>"

        return wrapper

    return decorate


@tag("b")
@tag("i")
def label():
    return "sale"


print(label())
```

```text
building tag('b')
building tag('i')
applying i to label
applying b to label
<b><i>sale</i></b>
```

Order matters whenever decorators interact. A `@timed` placed above `@retry` measures all the
attempts together; placed below it, it measures each attempt separately.

## Class decorators and real uses

A class can be decorated too: `@f` above `class C` means `C = f(C)`. A class decorator usually
changes or records the class and returns the same class. The standard library's `@dataclass`
(lesson 3) and `@functools.total_ordering` (lesson 2) are class decorators. A common pattern is
a **registry**, where the decorator records each class or function under a key and returns it
unchanged:

```python
EXPORTERS = {}


def exporter(cls):
    EXPORTERS[cls.extension] = cls
    return cls


@exporter
class CsvExporter:
    extension = "csv"


@exporter
class JsonExporter:
    extension = "json"


print(sorted(EXPORTERS), EXPORTERS["csv"].__name__)
```

```text
['csv', 'json'] CsvExporter
```

Registration happens when the class statement runs, so importing the module fills the registry.
Other everyday decorators:

- **Timing**: record `time.perf_counter()` before the call and print the difference after it,
  in a `finally` block so failures are timed too.
- **Caching**: `functools.cache` remembers results by arguments (lesson 5).
- **Validation**: check the arguments and raise `ValueError` or `TypeError` before calling.
- **Routing**: web frameworks such as Flask register the function that answers a URL with a
  decorator like `@app.route("/")`, which is a registry with arguments.

`@property`, `@classmethod` and `@staticmethod` from Idiomatic Python are decorators as well.

## Common mistakes

- **Forgetting to return the wrapper.** The decorator returns `None`, so the name is bound to
  `None` and every call fails with `TypeError: 'NoneType' object is not callable`. End the
  decorator with `return wrapper`.
- **Forgetting to return the result.** A wrapper that only calls `func(*args, **kwargs)` makes
  every decorated function return `None`. Write `return func(*args, **kwargs)`.
- **Leaving out the parentheses.** With `@retry` instead of `@retry(3)`, the function is passed
  as `times` and the name becomes `decorate`. Calling it fails with
  `TypeError: retry.<locals>.decorate() missing 1 required positional argument: 'func'`.
- **Skipping `functools.wraps`.** Everything still runs, but names, docstrings and
  `__wrapped__` are lost, which confuses debugging, documentation and tools.

## Practice

1. Write `log_calls`, which prints `call add(2, b=3)` before calling `add(2, b=3)` and returns its
   result.
2. Write `once`, a decorator that runs the function on the first call only and returns the
   saved result on every later call.
3. Write a class decorator `describe` that adds a method `describe(self)` returning the class
   name and the sorted names of the instance's attributes.

### Answers

1. Rebuild the arguments as text with `repr`:

   ```python
   def log_calls(func):
       @functools.wraps(func)
       def wrapper(*args, **kwargs):
           parts = [repr(a) for a in args] + [f"{k}={v!r}" for k, v in kwargs.items()]
           print(f"call {func.__name__}({', '.join(parts)})")
           return func(*args, **kwargs)

       return wrapper
   ```

2. Keep the state in the closure and change it with `nonlocal`:

   ```python
   def once(func):
       done = False
       result = None

       @functools.wraps(func)
       def wrapper(*args, **kwargs):
           nonlocal done, result
           if not done:
               result = func(*args, **kwargs)
               done = True
           return result

       return wrapper
   ```

3. Assign a new function to the class and return the class:

   ```python
   def describe(cls):
       def describe_method(self):
           return f"{cls.__name__} with {sorted(vars(self))}"

       cls.describe = describe_method
       return cls
   ```

   A `Lamp` with `watts` and `colour` attributes gives `Lamp with ['colour', 'watts']`.

## Key takeaways

- A decorator is a callable that takes a function (or class) and returns its replacement;
  `@d` above `def f` means `f = d(f)`, run once at definition time.
- Pass `*args, **kwargs` through and return the result so a wrapper fits any function.
- Always apply `functools.wraps(func)` to the wrapper; it keeps the name, docstring and
  `__wrapped__`.
- A decorator with arguments is a function that returns a decorator: three layers.
- Stacked decorators are evaluated top down and applied bottom up.

## Further reading

- [Language reference: function definitions and decorators](https://docs.python.org/3.15/reference/compound_stmts.html#function-definitions)
- [functools.wraps and update_wrapper](https://docs.python.org/3.15/library/functools.html#functools.wraps)
- [Glossary: decorator](https://docs.python.org/3.15/glossary.html#term-decorator)
- [PEP 318: decorators for functions and methods](https://peps.python.org/pep-0318/)
