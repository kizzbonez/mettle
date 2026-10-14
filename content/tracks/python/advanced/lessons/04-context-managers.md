---
title: Context Managers
summary: Understand what `with` really does, write context managers as classes with `__enter__` and `__exit__` and as generators with `contextlib.contextmanager`, and use the standard helpers `suppress`, `redirect_stdout` and `ExitStack`.
minutes: 35
objectives:
  - Explain the steps of a `with` statement and when `__exit__` runs
  - Write a class-based context manager that reacts to an exception and decides whether to suppress it
  - Write a generator-based context manager with `contextlib.contextmanager` and `try`/`finally`
  - Use `suppress`, `redirect_stdout` and `ExitStack` from `contextlib`
---

## Outline

1. Resources that must always be released
2. The context manager protocol
3. Handling exceptions in `__exit__`
4. Generator-based context managers
5. Helpers from `contextlib`
6. A variable number of resources with `ExitStack`

## Resources that must always be released

Some things must be undone whatever happens: a file must be closed, a lock released, a
temporary setting restored, a half-finished change rolled back. Idiomatic Python opened files
with `with open(...) as f:` so that the file closes even when the block raises. Without `with`,
the same guarantee needs `try`/`finally` every time. The `with` statement packages that
`try`/`finally` into an object, a **context manager**, so the cleanup is written once and reused.

## The context manager protocol

A context manager is any object with two special methods:

- `__enter__(self)` runs at the start of the block. Its return value is bound to the name after
  `as`, if there is one.
- `__exit__(self, exc_type, exc, tb)` runs when the block ends, however it ends: normally, with
  `return` or `break`, or with an exception. The language reference guarantees that once
  `__enter__` has returned, `__exit__` is called.

```python
class Announce:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print(f"enter {self.name}")
        return self.name.upper()

    def __exit__(self, exc_type, exc, tb):
        print(f"exit {self.name}, exception: {exc_type and exc_type.__name__}")
        return False


with Announce("door") as value:
    print(f"inside, value is {value}")

try:
    with Announce("window"):
        raise ValueError("stuck")
except ValueError as error:
    print(f"caught {error}")
```

```text
enter door
inside, value is DOOR
exit door, exception: None
enter window
exit window, exception: ValueError
caught stuck
```

Note that `as` receives what `__enter__` returns, not the manager itself. A file's `__enter__`
returns the file, which is why `with open(...) as f` gives you the file.

## Handling exceptions in `__exit__`

When the block ends normally, `__exit__` receives three `None`s. When it raises, it receives the
exception's type, the exception object and its traceback. The **return value** then decides what
happens: a false value (including `None`, the result of having no `return`) lets the exception
carry on; a true value **suppresses** it, and the program continues after the `with` block.

This class applies changes to a dictionary only when the whole block succeeds:

```python
class Transaction:
    """Applies the changes to a dict only if the block finishes without an error."""

    def __init__(self, data):
        self.data = data

    def __enter__(self):
        self.draft = dict(self.data)
        return self.draft

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            self.data.clear()
            self.data.update(self.draft)
        return False  # never hide the error


stock = {"pens": 4, "pads": 2}
with Transaction(stock) as draft:
    draft["pens"] -= 1
print(stock)

try:
    with Transaction(stock) as draft:
        draft["pads"] -= 1
        draft["ink"] -= 1
except KeyError as error:
    print(f"rolled back, no {error}")
print(stock)
```

```text
{'pens': 3, 'pads': 2}
rolled back, no 'ink'
{'pens': 3, 'pads': 2}
```

The second block changed `pads` in the draft and then failed, so nothing reached `stock`.
Returning `False` keeps the error visible to the caller. Return `True` only from a manager whose
purpose is to swallow certain errors.

## Generator-based context managers

Writing a class is verbose for simple cases. The decorator `contextlib.contextmanager` turns a
generator function into a context manager. Everything before the single `yield` is the
`__enter__` part, the yielded value is bound by `as`, and everything after it is the `__exit__`
part. If the block raises, the exception is raised **inside the generator at the `yield`**, so
cleanup that must always run belongs in `finally`:

```python
from contextlib import contextmanager


@contextmanager
def section(title):
    print(f"<{title}>")
    try:
        yield title.upper()
    finally:
        print(f"</{title}>")


with section("main") as name:
    print(f"content of {name}")

try:
    with section("aside"):
        raise RuntimeError("render failed")
except RuntimeError as error:
    print(f"caught {error}")
```

```text
<main>
content of MAIN
</main>
<aside>
</aside>
caught render failed
```

The closing tag appeared even though the block failed. Without `try`/`finally`, the exception
would leave the generator at the `yield` and `</aside>` would never print. The generator must
yield exactly once: yielding twice raises `RuntimeError: generator didn't stop`, and never
yielding raises `RuntimeError: generator didn't yield`.

A manager made with `@contextmanager` also works as a decorator, wrapping each call of a function
in the context. Python 3.15 extends this to generator and coroutine functions, keeping the
context open until the generator or coroutine finishes rather than closing it as soon as the
object is created.

## Helpers from `contextlib`

- `suppress(*exceptions)` ignores the listed exceptions inside the block, the same as
  `try`/`except`/`pass`. Use it only for errors that are truly expected.
- `redirect_stdout(target)` temporarily sends `print` output to another file object, such as an
  `io.StringIO`. It changes `sys.stdout` for the whole program, so the docs warn it is not suitable
  for library code or threaded programs.
- `nullcontext()` does nothing, a stand-in where a context manager is optional.

```python
import io
from contextlib import redirect_stdout, suppress

stock = {"pens": 4}
with suppress(KeyError):
    del stock["erasers"]
print("still running", stock)

buffer = io.StringIO()
with redirect_stdout(buffer):
    print("captured line")
print(repr(buffer.getvalue()))
```

```text
still running {'pens': 4}
'captured line\n'
```

Several managers can share one `with`: `with open(a) as src, open(b, "w") as dst:` behaves like
two nested `with` statements, and since 3.10 the items may be wrapped in parentheses over several
lines.

## A variable number of resources with `ExitStack`

When the number of resources is known only at run time, `contextlib.ExitStack` collects them.
`enter_context(cm)` enters a manager and remembers its exit, `callback(func, *args)` registers
any cleanup function, and when the stack closes it unwinds everything in reverse order, last in,
first out.

```python
from contextlib import ExitStack, contextmanager


@contextmanager
def section(title):
    print(f"<{title}>")
    try:
        yield
    finally:
        print(f"</{title}>")


with ExitStack() as stack:
    for title in ["html", "body", "main"]:
        stack.enter_context(section(title))
    stack.callback(print, "callback registered last runs first")
    print("content")
```

```text
<html>
<body>
<main>
content
callback registered last runs first
</main>
</body>
</html>
```

If entering the third section had failed, the two already entered would still have been closed.
That is the reason to use `ExitStack` instead of a list of managers you close by hand.

## Common mistakes

- **No `finally` around `yield`.** In a `@contextmanager` generator, an exception in the block
  skips the code after `yield`. Put cleanup in `finally`.
- **Returning a true value from `__exit__` by accident.** It silently swallows every exception.
  Return `False` or nothing unless suppression is the point.
- **Using the resource after the block.** After `with open("notes.txt", "w") as notes:`, a later
  `notes.write("more")` fails with `ValueError: I/O operation on closed file.`
- **`suppress(Exception)`.** It hides bugs along with the expected error; name the exact
  exception.

## Practice

1. Write a class `Indent` whose instances hold a `level`; `with Indent(state):` adds 1 to
   `state.level` on entry and subtracts 1 on exit, even if the block raises.
2. Write the same `Transaction` behaviour with `@contextmanager`.
3. What does `with suppress(ZeroDivisionError): print(1 / 0); print("after")` print, if the two
   prints are both inside the block?

### Answers

1. The decrement goes in `__exit__`, which runs on every way out:

   ```python
   class Indent:
       def __init__(self, state):
           self.state = state

       def __enter__(self):
           self.state.level += 1
           return self.state

       def __exit__(self, exc_type, exc, tb):
           self.state.level -= 1
           return False
   ```

2. An exception in the block is raised at `yield`, so the commit after it is skipped:

   ```python
   @contextmanager
   def transaction(data):
       draft = dict(data)
       yield draft
       data.clear()
       data.update(draft)
   ```

3. Nothing. The division raises before the first `print` finishes, `suppress` swallows the error,
   and the rest of the block is skipped: execution continues after the `with` statement.

## Key takeaways

- `with` calls `__enter__`, binds its result with `as`, runs the block, and always calls
  `__exit__`.
- `__exit__` receives the exception (or three `None`s); a true return value suppresses it.
- `@contextmanager` turns a one-`yield` generator into a context manager; use `try`/`finally`.
- `suppress`, `redirect_stdout`, `nullcontext` and `ExitStack` cover common needs.
- `ExitStack` manages any number of resources and unwinds them in reverse order.

## Further reading

- [Language reference: the with statement](https://docs.python.org/3.15/reference/compound_stmts.html#the-with-statement)
- [contextlib: utilities for with-statement contexts](https://docs.python.org/3.15/library/contextlib.html)
- [Data model: with statement context managers](https://docs.python.org/3.15/reference/datamodel.html#with-statement-context-managers)
- [PEP 343: the "with" statement](https://peps.python.org/pep-0343/)
