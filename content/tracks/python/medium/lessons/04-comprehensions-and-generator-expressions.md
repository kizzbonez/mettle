---
title: Comprehensions and Generator Expressions
summary: Build lists, dictionaries and sets in one expression with comprehensions, filter and nest them, know when a plain loop reads better, and feed `sum`, `any`, `all`, `max` and `min` with lazy generator expressions, including the unpacking that Python 3.15 allows in them.
minutes: 35
objectives:
  - Turn an append loop into a list comprehension, with a filter and a conditional expression
  - Build dictionaries and sets with dict and set comprehensions
  - Read and write comprehensions with several `for` clauses and nested comprehensions
  - Use generator expressions with `sum`, `any`, `all`, `max`, `min` and `join`, and explain why they save memory
  - Flatten and merge with `*` and `**` in comprehensions (Python 3.15)
---

## Outline

1. From loop to list comprehension
2. Dict and set comprehensions
3. Several `for` clauses and nesting
4. When a loop is clearer
5. Generator expressions
6. Unpacking in comprehensions (new in 3.15)

## From loop to list comprehension

The basic course built lists with a loop and `append`, and met the list comprehension once. A **comprehension** is an expression that builds a collection from an iterable, written inside the brackets of the collection:

```python
temps = [12.5, -3.0, 20.0, 31.5, 8.0]

warm = []
for t in temps:
    if t >= 15:
        warm.append(t)
print(warm)

print([t for t in temps if t >= 15])
print([t * 9 / 5 + 32 for t in temps])
print(["frost" if t < 0 else "ok" for t in temps])
```

```text
[20.0, 31.5]
[20.0, 31.5]
[54.5, 26.6, 68.0, 88.7, 46.4]
['ok', 'frost', 'ok', 'ok', 'ok']
```

Read `[t for t in temps if t >= 15]` as "t, for each t in temps, if t is at least 15": an **expression** computed for each item kept, a `for` clause, and an optional `if` **filter**.

The two kinds of `if` differ. An `if` after the `for` filters items out. `"frost" if t < 0 else "ok"` before the `for` is the conditional expression from the basic course: it keeps every item and chooses its value. Writing `[n for n in range(5) if n % 2 else 0]` is a SyntaxError, because a filter has no `else`.

The comprehension's variable is local to it. After `squares = [x * x for x in range(3)]`, an `x` defined earlier keeps its old value, whereas a `for` loop overwrites it.

## Dict and set comprehensions

The same form in braces builds a set, and with `key: value` a dictionary:

```python
words = ["apple", "Banana", "cherry", "avocado", "blueberry"]
print({word: len(word) for word in words})
print(sorted({word[0].lower() for word in words}))
prices = {"tea": 4.5, "cake": 3.0, "soup": 6.25}
print({item: price for item, price in prices.items() if price < 5})
print({price: item for item, price in prices.items()})
```

```text
{'apple': 5, 'Banana': 6, 'cherry': 6, 'avocado': 7, 'blueberry': 9}
['a', 'b', 'c']
{'tea': 4.5, 'cake': 3.0}
{4.5: 'tea', 3.0: 'cake', 6.25: 'soup'}
```

- A set comprehension drops duplicates: five words, three first letters. Sets have no order, so the example sorts it for printing.
- Iterating `prices.items()` and unpacking each pair into `item, price` is the usual way to filter or transform a dictionary. The last line swaps keys and values; if two items had the same price, the later one would win.
- `{}` alone is an empty dict, never a set. There is no tuple comprehension: parentheses make a generator expression, below.

## Several `for` clauses and nesting

A comprehension may have several `for` and `if` clauses. They run in the order written, exactly like nested loops:

```python
grid = [[1, 2, 3], [4, 5, 6]]
print([n for row in grid for n in row])
print([n for row in grid for n in row if n % 2 == 0])
print([(letter, n) for letter in "ab" for n in range(2)])
print([[row[i] for row in grid] for i in range(3)])
```

```text
[1, 2, 3, 4, 5, 6]
[2, 4, 6]
[('a', 0), ('a', 1), ('b', 0), ('b', 1)]
[[1, 4], [2, 5], [3, 6]]
```

- `[n for row in grid for n in row]` is `for row in grid:` then `for n in row:` inside it. The outer loop comes first, which surprises many people.
- When the expression is a tuple, it needs parentheses: `[n, n * n for n in range(3)]` is `SyntaxError: did you forget parentheses around the comprehension target?`.
- The last line is a **nested comprehension**: its expression is itself a comprehension, so it builds a list of lists. It turns the 2 by 3 grid into a 3 by 2 one. `list(zip(*grid))` does the same with tuples.

## When a loop is clearer

A comprehension is for building a collection. Use a plain loop when the work is done for its effect, such as printing (`[print(t) for t in temps]` builds a useless list of `None`), when the logic needs several statements, `try` or `break`, or when the comprehension would need more than two `for` clauses or a long condition.

## Generator expressions

Written in parentheses, the same form becomes a **generator expression**. It does not build a collection. It produces its values one at a time, only when asked, and keeps only the current one in memory:

```python
import sys

squares_list = [n * n for n in range(1_000_000)]
squares_gen = (n * n for n in range(1_000_000))
print(sys.getsizeof(squares_list), sys.getsizeof(squares_gen))
print(sum(squares_gen))
print(sum(squares_gen))
```

```text
8448728 216
333332833333500000
0
```

The list holds a million results, over 8 MB; the generator is a small object that knows how to compute the next one. A generator can be used **once**: the first `sum` consumed it, so the second found nothing and returned 0. Lesson 12 shows how generators work inside.

Generator expressions pair naturally with functions that consume an iterable. When it is the only argument, its own parentheses can be dropped:

```python
readings = [12.5, -3.0, 20.0, 31.5, 8.0]
print(any(r < 0 for r in readings), all(r < 40 for r in readings))
print(sum(1 for r in readings if r > 10))
print(max(r for r in readings if r < 30))
print(min((r for r in readings if r > 100), default=None))
print(", ".join(f"{r:.0f}" for r in readings))
```

```text
True True
3
20.0
None
12, -3, 20, 32, 8
```

- `any` returns `True` at the first true value and `all` returns `False` at the first false one, so neither looks further than it must.
- `sum(1 for ... if ...)` counts the items that pass a test.
- `max` and `min` raise ValueError on an empty input; `default=` gives a value instead. With a second argument, the generator needs its parentheses back.
- `str.join` accepts any iterable of strings.

Prefer a generator expression whenever the result is consumed once. Make a list when you need `len`, indexing or a second pass.

## Unpacking in comprehensions (new in 3.15)

Python 3.15 (PEP 798) lets the expression of a comprehension start with `*` or `**`, which unpacks each item into the result:

```python
shelves = [["tea", "jam"], ["bread"], [], ["eggs", "milk"]]
print([*shelf for shelf in shelves])
tags = [{"python", "web"}, {"web", "api"}]
print(sorted({*t for t in tags}))
layers = [{"theme": "light", "size": 12}, {"size": 14}, {"lang": "en"}]
print({**layer for layer in layers})
```

```text
['tea', 'jam', 'bread', 'eggs', 'milk']
['api', 'python', 'web']
{'theme': 'light', 'size': 14, 'lang': 'en'}
```

`[*shelf for shelf in shelves]` means `[item for shelf in shelves for item in shelf]` and reads better. `{*t for t in tags}` is the union of the sets. `{**layer for layer in layers}` merges dictionaries, later values winning, so `size` is 14. `**` works only in dict comprehensions: `[**d for d in dicts]` is `SyntaxError: cannot use dict unpacking in list comprehension`. Older Pythons reject all of this syntax.

## Common mistakes

- **Reusing a generator.** A second pass over a used generator finds nothing, silently. Build a list if you need the values twice.
- **`else` in the filter.** `[x for x in xs if x > 0 else 0]` is a SyntaxError. Move the conditional before `for`: `[x if x > 0 else 0 for x in xs]`.
- **The `for` clauses in the wrong order.** `[n for n in row for row in grid]` raises NameError, because `row` is used before its `for` clause. Write the clauses in the order of the nested loops.
- **Comprehensions for side effects.** Use a `for` loop when nothing needs to be built.

## Practice

1. From `words = ["kiwi", "fig", "banana", "apple"]`, build a dictionary from each word to its length, but only for words of four letters or more.
2. Count how many numbers in `range(1, 101)` are divisible by 3 or by 5, without building a list.
3. Flatten `[[1, 2], [3], [4, 5, 6]]` two ways: with two `for` clauses, and with 3.15 unpacking.

### Answers

```python
words = ["kiwi", "fig", "banana", "apple"]
print({word: len(word) for word in words if len(word) >= 4})
print(sum(1 for n in range(1, 101) if n % 3 == 0 or n % 5 == 0))
nested = [[1, 2], [3], [4, 5, 6]]
print([n for part in nested for n in part])
print([*part for part in nested])
```

```text
{'kiwi': 4, 'banana': 6, 'apple': 5}
47
[1, 2, 3, 4, 5, 6]
[1, 2, 3, 4, 5, 6]
```

The count uses a generator expression, so no list of 47 numbers is ever built. In the flattening, the outer loop (`for part in nested`) comes first.

## Key takeaways

- `[expr for x in it if cond]` builds a list; braces build a set, or a dict with `key: value`.
- An `if` after `for` filters; `a if cond else b` before `for` chooses a value.
- Several `for` clauses run like nested loops, outer first.
- A generator expression computes values lazily and can be used once; feed it to `sum`, `any`, `all`, `max`, `min` or `join`.
- In 3.15, `*` and `**` in a comprehension flatten iterables and merge dictionaries.

## Further reading

- [The Python Tutorial: List comprehensions](https://docs.python.org/3.15/tutorial/datastructures.html#list-comprehensions)
- [Language reference: Displays for lists, sets and dictionaries](https://docs.python.org/3.15/reference/expressions.html#displays-for-lists-sets-and-dictionaries)
- [Language reference: Generator expressions](https://docs.python.org/3.15/reference/expressions.html#generator-expressions)
- [PEP 798: Unpacking in comprehensions](https://peps.python.org/pep-0798/)
