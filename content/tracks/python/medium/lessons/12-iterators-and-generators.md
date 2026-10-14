---
title: Iterators and Generators
summary: Understand the protocol behind every `for` loop, iterables, iterators, `iter`, `next` and StopIteration, write an iterator class and then the same thing as a generator function with `yield`, delegate with `yield from`, build lazy pipelines and infinite sequences, and use `itertools.count`, `islice` and `chain`.
minutes: 40
objectives:
  - Distinguish an iterable from an iterator and drive one by hand with `iter` and `next`
  - Write an iterator class with `__iter__` and `__next__`
  - Write generator functions with `yield` and predict when their code runs
  - Delegate to another iterable with `yield from` and chain generators into a pipeline
  - Work with infinite generators through `itertools.count`, `islice` and `chain`
---

## Outline

1. Iterables and iterators
2. What a `for` loop really does
3. An iterator class
4. Generator functions and `yield`
5. Generator state and laziness
6. Pipelines and `yield from`
7. Infinite generators and `itertools`

## Iterables and iterators

You have looped over lists, strings, dictionaries, files, `range`, `map` objects and generator expressions. They all speak one **protocol**, a set of methods Python relies on:

- An **iterable** is any object you can loop over. It has a method `__iter__` that returns an iterator. Lists, strings and dicts are iterables.
- An **iterator** is an object that produces the values, one per call of its `__next__` method, and raises **StopIteration** when there are no more. It also has `__iter__`, returning itself, so an iterator is an iterable too.

The built-in functions `iter(obj)` and `next(it)` call these methods for you:

```python
colours = ["red", "green"]
it = iter(colours)
print(type(colours).__name__, type(it).__name__)
print(next(it), next(it))
print(next(it, "no more"))
print(iter(it) is it, iter(colours) is iter(colours))
next(it)
```

```text
list list_iterator
red green
no more
True False
Traceback (most recent call last):
  File "/tmp/a.py", line 7, in <module>
    next(it)
    ~~~~^^^^
StopIteration
```

The list holds data; the iterator holds a **position** in it. Each `iter(colours)` call creates a new, independent iterator, which is why you can loop over a list many times. An iterator moves only forwards and, once used up, stays used up: that is why a generator expression, a `map` and a file can be read only once. `next(it, default)` returns the default instead of raising at the end.

## What a `for` loop really does

`for item in items: print(item)` is shorthand for:

```python
items = ["tea", "jam"]
iterator = iter(items)
while True:
    try:
        item = next(iterator)
    except StopIteration:
        break
    print(item)
```

```text
tea
jam
```

The same protocol drives `list()`, `sum()`, `in`, unpacking such as `a, b = pair`, `zip`, `enumerate` and comprehensions. Any object that follows it works with all of them.

## An iterator class

To make your own iterator, give a class both methods. Because it is its own iterator, `__iter__` returns `self`:

```python
class Countdown:
    """Counts down from start to 1."""

    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1


launch = Countdown(3)
print(list(launch), list(launch))
for number in Countdown(2):
    print(number)
print(3 in Countdown(5), sum(Countdown(4)))
```

```text
[3, 2, 1] []
2
1
True 10
```

`list(launch)` the second time is empty: the iterator is exhausted. `in` and `sum` work without any extra code, because they use the protocol.

## Generator functions and `yield`

The class needs bookkeeping: an attribute for the position, a check, a manual StopIteration. A **generator function** does the same with far less code. It is any function that contains `yield`:

```python
def countdown(start):
    print("starting")
    while start > 0:
        yield start
        start -= 1
    print("finished")


numbers = countdown(3)
print(type(numbers).__name__)
print(next(numbers))
print(next(numbers))
print(list(numbers))
print(list(numbers))
```

```text
generator
starting
3
2
finished
[1]
[]
```

Follow the output carefully:

- Calling `countdown(3)` runs **none** of its body. It returns a **generator**, an iterator whose `__iter__` and `__next__` Python wrote for you.
- The first `next` runs the body up to the first `yield`, which hands out 3 and **pauses** the function, with its local variables and position kept. "starting" is printed only now.
- Each further `next` resumes right after the `yield` and runs to the next one.
- When the body ends, the generator raises StopIteration for you; `list` stops there, after "finished". A `return` inside a generator ends it the same way.
- Like every iterator, it is then exhausted.

A generator expression (lesson 4) is the one-line form of a generator function.

## Generator state and laziness

A generator is **lazy**: it computes each value only when asked and keeps one frame of local variables, not a list of results. That has two consequences. A generator can describe a sequence too large for memory, or endless. And chaining generators processes data one item at a time, start to end, which suits files of any size.

## Pipelines and `yield from`

Each stage below takes an iterable and yields transformed items. Joined together, they form a **pipeline**:

```python
from pathlib import Path


def read_lines(path):
    with open(path, encoding="utf-8") as file:
        for line in file:
            yield line.rstrip("\n")


def without_blanks(lines):
    for line in lines:
        if line.strip():
            yield line


def as_numbers(lines):
    for line in lines:
        yield float(line)


Path("readings.txt").write_text("12.5\n\n13.0\n  \n11.5\n", encoding="utf-8")
values = as_numbers(without_blanks(read_lines("readings.txt")))
print(type(values).__name__)
print(sum(values))


def flatten(items):
    for item in items:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item


print(list(flatten([1, [2, [3, 4]], 5])))
```

```text
generator
37.0
[1, 2, 3, 4, 5]
```

Building `values` reads nothing. When `sum` asks for a number, `as_numbers` asks `without_blanks` for a line, which asks `read_lines`, which reads one line from the file. Only one line is in memory at a time, whether the file has five lines or five million. Because `read_lines` reads inside `with`, the file is closed when the generator finishes.

`yield from iterable` yields every item of another iterable, here a recursive call. It replaces `for x in flatten(item): yield x`.

## Infinite generators and `itertools`

A generator with `while True` never ends, which is fine as long as the consumer stops asking. The `itertools` module provides building blocks for such iterators:

```python
from itertools import chain, count, islice


def squares():
    for n in count(1):
        yield n * n


print(list(islice(squares(), 5)))
print(list(islice(count(10, 5), 3)))
print(list(islice("ABCDEFG", 2, None, 2)))
print(list(chain("ab", [1, 2], range(2))))
tickets = (f"ticket-{n:03d}" for n in count(1))
print(next(tickets), next(tickets))
```

```text
[1, 4, 9, 16, 25]
[10, 15, 20]
['C', 'E', 'G']
['a', 'b', 1, 2, 0, 1]
ticket-001 ticket-002
```

- `count(start=0, step=1)` counts forever.
- `islice(iterable, stop)` or `islice(iterable, start, stop, step)` slices any iterator lazily. You cannot write `squares()[:5]`, since a generator has no indexes, and negative values are not allowed.
- `chain(a, b, ...)` yields everything from `a`, then from `b`, and so on.

Never call `list()` on an infinite generator: it runs until memory runs out. The advanced level covers `itertools` in depth.

## Common mistakes

- **Looping twice over an iterator**: the second loop sees nothing. Keep a list, or call the generator function again for a fresh generator.
- **Calling `next` on an iterable that is not an iterator**: `next(["a"])` raises `TypeError: 'list' object is not an iterator`. Call `iter` first.
- **Expecting a generator function to run when called.** Its body, including any validation at the top, runs only at the first `next`.
- **`return value` instead of `yield value`** in a generator: `return` ends it.

## Practice

1. Write a generator `evens(limit)` yielding the even numbers from 0 to `limit`.
2. Write an infinite generator `fibonacci()` and print its first 10 values with `islice`.
3. Write `take_while_below(numbers, ceiling)` that yields numbers until one reaches the ceiling, and use it on `fibonacci()` with 50.

### Answers

```python
from itertools import islice


def evens(limit):
    for n in range(0, limit + 1, 2):
        yield n


def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def take_while_below(numbers, ceiling):
    for n in numbers:
        if n >= ceiling:
            return
        yield n


print(list(evens(9)))
print(list(islice(fibonacci(), 10)))
print(list(take_while_below(fibonacci(), 50)))
```

```text
[0, 2, 4, 6, 8]
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

`take_while_below` stops the infinite generator with `return` as soon as it sees 55. The advanced level shows `itertools.takewhile`, which does the same.

## Key takeaways

- An iterable gives an iterator through `iter()`; an iterator gives values through `next()` until StopIteration.
- `for`, `list`, `sum`, `in` and unpacking all use this protocol.
- A function with `yield` returns a generator; its body runs step by step as values are requested and keeps its state between them.
- Generators are lazy and single-use; chain them into pipelines and use `yield from` to delegate.
- `itertools.count`, `islice` and `chain` work with any iterator, including infinite ones.

## Further reading

- [The Python Tutorial: Iterators and generators](https://docs.python.org/3.15/tutorial/classes.html#iterators)
- [Glossary: iterator](https://docs.python.org/3.15/glossary.html#term-iterator)
- [Language reference: Yield expressions](https://docs.python.org/3.15/reference/expressions.html#yield-expressions)
- [itertools: Functions creating iterators](https://docs.python.org/3.15/library/itertools.html)
