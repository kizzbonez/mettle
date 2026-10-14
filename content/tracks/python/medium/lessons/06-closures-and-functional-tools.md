---
title: Closures and Functional Tools
summary: Write functions inside functions that remember their surroundings, change an enclosing variable with `nonlocal`, avoid the late-binding trap, and use key functions, `map`, `filter`, `operator.itemgetter` and `attrgetter`, `functools.partial` and `reduce`.
minutes: 35
objectives:
  - Write a closure that remembers a value from its enclosing function, and explain why it works
  - Rebind an enclosing variable with `nonlocal` and explain the UnboundLocalError without it
  - Recognize and fix the late-binding pitfall for functions created in a loop
  - Sort and pick with `key` functions, including `itemgetter` and `attrgetter`
  - Choose between `map`/`filter` and comprehensions, and use `partial` and `reduce`
---

## Outline

1. Nested functions and closures
2. Changing an enclosing variable: `nonlocal`
3. The late-binding pitfall
4. Key functions for `sorted`, `min` and `max`
5. `map` and `filter`
6. `operator.itemgetter` and `attrgetter`
7. `functools.partial` and `reduce`

## Nested functions and closures

A `def` can appear inside another function. The inner function is then a local variable of the outer one, created each time the outer function runs. Because functions are objects (lesson 5), the outer function can **return** it:

```python
def make_multiplier(factor):
    def multiply(value):
        return value * factor

    return multiply


double = make_multiplier(2)
triple = make_multiplier(3)
print(double(10), triple(10))
print(double.__name__, double.__closure__[0].cell_contents)
```

```text
20 30
multiply 2
```

`make_multiplier(2)` has returned and its local `factor` is gone from the call stack, yet `double` still knows that `factor` is 2. In the LEGB rule from the basic course, `factor` is in the **E**nclosing scope of `multiply`. When Python sees that an inner function uses a variable of the enclosing function, it keeps that variable alive in a **cell** attached to the inner function. A function together with the enclosing variables it remembers is a **closure**. Each call of `make_multiplier` creates a new `multiply` with its own cell, so `double` and `triple` do not interfere.

Closures let you build specialised functions from a general one, and give a function private, remembered settings without a global variable or a class.

## Changing an enclosing variable: `nonlocal`

Reading an enclosing variable needs nothing. Assigning to it is different:

```python
def make_counter():
    count = 0

    def increment():
        nonlocal count
        count += 1
        return count

    return increment


clicks = make_counter()
clicks()
clicks()
print(clicks())
visits = make_counter()
print(visits())
```

```text
3
1
```

Without the `nonlocal` line, the first call fails:

```text
  File "/tmp/b2.py", line 5, in increment
    count += 1
    ^^^^^
UnboundLocalError: cannot access local variable 'count' where it is not associated with a value
```

An assignment anywhere in a function, including `+=`, makes that name **local** to the function for its whole body. So `count += 1` reads a local `count` that has no value yet. `nonlocal count` says: this name is the variable of the nearest enclosing function. It is to enclosing functions what `global` is to the module, and it fails at compile time if no enclosing function has that variable. Each counter keeps its own count, which a single global could not do.

## The late-binding pitfall

A closure remembers the **variable**, not the value it had when the inner function was created. It looks the value up when it is called:

```python
greeters = []
for name in ["Ada", "Grace", "Linus"]:
    greeters.append(lambda: f"Hi {name}")
print([greet() for greet in greeters])

greeters = []
for name in ["Ada", "Grace", "Linus"]:
    greeters.append(lambda name=name: f"Hi {name}")
print([greet() for greet in greeters])
```

```text
['Hi Linus', 'Hi Linus', 'Hi Linus']
['Hi Ada', 'Hi Grace', 'Hi Linus']
```

All three lambdas in the first loop use the same variable `name`, which holds `"Linus"` by the time they run. The fix uses lesson 5's rule that defaults are evaluated when the function is defined: `name=name` copies the current value into a parameter of each lambda. A factory such as `make_multiplier`, called once per value, fixes it too. This applies to `def` as much as to `lambda`.

## Key functions for `sorted`, `min` and `max`

`sorted`, `list.sort`, `min` and `max` accept `key=`, a function called **once per item**. Items are then compared by what it returns, not by themselves:

```python
words = ["banana", "Apple", "cherry", "Fig"]
print(sorted(words))
print(sorted(words, key=str.casefold))
print(sorted(words, key=len))
print(sorted(words, key=len, reverse=True))
print(max(words, key=len), min(words, key=str.casefold))
times = [("Ines", 41, 32), ("Tom", 38, 5), ("Ana", 41, 2), ("Raj", 38, 59)]
print(sorted(times, key=lambda entry: (entry[1], entry[2])))
print(min(times, key=lambda entry: entry[1] * 60 + entry[2]))
```

```text
['Apple', 'Fig', 'banana', 'cherry']
['Apple', 'banana', 'cherry', 'Fig']
['Fig', 'Apple', 'banana', 'cherry']
['banana', 'cherry', 'Apple', 'Fig']
banana Apple
[('Tom', 38, 5), ('Raj', 38, 59), ('Ana', 41, 2), ('Ines', 41, 32)]
('Tom', 38, 5)
```

- Pass the function itself: `key=len`, not `key=len()`. A method works too, as `str.casefold`.
- Python's sort is **stable**: items with equal keys keep their original order. `banana` and `cherry` both have 6 letters and stay in input order, even with `reverse=True`.
- To sort by several things, return a **tuple**: tuples compare element by element, so `(minutes, seconds)` sorts by minutes, then seconds. To reverse one part only, negate a number: `key=lambda pair: (-pair[1], pair[0])`.
- `max(words, key=len)` returns the item, not its length. With ties it returns the first.

## `map` and `filter`

`map(function, iterable)` calls the function on every item; `filter(function, iterable)` keeps the items for which it returns a true value. Both are **lazy**: they return an iterator that produces values on demand, once, like a generator expression:

```python
prices = ["4.50", "3", "", "6.25"]
numbers = map(float, filter(None, prices))
print(type(numbers).__name__, list(numbers), list(numbers))
print([float(price) for price in prices if price])
print(list(map(lambda a, b: a * b, [1, 2, 3], [4, 5, 6])))
print(list(filter(str.isdecimal, ["12", "x", "7"])))
```

```text
map [4.5, 3.0, 6.25] []
[4.5, 3.0, 6.25]
[4, 10, 18]
['12', '7']
```

`filter(None, ...)` keeps the truthy items, dropping the empty string. The second `list(numbers)` is empty: the iterator was used up. With several iterables, `map` passes one item from each.

Which to use? When a function already exists (`float`, `str.isdecimal`), `map` and `filter` read well. When you would need a `lambda`, a comprehension is usually clearer: `[p * 1.2 for p in prices]` beats `map(lambda p: p * 1.2, prices)`.

## `operator.itemgetter` and `attrgetter`

The `operator` module provides ready-made functions for common keys. `itemgetter(k)` returns a function that does `obj[k]`; `attrgetter("name")` returns one that does `obj.name`:

```python
from datetime import date
from functools import partial, reduce
from operator import attrgetter, itemgetter, mul

stock = [{"item": "tea", "qty": 12}, {"item": "jam", "qty": 3}, {"item": "eggs", "qty": 30}]
by_qty = sorted(stock, key=itemgetter("qty"))
print([row["item"] for row in by_qty])
print(itemgetter(1, 0)(("x", "y", "z")))
days = [date(2026, 12, 1), date(2025, 3, 9), date(2026, 1, 20)]
print([day.isoformat() for day in sorted(days, key=attrgetter("month"))])
parse_binary = partial(int, base=2)
print(parse_binary("1011"), parse_binary("11111111"))
print(reduce(mul, [1, 2, 3, 4, 5]))
print(reduce(lambda total, word: total + len(word), ["ab", "cde"], 0))
```

```text
['jam', 'tea', 'eggs']
('y', 'x')
['2026-01-20', '2025-03-09', '2026-12-01']
11 255
120
5
```

`itemgetter("qty")` replaces `lambda row: row["qty"]`, and with several keys it returns a tuple, ready for multi-level sorts. `attrgetter` does the same for attributes; dates have `year`, `month` and `day`, and your own classes (next lesson) have theirs. `operator` also has every operator as a function: `mul(a, b)` is `a * b`.

## `functools.partial` and `reduce`

- `partial(func, *args, **kwargs)` returns a new function with some arguments fixed in advance. `partial(int, base=2)` is a ready-made binary parser.
- `reduce(function, iterable, initial)` combines the items pairwise from the left: `reduce(mul, [1, 2, 3, 4, 5])` is `((((1 * 2) * 3) * 4) * 5)`. Give an initial value for an empty iterable or when the result has a different type, as with the total of lengths. Prefer `sum`, `max`, `any` or a loop when they fit; `reduce` is harder to read.

## Common mistakes

- **Calling the key**: `sorted(words, key=len())` raises `TypeError: len() takes exactly one argument (0 given)`.
- **Assigning to an enclosing variable without `nonlocal`**: UnboundLocalError, as shown.
- **Functions created in a loop** that all see the last value. Bind the value with a default or a factory.
- **Reusing a `map` or `filter` object.** It is empty after one pass.

## Practice

1. Write `make_accumulator()` returning a function that adds its argument to a running total and returns the total.
2. Rank `{"Ines": 82, "Tom": 95, "Ana": 82, "Raj": 70}` by score, highest first, ties alphabetically.
3. Make `round2` from `round` with `partial` so that `round2(3.14159)` is `3.14`.

### Answers

```python
from functools import partial


def make_accumulator():
    total = 0

    def add(amount):
        nonlocal total
        total += amount
        return total

    return add


till = make_accumulator()
till(5)
print(till(2.5))
scores = {"Ines": 82, "Tom": 95, "Ana": 82, "Raj": 70}
print(sorted(scores.items(), key=lambda pair: (-pair[1], pair[0])))
round2 = partial(round, ndigits=2)
print(round2(3.14159))
```

```text
7.5
[('Tom', 95), ('Ana', 82), ('Ines', 82), ('Raj', 70)]
3.14
```

`-pair[1]` sorts scores downwards while names still sort upwards.

## Key takeaways

- A closure is an inner function plus the enclosing variables it uses, kept alive after the outer function returns.
- Use `nonlocal` to assign to an enclosing variable; any assignment otherwise makes the name local.
- Closures look values up when called: bind loop values with a default argument.
- `key=` takes a function called once per item; return a tuple for several criteria.
- `map` and `filter` are lazy; `itemgetter`, `attrgetter` and `partial` build small functions for you.

## Further reading

- [Sorting Techniques HOWTO](https://docs.python.org/3.15/howto/sorting.html)
- [Programming FAQ: lambdas defined in a loop](https://docs.python.org/3.15/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result)
- [functools: Higher-order functions](https://docs.python.org/3.15/library/functools.html)
- [operator: Standard operators as functions](https://docs.python.org/3.15/library/operator.html)
