---
title: Lists
summary: Store many values in one list, index, slice and change it, add and remove items with list methods and del, sort with sort() or sorted(), understand aliasing and shallow copies, build matrices from nested lists, and write a first list comprehension.
minutes: 35
objectives:
  - Create lists and read and change items by index and slice
  - Add, find and remove items with append, insert, extend, index, count, pop, remove and del
  - Choose between list.sort() and sorted(), and explain why sort() returns None
  - Explain aliasing, and copy a list when you need an independent one
  - Work with nested lists as matrices and build a list with a comprehension
---

## Outline

1. Creating and reading lists
2. Changing a list
3. List methods and `del`
4. Sorting: `sort` and `sorted`
5. Aliasing and copying
6. Nested lists: matrices and cubes
7. A first list comprehension

## Creating and reading lists

A **list** holds a sequence of values, its **items** or **elements**, in order. You write it in
square brackets, items separated by commas. A list can hold any types, even mixed, and can be
empty: `[]`. `list(...)` builds a list from any sequence, such as a string or a `range`.

```python
scores = [72, 95, 88, 61]
print(scores, len(scores))
print(scores[0], scores[-1], scores[1:3])
scores[0] = 75
print(scores)
mixed = ["Ada", 36, 1.5, True]
print(mixed, [], list("abc"), list(range(4)))
print(sum(scores), min(scores), max(scores))
```

```text
[72, 95, 88, 61] 4
72 61 [95, 88]
[75, 95, 88, 61]
['Ada', 36, 1.5, True] [] ['a', 'b', 'c'] [0, 1, 2, 3]
319 61 95
```

Indexing and slicing work exactly as for strings (lesson 5): indices start at 0, `-1` is the last
item, and a slice is a **new list** that excludes its stop. `len`, `sum`, `min` and `max` work on
lists of numbers. A list is also a sequence you can loop over: `for score in scores:`.

## Changing a list

The big difference from strings: lists are **mutable**. `scores[0] = 75` replaced an item in
place, where the same assignment on a string was a `TypeError`. You can even assign to a slice,
replacing a stretch of items with any number of new ones, and delete a slice with `del`:

```python
letters = ["a", "b", "c", "d", "e"]
letters[1:3] = ["X", "Y", "Z"]
print(letters)
del letters[-2:]
print(letters)
```

```text
['a', 'X', 'Y', 'Z', 'd', 'e']
['a', 'X', 'Y', 'Z']
```

## List methods and `del`

```python
tasks = ["wash", "shop"]
tasks.append("cook")
tasks.insert(0, "wake")
tasks.extend(["read", "sleep"])
print(tasks)
last = tasks.pop()
print(last, tasks)
first = tasks.pop(0)
tasks.remove("shop")
print(first, tasks)
print(tasks.index("cook"), tasks.count("wash"))
del tasks[0]
print(tasks)
print("read" in tasks, "shop" not in tasks)
```

```text
['wake', 'wash', 'shop', 'cook', 'read', 'sleep']
sleep ['wake', 'wash', 'shop', 'cook', 'read']
wake ['wash', 'cook', 'read']
1 1
['cook', 'read']
True True
```

| Method | What it does |
| --- | --- |
| `append(x)` | adds `x` at the end |
| `insert(i, x)` | inserts `x` before index `i` |
| `extend(other)` | appends every item of another sequence |
| `pop()`, `pop(i)` | removes and **returns** the last item, or the item at `i` |
| `remove(x)` | removes the first item equal to `x` |
| `index(x)` | the index of the first item equal to `x` |
| `count(x)` | how many items equal `x` |
| `del items[i]` | a statement, not a method: deletes by index or slice |

`remove` and `index` raise `ValueError` when the value is absent
(`list.remove(x): x not in list`), and `pop` or an index past the end raises
`IndexError: list index out of range`. Test with `in` first when the item may be missing.
`append` adds one item: `tasks.append(["a", "b"])` adds a single item that is itself a list,
while `extend` adds two.

## Sorting: `sort` and `sorted`

```python
numbers = [5, 2, 9, 1]
ordered = sorted(numbers)
print(numbers, ordered)
numbers.sort(reverse=True)
print(numbers)
numbers.reverse()
print(numbers)
result = numbers.sort()
print(result)
print(sorted(["bo", "Ada", "cy"]), sorted("python"))
```

```text
[5, 2, 9, 1] [1, 2, 5, 9]
[9, 5, 2, 1]
[1, 2, 5, 9]
None
['Ada', 'bo', 'cy'] ['h', 'n', 'o', 'p', 't', 'y']
```

- **`sorted(sequence)`** is a built-in function that returns a **new** sorted list and leaves the
  original alone. It accepts any sequence, even a string.
- **`list.sort()`** sorts the list **in place** and returns **`None`**, Python's "nothing" value.
  This is a deliberate rule: methods that change a mutable object return `None`, so you cannot
  mistake them for ones that build a copy. `reverse()` works the same way.
- `reverse=True` sorts from largest to smallest. Strings sort by character code, so capitals come
  first. Items must be comparable: sorting `[3, "a"]` raises `TypeError`.

## Aliasing and copying

Assignment never copies (lesson 3); it binds another name to the same object. With an immutable
string that hardly matters, but a list can change, and every name bound to it sees the change.
Two names for one object are **aliases**.

```python
original = [1, 2, 3]
alias = original
alias.append(4)
print(original)
clone = original[:]
clone.append(5)
print(original, clone)
print(alias is original, clone is original)
```

```text
[1, 2, 3, 4]
[1, 2, 3, 4] [1, 2, 3, 4, 5]
True False
```

`original[:]`, `original.copy()` and `list(original)` all make a new list, a **copy**. But it is a
**shallow copy**: a new outer list whose items are the *same objects*. If those items are lists
themselves, they are shared:

```python
grid = [[0, 0], [0, 0]]
shallow = grid.copy()
shallow[0][0] = 9
print(grid)
```

```text
[[9, 0], [0, 0]]
```

For nested lists, copy each inner list too, or use `copy.deepcopy` (professional level).

## Nested lists: matrices and cubes

A list of lists is a **matrix** (a table): `matrix[row][column]`. A list of matrices is a
**cube**, with three indices.

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
]
print(matrix[1][2], len(matrix), len(matrix[0]))
for row in matrix:
    for value in row:
        print(value, end=" ")
    print()
cube = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]
print(cube[1][0][1])
wrong = [[0] * 3] * 3
wrong[0][0] = 1
print(wrong)
```

```text
6 2 3
1 2 3
4 5 6
5
[[1, 0, 0], [1, 0, 0], [1, 0, 0]]
```

`[0] * 3` repeats a list of numbers safely. But `[[0] * 3] * 3` repeats **one** inner list three
times: three aliases, so changing one row changes all of them. Build each row separately, as the
next section shows.

## A first list comprehension

Building a list in a loop is so common that Python has a shorthand. A **list comprehension**
`[expression for item in sequence if condition]` makes a new list from the expression for each
item, keeping only the items that pass the optional condition:

```python
squares = []
for n in range(6):
    squares.append(n ** 2)
print(squares)
print([n ** 2 for n in range(6)])
words = ["sun", "planet", "moon", "galaxy"]
print([word.upper() for word in words if len(word) > 4])
right = [[0] * 3 for row in range(3)]
right[0][0] = 1
print(right)
```

```text
[0, 1, 4, 9, 16, 25]
[0, 1, 4, 9, 16, 25]
['PLANET', 'GALAXY']
[[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

The first two lines build the same list. The last comprehension evaluates `[0] * 3` once per
row, so each row is a separate list. The medium level covers comprehensions in depth.

## Common mistakes

- **`items = items.sort()`** binds `items` to `None`. Write `items.sort()` alone, or
  `items = sorted(items)`.
- **Methods from other languages.** `stack.push(3)` fails; Python 3.15 even suggests the fix:
  `AttributeError: 'list' object has no attribute 'push'. Did you mean '.append'?`
- **Expecting `b = a` to copy.** It makes an alias. Use `a.copy()`.
- **`[[0] * 3] * 3` for a grid.** Use a comprehension.
- **Indexing an empty list.** `[][0]` is an `IndexError`; check `if items:` first.

## Practice

1. For `temps = [12, 17, 9, 21, 15]`, use a comprehension to list the temperatures above 14, then
   print their count and the average of all five.
2. Sort `temps` in place and print the lowest, the highest, and the list without them.
3. Build a 3 × 3 board of `"."`, put `"X"` in the centre, and print it row by row.

### Answers

1. ```python
   warm = [t for t in temps if t > 14]
   print(warm, len(warm))
   print(sum(temps) / len(temps))
   ```

   ```text
   [17, 21, 15] 3
   14.8
   ```

2. `temps.sort()`, then `print(temps[0], temps[-1], temps[1:-1])` prints `9 21 [12, 15, 17]`.
3. ```python
   board = [["."] * 3 for i in range(3)]
   board[1][1] = "X"
   for row in board:
       print(" ".join(row))
   ```

   ```text
   . . .
   . X .
   . . .
   ```

   Each row is a separate list, so only the centre changes.

## Key takeaways

- Lists are ordered, mutable sequences: index, slice, assign to items and slices, `del`.
- `append`, `insert`, `extend` add; `pop`, `remove`, `del` take away; `index` and `count` search.
- `sorted()` returns a new list; `list.sort()` sorts in place and returns `None`.
- Assignment creates aliases; `copy()` or `[:]` makes a shallow copy.
- Nested lists form matrices; `[expr for x in seq if cond]` builds a list in one line.

## Further reading

- [Tutorial: More on lists](https://docs.python.org/3.15/tutorial/datastructures.html#more-on-lists)
- [Built-in types: Lists and mutable sequence operations](https://docs.python.org/3.15/library/stdtypes.html#lists)
- [Sorting techniques](https://docs.python.org/3.15/howto/sorting.html)
