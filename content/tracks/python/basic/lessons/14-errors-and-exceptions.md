---
title: Errors and Exceptions
summary: Tell syntax errors from exceptions, read a traceback that runs through several functions, handle exceptions with try and except, order except branches, use else and finally, know the built-in exception hierarchy, raise your own exceptions, let them travel up to the caller, and validate input in a loop, ending with a complete program.
minutes: 40
objectives:
  - Read a multi-level traceback and say where an exception was raised and how it got there
  - Handle specific exceptions with try, except, else and finally, and order except branches correctly
  - Place the common built-in exceptions in their hierarchy and choose what to catch
  - Raise ValueError with a clear message and let the caller decide how to handle it
  - Validate input in a loop and read input until it ends
---

## Outline

1. Syntax errors and exceptions
2. Reading a traceback through functions
3. `try` and `except`
4. `else` and `finally`
5. The built-in exception hierarchy
6. Ordering except branches
7. Raising exceptions
8. Validating input in a loop
9. A complete program

## Syntax errors and exceptions

A **syntax error** breaks Python's grammar and is found before anything runs (lesson 1). An
**exception** happens while the program runs, when a statement cannot do its job: converting
`"forty"` to an `int`, dividing by zero, looking up a missing key. Exceptions are objects, each
with a **type** such as `ValueError` and a message, and they can be **handled**: your program can
catch one and carry on.

## Reading a traceback through functions

An exception that nobody handles travels up from function to caller until it reaches the top of
the program, which then stops with a traceback.

```python
def parse_age(text):
    return int(text)


def describe(text):
    age = parse_age(text)
    return f"{age} years old"


print(describe("41"))
print(describe("forty"))
```

```text
41 years old
Traceback (most recent call last):
  File "/tmp/a.py", line 11, in <module>
    print(describe("forty"))
          ~~~~~~~~^^^^^^^^^
  File "/tmp/a.py", line 6, in describe
    age = parse_age(text)
  File "/tmp/a.py", line 2, in parse_age
    return int(text)
ValueError: invalid literal for int() with base 10: 'forty'
```

"Most recent call last" means the entries run from the outermost call down to where the error
happened. The **last** line says what went wrong, and the entry above it says where: `parse_age`,
line 2. The entries above that show the path: the top level called `describe` (line 11), which
called `parse_age` (line 6).

## `try` and `except`

A **`try` statement** runs a block and catches exceptions it names:

1. Python runs the **`try` block**. If nothing goes wrong, the `except` blocks are skipped.
2. If an exception happens, the rest of the `try` block is skipped, Python runs the first
   `except` block whose type matches, and the program carries on after the whole statement.
3. If no `except` matches, the exception travels on up, as if there were no `try`.

```python
for text in ["8", "eight", "0"]:
    try:
        number = int(text)
        share = 24 / number
    except ValueError:
        print(f"'{text}' is not a whole number")
    except ZeroDivisionError:
        print("cannot share between nobody")
    else:
        print(f"24 shared by {number} is {share}")
    finally:
        print("checked", text)
print("program continues")
```

```text
24 shared by 8 is 3.0
checked 8
'eight' is not a whole number
checked eight
cannot share between nobody
checked 0
program continues
```

One `try` can have several `except` branches. To treat several types the same way, name them in a
tuple: `except (ValueError, ZeroDivisionError):`. Since Python 3.14 the parentheses may be left
out when there is no `as`. `except ValueError as error:` binds the exception object to `error`,
and `print(error)` or an f-string shows its message.

## `else` and `finally`

- **`else`** runs only if the `try` block raised nothing. Code that depends on success belongs
  there, not in the `try` block, so that its own errors are not caught by mistake.
- **`finally`** runs **always**, even when an unhandled exception is on its way up. It is for
  clean-up that must happen whatever occurred.

The order is fixed: `try`, the `except` branches, `else`, `finally`.

## The built-in exception hierarchy

Exception types form a family tree. An `except` branch catches its type **and every type below
it**:

```text
BaseException
 ├── SystemExit                 raised by sys.exit()
 ├── KeyboardInterrupt          the user pressed Ctrl+C
 └── Exception                  everything a program should normally handle
      ├── ArithmeticError
      │    ├── OverflowError
      │    └── ZeroDivisionError
      ├── LookupError
      │    ├── IndexError
      │    └── KeyError
      ├── AttributeError
      ├── EOFError
      ├── NameError
      │    └── UnboundLocalError
      ├── RuntimeError
      │    └── RecursionError
      ├── TypeError
      └── ValueError
```

`ArithmeticError` and `LookupError` are **abstract** in the everyday sense: Python rarely raises
them itself, but they group related errors so you can catch them together.

```python
stock = {"tea": 4}
for key in ["tea", "coffee"]:
    try:
        print(stock[key] / 0)
    except LookupError as error:
        print("lookup failed:", error)
    except ArithmeticError as error:
        print("arithmetic failed:", error)
try:
    print([1, 2, 3][10])
except LookupError as error:
    print("lookup failed:", error)
```

```text
arithmetic failed: division by zero
lookup failed: 'coffee'
lookup failed: list index out of range
```

`SystemExit` and `KeyboardInterrupt` sit outside `Exception` on purpose, so that
`except Exception:` does not stop the user from interrupting the program. A bare `except:` with
no type catches even those; avoid it.

## Ordering except branches

Python tries the branches from top to bottom and takes the **first** that matches. So a general
type listed first swallows everything below it: with `except Exception:` above
`except IndexError:`, an `IndexError` is caught by the first branch and the second can never run.
Put the most specific types first and the general ones last, just like an `elif` chain.

## Raising exceptions

Your own functions can report a problem with **`raise`**, followed by an exception object, usually
made by calling the type with a message: `raise ValueError("price cannot be negative")`. Raising
stops the function at once, and the exception travels to the caller like any built-in one.

This is how functions **delegate responsibility**: a function that checks data cannot know
whether its caller wants to print, retry or give up, so it raises, and the caller decides.

```python
def parse_quantity(text):
    """Return text as a whole number of at least 1, or raise ValueError."""
    quantity = int(text)
    if quantity < 1:
        raise ValueError(f"quantity must be at least 1, got {quantity}")
    return quantity
```

`int(text)` raises its own `ValueError` for text like `"two"`, which also travels out of
`parse_quantity`. Use `ValueError` for a value of the right type but wrong content, and
`TypeError` for the wrong type altogether.

## Validating input in a loop

Combine a loop with `try` to keep asking until the answer is valid:

```python
while True:
    text = input("How many tickets? ")
    try:
        tickets = parse_quantity(text)
    except ValueError as error:
        print(f"Sorry: {error}")
    else:
        break
print(f"Booking {tickets} tickets.")
```

```text
How many tickets? two
Sorry: invalid literal for int() with base 10: 'two'
How many tickets? 0
Sorry: quantity must be at least 1, got 0
How many tickets? 3
Booking 3 tickets.
```

## A complete program

This program reads temperature readings, one per line, **until the input ends**: `input()` then
raises `EOFError` (lesson 6), the signal to stop. It skips bad lines with a message and prints a
summary. Type the readings and end with Ctrl+D (Ctrl+Z then Enter on Windows).

```python
def parse_reading(text):
    """Return text as a temperature in degrees C, or raise ValueError."""
    value = float(text)
    if not -90 <= value <= 60:
        raise ValueError(f"{value} is outside -90 to 60")
    return value


def summarise(readings):
    """Return a one-line summary of a non-empty list of readings."""
    average = sum(readings) / len(readings)
    return (f"{len(readings)} readings, min {min(readings)}, "
            f"max {max(readings)}, mean {average:.1f}")


readings = []
line_number = 0
while True:
    try:
        line = input()
    except EOFError:
        break
    line_number += 1
    try:
        readings.append(parse_reading(line))
    except ValueError as error:
        print(f"line {line_number}: skipped ({error})")

if readings:
    print(summarise(readings))
else:
    print("no valid readings")
```

With the seven lines `12.5`, `14`, `warm`, an empty line, `13.25`, `120` and `9.5` it prints:

```text
line 3: skipped (could not convert string to float: 'warm')
line 4: skipped (could not convert string to float: '')
line 6: skipped (120.0 is outside -90 to 60)
4 readings, min 9.5, max 14.0, mean 12.3
```

With no input at all it prints `no valid readings`. In `summarise`, the parentheses let the
expression continue on a second line, and two string literals side by side are joined into one.

## Common mistakes

- **Catching too much.** `except:` or `except Exception:` around a big block hides real bugs.
  Catch the specific type, around the few lines that can raise it.
- **General before specific.** An `except Exception` above `except IndexError` makes the second
  unreachable.
- **Silencing errors.** `except ValueError: pass` throws the problem away; at least report it.
- **Code that depends on success inside `try`.** Put it in `else`.

## Practice

1. What does this print?

   ```python
   try:
       print(int("5"))
       print(undefined_name)
   except ValueError:
       print("bad number")
   ```

2. Write `ask_percentage()` that keeps asking until the user enters a whole number from 0 to 100,
   and returns it.
3. Which branch catches `{}["x"]` in a `try` with `except LookupError:` followed by
   `except KeyError:`? How would you fix the order?

### Answers

1. It prints `5`, then stops with `NameError: name 'undefined_name' is not defined`. Only
   `ValueError` is caught, so the `NameError` travels up unhandled.
2. ```python
   def ask_percentage():
       while True:
           text = input("Percentage: ")
           try:
               value = int(text)
           except ValueError:
               print("Please type a whole number.")
               continue
           if 0 <= value <= 100:
               return value
           print("It must be from 0 to 100.")
   ```

   `return` inside the loop ends both the loop and the function.
3. `except LookupError:` catches it, because `KeyError` is a kind of `LookupError`, so the
   `KeyError` branch never runs. Put `except KeyError:` first.

## Key takeaways

- Read tracebacks from the bottom: the error, where it was raised, then the calls that led there.
- `try`/`except` catches named types and their subtypes; `else` runs on success, `finally`
  always.
- Order except branches from specific to general, and catch only what you can handle.
- `raise ValueError("message")` reports a problem and leaves the decision to the caller.
- A `while True` loop with `try` validates input; `EOFError` marks the end of input.

## Further reading

- [Tutorial: Errors and exceptions](https://docs.python.org/3.15/tutorial/errors.html)
- [Built-in exceptions and their hierarchy](https://docs.python.org/3.15/library/exceptions.html#exception-hierarchy)
- [PEP 758: Allow except and except* expressions without parentheses](https://peps.python.org/pep-0758/)
