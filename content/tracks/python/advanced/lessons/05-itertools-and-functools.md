---
title: itertools and functools
summary: Solve common iteration problems with the building blocks in `itertools` (running totals, windows, batches, grouping, combinatorics) and use `functools` for caching, cached attributes, type-based dispatch, `reduce` and `partial`.
minutes: 40
objectives:
  - Use `accumulate`, `pairwise`, `batched`, `groupby`, `takewhile`, `dropwhile` and `zip_longest` on real data
  - Generate products, permutations and combinations, and predict how many results they give
  - Memoize functions with `cache` and `lru_cache`, and cache attributes with `cached_property`
  - Dispatch on argument type with `singledispatch`, and use `reduce` and `partial`
---

## Outline

1. Running totals, pairs and batches
2. Grouping with `groupby`
3. Combinatorics
4. Cutting and aligning sequences
5. Caching with `functools`
6. `singledispatch`, `reduce` and `partial`

## Running totals, pairs and batches

Idiomatic Python introduced `itertools.count`, `islice` and `chain`. The module has many more
**iterator building blocks**: each takes iterables and returns a lazy iterator, so it works on
data of any size and combines with the others. Wrap a result in `list()` to see it all at once.

```python
from itertools import accumulate, batched, pairwise

steps = [1200, 3400, 800, 5100, 2600]
print(list(accumulate(steps)))
print(list(accumulate(steps, max)))
print([later - earlier for earlier, later in pairwise(steps)])
print(list(batched("ABCDEFG", 3)))
```

```text
[1200, 4600, 5400, 10500, 13100]
[1200, 3400, 3400, 5100, 5100]
[2200, -2600, 4300, -2500]
[('A', 'B', 'C'), ('D', 'E', 'F'), ('G',)]
```

- `accumulate(iterable, function=add, *, initial=None)` gives running results: running totals by
  default, a running maximum with `max`. With `initial`, the output has one item more.
- `pairwise(iterable)` gives overlapping pairs, ideal for differences between neighbours.
- `batched(iterable, n)` cuts the data into tuples of `n`. The last one may be shorter; with
  `strict=True` a short last batch raises `ValueError: batched(): incomplete batch`.

## Grouping with `groupby`

`groupby(iterable, key)` yields `(key, group)` pairs for **consecutive** items with the same key.
It does not collect equal keys from all over the input, so sort by the same key first.

```python
from itertools import groupby
from operator import itemgetter

visits = [("mon", "ana"), ("tue", "bo"), ("mon", "cy"), ("mon", "dee"), ("tue", "ana")]
for day, rows in groupby(visits, key=itemgetter(0)):
    print(day, [name for _, name in rows])
print("after sorting:")
for day, rows in groupby(sorted(visits, key=itemgetter(0)), key=itemgetter(0)):
    print(day, [name for _, name in rows])
```

```text
mon ['ana']
tue ['bo']
mon ['cy', 'dee']
tue ['ana']
after sorting:
mon ['ana', 'cy', 'dee']
tue ['bo', 'ana']
```

Each `group` is an iterator that shares the input with `groupby`. When the loop moves on to the
next key, the previous group is gone, so turn a group into a list if you need it later.

## Combinatorics

```python
from itertools import combinations, permutations, product

print(list(product("SM", ["red", "blue"])))
print(len(list(product(range(10), repeat=4))))
print(list(permutations("ABC", 2)))
print(list(combinations("ABCD", 2)))
```

```text
[('S', 'red'), ('S', 'blue'), ('M', 'red'), ('M', 'blue')]
10000
[('A', 'B'), ('A', 'C'), ('B', 'A'), ('B', 'C'), ('C', 'A'), ('C', 'B')]
[('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]
```

- `product` is the Cartesian product: every choice from the first iterable with every choice
  from the next, like nested `for` loops. `repeat=4` means the same iterable four times, so four
  digits give 10,000 codes.
- `permutations(iterable, r)` gives ordered arrangements: `('A', 'B')` and `('B', 'A')` both
  appear.
- `combinations(iterable, r)` gives unordered selections, in the order of the input.

These counts grow very fast. `permutations(range(12))` has 479,001,600 results, so consume them
lazily and stop early instead of building a list.

## Cutting and aligning sequences

```python
from itertools import dropwhile, takewhile, zip_longest

log = ["# header", "# version 2", "start", "# note", "stop"]
print(list(takewhile(lambda line: line.startswith("#"), log)))
print(list(dropwhile(lambda line: line.startswith("#"), log)))
print(list(zip_longest("abc", [1, 2], fillvalue=0)))
```

```text
['# header', '# version 2']
['start', '# note', 'stop']
[('a', 1), ('b', 2), ('c', 0)]
```

`takewhile` stops at the first item that fails the test, and `dropwhile` skips items until the
first failure and then passes **everything** through, including the later `# note`. Unlike
`filter`, neither looks at the test again. `zip_longest` keeps going to the longest input and
pads the gaps, where plain `zip` stops at the shortest.

## Caching with `functools`

A **cache** stores the result of a call so that the same arguments return it without recomputing.
`@functools.cache` keeps every result; `@functools.lru_cache(maxsize=128)` keeps the most recent
`maxsize` results and discards the least recently used one. Both store arguments as dict keys, so
the arguments must be hashable.

```python
from functools import cache, lru_cache


@cache
def ways(stairs):
    """Count the ways to climb the stairs taking one or two steps at a time."""
    if stairs <= 1:
        return 1
    return ways(stairs - 1) + ways(stairs - 2)


print(ways(80))
print(ways.cache_info())


@lru_cache(maxsize=2)
def square(n):
    print(f"computing {n}")
    return n * n


for n in [2, 3, 2, 4, 3]:
    square(n)
print(square.cache_info())
```

```text
37889062373143906
CacheInfo(hits=78, misses=81, maxsize=None, currsize=81)
computing 2
computing 3
computing 4
computing 3
CacheInfo(hits=1, misses=4, maxsize=2, currsize=2)
```

Without the cache, `ways(80)` would make about 7.6 × 10¹⁶ recursive calls, years of work; with
it, each of the 81 values is computed once. In `square`, the second `2` was a hit, but `4` pushed out `3`, the least recently used,
so `3` was computed again. `cache_clear()` empties a cache.

`functools.cached_property` computes an attribute on first access and stores it in the
instance's `__dict__`. Later reads skip the method entirely, even if the data it used has changed;
`del obj.attribute` clears it:

```python
from functools import cached_property


class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property
    def total(self):
        print("summing")
        return sum(self.rows)


report = Report([3, 4, 5])
print(report.total, report.total)
report.rows.append(10)
print(report.total)
del report.total
print(report.total)
```

```text
summing
12 12
12
summing
22
```

## `singledispatch`, `reduce` and `partial`

`@functools.singledispatch` turns a function into a **generic function** that picks an
implementation by the type of its first argument. Register implementations with
`@name.register`; the type annotation on the first parameter names the type (annotations are
the subject of the next lesson).

```python
from functools import Placeholder, partial, reduce, singledispatch
import operator


@singledispatch
def describe(value):
    return f"something else: {value!r}"


@describe.register
def _(value: int):
    return f"the integer {value:,}"


@describe.register
def _(value: list | tuple):
    return f"a sequence of {len(value)} items"


print(describe(2026000), "|", describe((1, 2)), "|", describe("hi"), "|", describe(True))
print(reduce(operator.mul, [1, 2, 3, 4], 1))
to_binary = partial(format, Placeholder, "08b")
print(to_binary(10))
```

```text
the integer 2,026,000 | a sequence of 2 items | something else: 'hi' | the integer 1
24
00001010
```

`True` used the `int` version because `bool` is a subclass of `int`. `reduce(function, iterable,
initial)` folds the items into one value, here a product; the initial value is also the answer
for an empty input. `partial` fixes some arguments of a function; since Python 3.14,
`functools.Placeholder` reserves a positional slot, so `to_binary(10)` calls
`format(10, "08b")`.

## Common mistakes

- **`groupby` on unsorted data.** Equal keys that are not next to each other form separate
  groups. Sort by the same key first.
- **Unhashable arguments to a cached function.** `square([1])` raises
  `TypeError: unhashable type: 'list'`; pass a tuple.
- **Caching a function with side effects or a changing answer.** A cached function that reads
  the clock or a file returns stale results. Cache only pure functions.
- **Stale `cached_property`.** It does not notice that `rows` changed; delete the attribute or
  use a plain `property`.

## Practice

1. Given daily rainfall `[0, 3, 5, 0, 0, 2]`, print the running total and the largest day so
   far with `accumulate`.
2. A padlock has three dials of digits 0 to 9. How many codes are there, and how would you
   produce them in order?
3. Group the words `["apple", "avocado", "banana", "blueberry", "cherry"]` by first letter into
   a dict of lists.

### Answers

1. `list(accumulate(rain))` gives `[0, 3, 8, 8, 8, 10]` and `list(accumulate(rain, max))` gives
   `[0, 3, 5, 5, 5, 5]`.
2. `product(range(10), repeat=3)` yields 1,000 tuples from `(0, 0, 0)` to `(9, 9, 9)`. Order
   matters and digits may repeat, so it is neither `permutations` nor `combinations`.
3. The list is already sorted by first letter, so `groupby` can be used directly:

   ```python
   from itertools import groupby

   words = ["apple", "avocado", "banana", "blueberry", "cherry"]
   by_letter = {letter: list(group) for letter, group in groupby(words, key=lambda w: w[0])}
   print(by_letter)
   # {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
   ```

## Key takeaways

- `itertools` functions are lazy building blocks that combine with each other.
- `accumulate`, `pairwise` and `batched` handle running results, neighbours and fixed-size chunks.
- `groupby` groups consecutive items only; sort by the key first.
- `product`, `permutations` and `combinations` enumerate choices; counts explode quickly.
- `cache`, `lru_cache` and `cached_property` trade memory for speed; `singledispatch` chooses an
  implementation by type.

## Further reading

- [itertools: functions creating iterators for efficient looping](https://docs.python.org/3.15/library/itertools.html)
- [functools: higher-order functions and operations on callable objects](https://docs.python.org/3.15/library/functools.html)
- [Functional programming HOWTO](https://docs.python.org/3.15/howto/functional.html)
