---
title: Exceptions in Depth
summary: Design your own exception classes and hierarchies, give them attributes and `args`, chain exceptions with `raise ... from`, add notes, report many errors at once with exception groups and `except*`, use `assert` only for what it is for, and choose between the EAFP and LBYL styles.
minutes: 40
objectives:
  - Define an exception hierarchy for a module, with a base class, attributes and a meaningful message
  - Chain exceptions with `raise ... from` and explain the two kinds of chained tracebacks
  - Add context with `add_note` and re-raise with a bare `raise`
  - Raise several errors together with `ExceptionGroup` and handle them with `except*`
  - Use `assert` for internal checks only, and choose between EAFP and LBYL
---

## Outline

1. Why define your own exceptions
2. An exception hierarchy
3. Chaining: `raise ... from`
4. Notes and re-raising
5. Exception groups and `except*`
6. `assert`
7. EAFP and LBYL

## Why define your own exceptions

The basic course caught built-in exceptions such as ValueError and KeyError and raised them with `raise`. A module of your own often meets problems that no built-in exception names well: an unknown unit in a recipe, a booking for a date in the past. Its own exception classes let callers catch exactly those problems, by name, and let the exception carry useful data along with the message.

An exception class is an ordinary class (lesson 7) that inherits, directly or indirectly, from `Exception`. Do not inherit from `BaseException` directly: it is the root shared with `KeyboardInterrupt` and `SystemExit`, and `except Exception` would not catch your error. By convention the name ends in `Error`.

## An exception hierarchy

A module usually defines one **base exception** and subclasses for the specific problems. Save this as `recipe.py`:

```python
GRAMS_PER_UNIT = {"g": 1, "kg": 1000, "tbsp": 15}


class RecipeError(Exception):
    """Base class for every error this module raises."""


class UnknownUnitError(RecipeError):
    def __init__(self, unit):
        super().__init__(f"unknown unit {unit!r}")
        self.unit = unit


class QuantityError(RecipeError, ValueError):
    """A quantity that is not a positive number."""


def to_grams(amount, unit):
    if unit not in GRAMS_PER_UNIT:
        raise UnknownUnitError(unit)
    if amount <= 0:
        raise QuantityError(f"amount must be positive, not {amount}")
    return amount * GRAMS_PER_UNIT[unit]
```

and use it from `units.py` next to it:

```python
from recipe import RecipeError, UnknownUnitError, to_grams

for amount, unit in [(1.5, "kg"), (2, "cups"), (-3, "g")]:
    try:
        print(to_grams(amount, unit))
    except UnknownUnitError as error:
        print("unit:", error, "|", error.unit, "|", error.args)
    except RecipeError as error:
        print("recipe:", error, "|", isinstance(error, ValueError))
```

```text
1500.0
unit: unknown unit 'cups' | cups | ("unknown unit 'cups'",)
recipe: amount must be positive, not -3 | True
```

- A class with only a docstring is a complete exception: it inherits everything from `Exception`, including an `__init__` that stores its arguments.
- Every exception keeps the arguments it was created with in the tuple `args`, and `str(error)` shows them. `UnknownUnitError` passes a message to `super().__init__` and stores the unit as an attribute, so a handler can use the data instead of parsing the message.
- An `except` clause catches the named class **and its subclasses**. `except RecipeError` catches every error of the module, so the specific clauses must come first; the first matching clause wins. A tuple catches several classes in one clause: `except (UnknownUnitError, QuantityError) as error:`.
- `QuantityError` also inherits from ValueError (multiple inheritance, lesson 9), so code that already catches ValueError for bad numbers catches it too.

Keep hierarchies shallow: one base and a few subclasses that callers really handle differently.

## Chaining: `raise ... from`

When you catch a low-level exception and raise your own, keep the original as the **cause**:

```python
from recipe import QuantityError


def parse_amount(text):
    try:
        return float(text)
    except ValueError as error:
        raise QuantityError(f"not a number: {text!r}") from error


print(parse_amount("2.5"))
parse_amount("two")
```

```text
2.5
Traceback (most recent call last):
  File "/tmp/project/parse.py", line 6, in parse_amount
    return float(text)
ValueError: could not convert string to float: 'two'

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/tmp/project/parse.py", line 12, in <module>
    parse_amount("two")
    ~~~~~~~~~~~~^^^^^^^
  File "/tmp/project/parse.py", line 8, in parse_amount
    raise QuantityError(f"not a number: {text!r}") from error
recipe.QuantityError: not a number: 'two'
```

`from error` stores the ValueError in the new exception's `__cause__`, and the traceback shows both, oldest first. Callers see your module's error; whoever debugs sees what really happened.

Raising inside an `except` block without `from` still links them, through `__context__`, but the traceback then says "During handling of the above exception, another exception occurred:", which suggests a bug in the handler. `raise ... from None` hides the original when it adds nothing.

## Notes and re-raising

Sometimes a function cannot handle an error, but knows something that would help. Since Python 3.11 you can attach text with `add_note` and pass the exception on with a bare `raise`, which re-raises the exception being handled:

```python
from recipe import RecipeError, to_grams


def total_grams(lines):
    total = 0
    for number, line in enumerate(lines, start=1):
        try:
            amount, unit = line.split()
            total += to_grams(float(amount), unit)
        except RecipeError as error:
            error.add_note(f"line {number}: {line!r}")
            raise
    return total


print(total_grams(["200 g", "2 tbsp"]))
total_grams(["200 g", "1 cup"])
```

```text
230.0
Traceback (most recent call last):
  File "/tmp/project/notes.py", line 17, in <module>
    total_grams(["200 g", "1 cup"])
    ~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^
  File "/tmp/project/notes.py", line 9, in total_grams
    total += to_grams(float(amount), unit)
             ~~~~~~~~^^^^^^^^^^^^^^^^^^^^^
  File "/tmp/project/recipe.py", line 20, in to_grams
    raise UnknownUnitError(unit)
recipe.UnknownUnitError: unknown unit 'cup'
line 2: '1 cup'
```

The note appears under the message. The bare `raise` keeps the original traceback, which `raise error` would also do, but `raise` states the intent: this handler only adds information.

## Exception groups and `except*`

A validator that stops at the first problem makes the user fix errors one at a time. An `ExceptionGroup` (Python 3.11) carries a list of exceptions raised together, and `except*` handles each kind inside it:

```python
from recipe import QuantityError, RecipeError, UnknownUnitError, to_grams


def check_all(lines):
    problems = []
    for number, line in enumerate(lines, start=1):
        amount, unit = line.split()
        try:
            to_grams(float(amount), unit)
        except RecipeError as error:
            error.add_note(f"line {number}")
            problems.append(error)
    if problems:
        raise ExceptionGroup("the recipe has problems", problems)


try:
    check_all(["200 g", "1 cup", "-5 g", "3 pinch"])
except* UnknownUnitError as group:
    print("units:", [error.unit for error in group.exceptions])
except* QuantityError as group:
    print("quantities:", [str(error) for error in group.exceptions])
```

```text
units: ['cup', 'pinch']
quantities: ['amount must be positive, not -5.0']
```

Unlike `except`, **every** matching `except*` clause runs, each receiving a group of just the exceptions it matches, in `group.exceptions`. Exceptions no clause matches are raised again in a new group. A plain `except ExceptionGroup` catches the whole group, and one block cannot mix `except` and `except*`. Use groups when several independent errors are really reported together; most code needs only ordinary exceptions.

## `assert`

`assert condition, message` raises `AssertionError(message)` when the condition is false. It states something the programmer believes **cannot** be false, and documents it:

```python
def average(values):
    assert values, "average() needs at least one value"
    return sum(values) / len(values)


print(average([4, 5, 9]))
print(average([]))
```

```text
6.0
Traceback (most recent call last):
  File "/tmp/project/e.py", line 7, in <module>
    print(average([]))
          ~~~~~~~^^^^
  File "/tmp/project/e.py", line 2, in average
    assert values, "average() needs at least one value"
           ^^^^^^
AssertionError: average() needs at least one value
```

Run with `python -O`, Python removes every `assert`, and the same call ends in `ZeroDivisionError: division by zero` instead. So never use `assert` to check user input, file contents or arguments of a public function; raise ValueError or your own exception for those. Use it for internal sanity checks and in tests, as the labs of this course do.

## EAFP and LBYL

Two styles deal with a situation that may fail. **LBYL**, "look before you leap", checks first: `if key in stock: qty = stock[key]`. **EAFP**, "easier to ask forgiveness than permission", just tries and handles the exception: `try: qty = stock[key]` with `except KeyError: qty = 0`. Python code favours EAFP: the check and the action cannot drift apart, and the exception names the exact problem. A file can vanish between `exists()` and `open()`, but `try: open(...)` cannot be fooled. Where a method does the job, use it: `stock.get(key, 0)`.

## Common mistakes

- **A broad clause first**: `except RecipeError` above `except UnknownUnitError` makes the second one unreachable.
- **Catching everything**: `except Exception: pass` hides bugs. Catch what you can handle.
- **Losing the cause**: raise your own error `from` the original.
- **`assert` for validation**, which disappears with `-O`.

## Practice

1. Add `ServingsError(RecipeError)` with an attribute `servings`, raised by `scale(grams, servings)` when `servings` is not between 1 and 50.
2. What does `print(isinstance(QuantityError("x"), (ValueError, KeyError)))` print?

### Answers

```python
from recipe import RecipeError


class ServingsError(RecipeError):
    def __init__(self, servings):
        super().__init__(f"servings must be 1 to 50, not {servings}")
        self.servings = servings


def scale(grams, servings):
    if not 1 <= servings <= 50:
        raise ServingsError(servings)
    return grams * servings


try:
    scale(200, 80)
except RecipeError as error:
    print(error, error.servings)
```

```text
servings must be 1 to 50, not 80 80
```

The handler prints the message, then the `servings` attribute.

2. `True`: `QuantityError` is a ValueError, and `isinstance` with a tuple accepts any of its classes.

## Key takeaways

- Derive exceptions from `Exception`, give a module one base class, and catch specific classes first.
- Exceptions carry `args` and any attributes you add; handlers should use data, not parse messages.
- `raise New(...) from error` keeps the cause; a bare `raise` re-raises after `add_note`.
- `ExceptionGroup` and `except*` report and handle several errors at once.
- `assert` is for internal checks and vanishes with `-O`; Python prefers EAFP.

## Further reading

- [The Python Tutorial: Errors and Exceptions](https://docs.python.org/3.15/tutorial/errors.html)
- [Built-in exceptions](https://docs.python.org/3.15/library/exceptions.html)
- [The raise and assert statements](https://docs.python.org/3.15/reference/simple_stmts.html#the-raise-statement)
- [Glossary: EAFP](https://docs.python.org/3.15/glossary.html#term-EAFP)
