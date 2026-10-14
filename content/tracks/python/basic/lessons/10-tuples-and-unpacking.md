---
title: Tuples and Unpacking
summary: Write tuples, including empty and one-element ones, understand what their immutability does and does not protect, pack and unpack values, swap and use starred unpacking, loop with enumerate and zip, and choose between a tuple and a list.
minutes: 30
objectives:
  - Create tuples, including the empty tuple and a one-element tuple, and index and slice them
  - Explain that a tuple cannot change while a list inside it can
  - Unpack sequences into names, including with a starred name, and swap values
  - Loop with enumerate and zip, unpacking each pair
  - Choose between a tuple and a list for a given job
---

## Outline

1. Tuple literals
2. Immutable, but only one level deep
3. Packing and unpacking
4. Starred unpacking
5. `enumerate` and `zip`
6. Lists of tuples, tuples of lists
7. Tuples or lists?

## Tuple literals

A **tuple** is an ordered sequence of values, like a list, but **immutable**: once made, its items
cannot be replaced, added or removed. It is written with commas, usually inside parentheses. The
commas make the tuple, not the parentheses, which leads to two special cases: `()` is the empty
tuple, and a tuple of one item needs a trailing comma, `("solo",)`. Without it, `("solo")` is just
a string in parentheses.

```python
point = (3, 4)
rgb = 255, 128, 0
single = ("solo",)
not_a_tuple = ("solo")
empty = ()
print(point, rgb, single, empty)
print(type(single), type(not_a_tuple))
print(point[0], rgb[-1], rgb[1:], len(rgb))
print(tuple([1, 2]), point + (5,), "red" in ("red", "green"))
point[0] = 5
```

```text
(3, 4) (255, 128, 0) ('solo',) ()
<class 'tuple'> <class 'str'>
3 0 (128, 0) 3
(1, 2) (3, 4, 5) True
Traceback (most recent call last):
  File "/tmp/a.py", line 10, in <module>
    point[0] = 5
    ~~~~~^^^
TypeError: 'tuple' object does not support item assignment
```

Everything that reads a sequence works on tuples: indexing, slicing (which returns a new tuple),
`len`, `in`, `+`, `*`, looping, and the two methods `count` and `index`. Anything that would
change it does not exist: `(1, 2, 3).append(4)` gives
`AttributeError: 'tuple' object has no attribute 'append'. Did you mean to use a 'list' object?`
in Python 3.15. `tuple(...)` builds a tuple from any sequence.

## Immutable, but only one level deep

A tuple holds references to objects. Immutability means those references can never change; it
says nothing about the objects themselves. If a tuple holds a list, the list can still change:

```python
record = ("Ada", [90, 85])
record[1].append(77)
print(record)
record[1] = [1]
```

```text
('Ada', [90, 85, 77])
Traceback (most recent call last):
  File "/tmp/b.py", line 4, in <module>
    record[1] = [1]
    ~~~~~~^^^
TypeError: 'tuple' object does not support item assignment
```

The tuple still holds the *same* list, so it has not changed; the list has. The tuple refuses only
to hold a different object.

## Packing and unpacking

Writing `rgb = 255, 128, 0` **packs** three values into one tuple. The reverse, **unpacking**,
binds several names to the items of a sequence in one assignment. Lesson 3 used it for multiple
assignment and swapping; now you can see that `a, b = b, a` packs the right side into a tuple and
unpacks it on the left.

```python
date = (2026, 10, 15)
year, month, day = date
print(year, month, day)
hours, minutes = divmod(135, 60)
print(hours, minutes)
```

```text
2026 10 15
2 15
```

The built-in `divmod(a, b)` **returns a tuple** of two values, `(a // b, a % b)`, which is
unpacked straight into two names. Functions you write in lesson 12 return several values the
same way.

The number of names must match the number of items exactly:

```python
name, age = ("Ada", 36, "London")
```

```text
Traceback (most recent call last):
  File "/tmp/d.py", line 1, in <module>
    name, age = ("Ada", 36, "London")
    ^^^^^^^^^
ValueError: too many values to unpack (expected 2, got 3)
```

With too few items the message is `not enough values to unpack (expected 3, got 2)`.

## Starred unpacking

One name on the left may have a star, `*`. It collects all the items the other names do not
take, as a **list**, possibly empty:

```python
first, *rest = [5, 6, 7, 8]
print(first, rest)
head, *middle, tail = "hello"
print(head, middle, tail)
*start, last = (1,)
print(start, last)
```

```text
5 [6, 7, 8]
h ['e', 'l', 'l'] o
[] 1
```

Unpacking works on any sequence, so `"hello"` gives characters. Only one starred name is allowed
per assignment.

## `enumerate` and `zip`

Two built-in functions produce tuples for loops, and unpacking in the `for` line takes them
apart.

- **`enumerate(sequence, start=0)`** gives `(index, item)` pairs, so you get the position without
  managing a counter.
- **`zip(a, b)`** walks two (or more) sequences side by side, giving `(item_from_a, item_from_b)`
  pairs. It stops at the end of the **shortest**.

```python
players = ["Ada", "Bo", "Cy"]
points = [12, 9, 15]
for position, name in enumerate(players, start=1):
    print(position, name)
for name, score in zip(players, points):
    print(f"{name}: {score}")
print(list(zip(players, points)))
print(list(zip([1, 2, 3], "xy")))
```

```text
1 Ada
2 Bo
3 Cy
Ada: 12
Bo: 9
Cy: 15
[('Ada', 12), ('Bo', 9), ('Cy', 15)]
[(1, 'x'), (2, 'y')]
```

`for position, name in enumerate(...)` unpacks each pair. Prefer this to
`for i in range(len(players))`, which is the C way of writing it. Like `range`, `enumerate` and
`zip` produce their pairs on demand, so `list(...)` is needed to see them all at once. The `3` in
the last line was silently dropped; `zip(a, b, strict=True)` raises `ValueError` instead when the
lengths differ.

## Lists of tuples, tuples of lists

Tuples and lists nest freely. A list of tuples is a natural table of records: the list grows and
shrinks, and each tuple is one fixed-shape row.

```python
results = [("Bo", 85), ("Ada", 90), ("Ada", 70)]
for name, score in results:
    print(f"{name:<4}{score:>3}")
print(sorted(results))
results.append(("Cy", 88))
print(len(results), results[-1][0])
```

```text
Bo   85
Ada  90
Ada  70
[('Ada', 70), ('Ada', 90), ('Bo', 85)]
4 Cy
```

Tuples compare item by item, like words in a dictionary: first by name, and only if the names are
equal, by score. So `sorted` orders the rows by name, then score. `results[-1][0]` is the first
item of the last tuple.

## Tuples or lists?

| | list | tuple |
| --- | --- | --- |
| Can change | yes | no |
| Typical content | many items of the same kind | a fixed number of fields, each with a meaning |
| Example | `["Ada", "Bo", "Cy"]` | `("Ada", 36, "London")` |
| Usable as a dict key | no | yes, if its items are (lesson 11) |

Use a list for a collection that grows or changes; use a tuple for a small, fixed group of values
that belong together, such as coordinates, an RGB colour, or a row of results. A tuple also
protects data you do not want changed by accident.

## Common mistakes

- **The missing comma.** `("solo")` is a string; `("solo",)` is a tuple.
- **A stray comma.** `total = 5,` makes `total` the tuple `(5,)`, and `total + 1` then fails.
- **Unpacking the wrong count.** Match the names to the items, or use a starred name.
- **Calling list methods on a tuple.** `size.sort()` fails with
  `AttributeError: 'tuple' object has no attribute 'sort'`. Use `sorted(size)`, which returns a
  list.

## Practice

1. Loop over `cities = ["Lagos", "Lima", "Oslo"]` and `temps = [31, 19, 4]` together and print
   numbered lines like `1. Lagos: 31`.
2. With `a, b, c = 1, 2, 3`, rotate the values in one line so that `a, b, c` become `3, 1, 2`.
3. `reading = ("sensor-7", 21.5, 22.0, 21.8)`. Unpack the label and the values in one line and
   print the label and the average value.

### Answers

1. ```python
   for number, (city, temp) in enumerate(zip(cities, temps), start=1):
       print(f"{number}. {city}: {temp}")
   ```

   `enumerate` gives `(number, (city, temp))`, and the parentheses in the `for` line unpack the
   inner pair.
2. `a, b, c = c, a, b`. The right side is packed first, `(3, 1, 2)`, then unpacked.
3. ```python
   label, *values = reading
   print(label, sum(values) / len(values))
   ```

   ```text
   sensor-7 21.766666666666666
   ```

## Key takeaways

- A tuple is an immutable sequence made by commas; `()` is empty and `(x,)` has one item.
- A tuple cannot change, but a mutable object inside it can.
- Unpacking binds names to items: `x, y = point`; `first, *rest = items` collects the rest in a
  list.
- `enumerate` adds positions and `zip` pairs sequences; unpack their tuples in the `for` line.
- Lists for changing collections of similar items, tuples for fixed groups of fields.

## Further reading

- [Tutorial: Tuples and sequences](https://docs.python.org/3.15/tutorial/datastructures.html#tuples-and-sequences)
- [Built-in functions: enumerate() and zip()](https://docs.python.org/3.15/library/functions.html#zip)
- [PEP 3132: Extended iterable unpacking](https://peps.python.org/pep-3132/)
