---
title: Functions
summary: Define your own functions with def, tell parameters from arguments, call with positional and keyword arguments, give parameters defaults and avoid the mutable default trap, return values (or None, or several at once), document with docstrings, and take a first look at *args, **kwargs and generator functions.
minutes: 35
objectives:
  - Define and call functions, and explain the difference between parameters and arguments
  - Call a function with positional, keyword and mixed arguments, and give parameters default values safely
  - Use return to hand back one value or several, and explain where None comes from
  - Write a docstring, and recognise *args, **kwargs and a generator function using yield
---

## Outline

1. Why functions
2. Defining and calling
3. `return` and `None`
4. Positional and keyword arguments
5. Default values and the mutable default trap
6. Returning several values
7. Functions can change mutable arguments
8. A first look at `*args` and `**kwargs`
9. A first look at generators

## Why functions

A **function** is a named block of code that does one job. You have used built-in ones since
lesson 2: `print`, `len`, `int`. Writing your own lets you name a piece of logic, write it once
and use it many times, and test it on its own. A good function is short, does one thing, and has
a name that says what: `price_with_tax`, not `calc2`.

## Defining and calling

`def` starts a **function definition**: the name, the **parameters** in parentheses, a colon,
and an indented **body**. The first line of the body may be a **docstring**, a string that says
what the function does; tools and `help()` show it, and PEP 257 asks for one in every public
function.

```python
def greet(name):
    """Return a friendly greeting for name."""
    return f"Hello, {name}!"


message = greet("Ada")
print(message)
print(greet("Bo").upper())
print(greet.__doc__)
```

```text
Hello, Ada!
HELLO, BO!
Return a friendly greeting for name.
```

Running `def` does not run the body; it creates a function object and binds the name `greet` to
it. The body runs when you **call** the function with parentheses: `greet("Ada")`. The value in
the call, `"Ada"`, is an **argument**; the name in the definition, `name`, is a **parameter**,
a local variable that is bound to the argument during the call. A function must be defined before
the line that calls it runs. PEP 8 puts two blank lines around top-level functions.

## `return` and `None`

`return` ends the function and hands a value back to the caller, where the call expression
becomes that value. A function that reaches the end of its body without `return`, or has a bare
`return`, returns **`None`**, Python's object for "no value".

```python
def show_total(a, b):
    print(a + b)


def total(a, b):
    return a + b


result = show_total(2, 3)
print(result)
print(total(2, 3) * 10)
```

```text
5
None
50
```

`show_total` **prints** but returns nothing, so `result` is `None`. `total` **returns** a value
the caller can keep using. Prefer returning: the caller then decides whether to print, store or
calculate further. `None` is a keyword; test for it with `is None`, as PEP 8 recommends.

## Positional and keyword arguments

Arguments are matched to parameters in two ways. **Positional arguments** are matched by order.
**Keyword arguments** are written `name=value` and matched by name, in any order. You may mix
them, but positional ones must come first.

```python
def price_with_tax(amount, rate=0.2, rounded=True):
    """Return amount plus tax at rate, rounded to cents unless rounded is False."""
    result = amount * (1 + rate)
    if rounded:
        result = round(result, 2)
    return result


print(price_with_tax(10))
print(price_with_tax(10, 0.05))
print(price_with_tax(9.99, rounded=False))
print(price_with_tax(rate=0.1, amount=50))
print(price_with_tax())
```

```text
12.0
10.5
11.988
55.0
Traceback (most recent call last):
  File "/tmp/c.py", line 13, in <module>
    print(price_with_tax())
          ~~~~~~~~~~~~~~^^
TypeError: price_with_tax() missing 1 required positional argument: 'amount'
```

Keyword arguments make calls readable (`rounded=False` says more than a bare `False`) and let you
skip parameters that have defaults. Other mistakes in a call are reported just as clearly:

```text
price_with_tax(rate=0.1, 50)   ->  SyntaxError: positional argument follows keyword argument
price_with_tax(10, amount=5)   ->  TypeError: price_with_tax() got multiple values for argument 'amount'
price_with_tax(10, tax=5)      ->  TypeError: price_with_tax() got an unexpected keyword argument 'tax'
```

## Default values and the mutable default trap

A parameter with `=value` has a **default value** and becomes optional. Parameters with defaults
come after those without. The default is evaluated **once, when `def` runs**, not at each call.
For numbers and strings that never matters. For a list it does:

```python
def add_item(item, basket=[]):
    basket.append(item)
    return basket


print(add_item("tea"))
print(add_item("milk"))


def add_item_safely(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket


print(add_item_safely("tea"))
print(add_item_safely("milk"))
```

```text
['tea']
['tea', 'milk']
['tea']
['milk']
```

Every call of `add_item` without a basket shares the **same** list, created once. The fix is the
standard idiom: default to `None` and create a new list inside the function.

## Returning several values

`return a, b` returns one tuple, which the caller usually unpacks (lesson 10):

```python
def min_max(values):
    """Return the smallest and the largest of values."""
    return min(values), max(values)


low, high = min_max([7, 2, 9, 4])
print(low, high)
print(min_max([5]))
```

```text
2 9
(5, 5)
```

## Functions can change mutable arguments

An argument is not copied: the parameter is bound to the caller's object. Rebinding the parameter
inside the function has no effect outside, but **changing** a mutable object does:

```python
def add_bonus(scores, bonus):
    for i in range(len(scores)):
        scores[i] += bonus


marks = [70, 85]
add_bonus(marks, 5)
print(marks)
```

```text
[75, 90]
```

This is useful, as long as the function's name and docstring make it clear that it changes its
argument. A function that changes its argument usually returns `None`, like `list.sort()`.

## A first look at `*args` and `**kwargs`

A parameter written `*name` collects any number of extra positional arguments into a **tuple**,
and `**name` collects extra keyword arguments into a **dict**. By convention they are called
`*args` and `**kwargs`. That is how `print` accepts any number of values.

```python
def average(*numbers):
    return sum(numbers) / len(numbers)


def describe(name, **details):
    print(name, details)


print(average(2, 4, 9))
describe("Ada", born=1815, field="mathematics")
```

```text
5.0
Ada {'born': 1815, 'field': 'mathematics'}
```

The medium level covers these, and keyword-only parameters, in depth.

## A first look at generators

A function containing **`yield`** is a **generator function**. Calling it does not run the body;
it returns a generator, which produces values one at a time when a loop asks. Each `yield` hands
out a value and pauses the function, keeping its local variables, until the next value is wanted.

```python
def countdown(start):
    while start > 0:
        yield start
        start -= 1


for n in countdown(3):
    print(n)
print(list(countdown(5)))
```

```text
3
2
1
[5, 4, 3, 2, 1]
```

Like `range`, a generator makes values on demand instead of building a whole list. The medium
level shows generators properly.

## Common mistakes

- **Printing instead of returning.** A function that only prints gives `None` to its caller.
- **Forgetting `return`.** `def square(n): n * n` computes and throws the result away;
  `print(square(4))` prints `None`.
- **Forgetting the parentheses.** `greet` is the function object; `greet()` calls it.
- **A list or dict as a default value.** Use `None` and create it inside.
- **Calling before defining.** Calling `greet` above its `def` gives `NameError`.

## Practice

1. Write `initials(full_name, separator=".")` so that `initials("ada king lovelace")` returns
   `"A.K.L."` and `initials("grace hopper", separator="")` returns `"GH"`.
2. Write `stats(numbers)` returning the count, total and mean, and unpack its result for
   `[3, 5, 10]`.
3. Write a generator `evens(limit)` that yields the even numbers from 0 up to `limit`.

### Answers

1. ```python
   def initials(full_name, separator="."):
       """Return the initials of full_name, each followed by separator."""
       letters = ""
       for word in full_name.split():
           letters += word[0].upper() + separator
       return letters
   ```

   `split()` gives the words, and `word[0]` is the first letter of each.

2. ```python
   def stats(numbers):
       """Return the count, total and mean of numbers."""
       count = len(numbers)
       total = sum(numbers)
       return count, total, total / count


   n, t, m = stats([3, 5, 10])
   print(n, t, m)
   ```

   ```text
   3 18 6.0
   ```

3. ```python
   def evens(limit):
       for n in range(0, limit + 1, 2):
           yield n


   print(list(evens(9)))
   ```

   ```text
   [0, 2, 4, 6, 8]
   ```

## Key takeaways

- `def name(parameters):` defines a function; calling it with arguments runs the body.
- `return` hands back a value; without one, a function returns `None`.
- Arguments go by position or by keyword; positional ones come first.
- Defaults are evaluated once: never use a mutable default, use `None`.
- `return a, b` returns a tuple; functions can change mutable arguments.
- `*args` and `**kwargs` collect extra arguments; `yield` makes a generator.

## Further reading

- [Tutorial: Defining functions](https://docs.python.org/3.15/tutorial/controlflow.html#defining-functions)
- [Tutorial: More on defining functions](https://docs.python.org/3.15/tutorial/controlflow.html#more-on-defining-functions)
- [PEP 257: Docstring conventions](https://peps.python.org/pep-0257/)
- [Glossary: argument and parameter](https://docs.python.org/3.15/glossary.html#term-parameter)
