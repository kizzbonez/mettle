---
title: Dictionaries and Sets
summary: Store values under keys in a dictionary, look them up safely, add, update and remove entries, loop over keys, values and items, count and group with dicts, then use sets for unique members, fast membership tests and set algebra, and learn why keys and members must be hashable.
minutes: 35
objectives:
  - Create a dictionary, read values by key, and avoid KeyError with in and get
  - Add, change and remove entries with assignment, del and pop
  - Loop over keys(), values() and items(), and rely on insertion order
  - Count and group data with a dictionary
  - Use sets for uniqueness, membership and union, intersection and difference, and explain hashability
---

## Outline

1. What a dictionary is
2. Looking up values
3. Adding, changing and removing
4. Looping over a dictionary
5. Counting and grouping
6. Sets
7. Hashable keys and members

## What a dictionary is

A list finds items by position. Often you want to find them by **name** instead: the price of
tea, the capital of Peru, the score of Ada. A **dictionary** (type `dict`) stores **key: value**
pairs and finds a value by its key, quickly, however many entries there are. You write it in
curly braces:

```python
stock = {"apples": 12, "pears": 0, "plums": 30}
print(stock["apples"], len(stock))
print(stock.get("kiwis"), stock.get("kiwis", 0))
print("pears" in stock, 12 in stock)
print(stock["kiwis"])
```

```text
12 3
None 0
True False
Traceback (most recent call last):
  File "/tmp/a.py", line 5, in <module>
    print(stock["kiwis"])
          ~~~~~^^^^^^^^^
KeyError: 'kiwis'
```

Keys are unique; values may repeat. `{}` is an empty dictionary, and `len` counts its entries.

## Looking up values

- **`d[key]`** returns the value, and raises **`KeyError`** if the key is missing. The error
  message is the missing key.
- **`key in d`** tests whether a key exists. It checks **keys only**: `12 in stock` is `False`
  although 12 is a value.
- **`d.get(key)`** returns the value, or **`None`** if the key is missing, without an error.
  `d.get(key, default)` returns your default instead.

Use `d[key]` when the key must be there (a missing key is a bug you want to hear about), and
`get` when absence is normal.

## Adding, changing and removing

Assigning to a key adds it if it is new and replaces its value if it exists. `del d[key]` removes
an entry, and `d.pop(key)` removes it and returns its value; both raise `KeyError` for a missing
key, unless you give `pop` a default.

```python
stock = {"apples": 12, "pears": 0, "plums": 30}
stock["kiwis"] = 5
stock["apples"] = 10
stock["plums"] += 6
del stock["pears"]
print(stock)
sold = stock.pop("kiwis")
print(sold, stock)
print(stock.pop("mango", 0))
```

```text
{'apples': 10, 'plums': 36, 'kiwis': 5}
5 {'apples': 10, 'plums': 36}
0
```

`stock["plums"] += 6` reads the old value, adds 6 and stores the result. `d.update(other)` copies
every entry of another dict into `d`, overwriting keys that exist. Dictionaries are mutable, so
aliasing works as for lists: `b = a` does not copy; `a.copy()` does.

## Looping over a dictionary

A `for` loop over a dictionary gives its **keys**. `values()` gives the values, and `items()`
gives `(key, value)` tuples that you unpack in the `for` line:

```python
capitals = {"France": "Paris", "Peru": "Lima", "Japan": "Tokyo"}
for country in capitals:
    print(country, end=" ")
print()
for city in capitals.values():
    print(city, end=" ")
print()
for country, city in capitals.items():
    print(f"{country}: {city}")
print(list(capitals.keys()), sorted(capitals))
```

```text
France Peru Japan
Paris Lima Tokyo
France: Paris
Peru: Lima
Japan: Tokyo
['France', 'Peru', 'Japan'] ['France', 'Japan', 'Peru']
```

Dictionaries **keep insertion order**: keys come out in the order they were first added
(guaranteed since Python 3.7). `sorted(d)` gives the keys sorted. Do not add or delete keys while
looping over a dict: Python stops with `RuntimeError: dictionary changed size during iteration`.
Loop over `list(d)`, a copy of the keys, if you must.

## Counting and grouping

Two patterns cover a large share of everyday data work.

```python
text = "the cat and the hat and the bat"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
print(counts)

groups = {}
for fruit in ["apple", "banana", "avocado", "cherry", "blueberry"]:
    letter = fruit[0]
    if letter not in groups:
        groups[letter] = []
    groups[letter].append(fruit)
print(groups)
```

```text
{'the': 3, 'cat': 1, 'and': 2, 'hat': 1, 'bat': 1}
{'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
```

- **Counting**: `counts.get(word, 0) + 1` treats a word not seen yet as 0.
- **Grouping**: the value is a list. Create the empty list the first time a key appears, then
  append to it.

## Sets

A **set** is an unordered collection of **unique** items. It answers "is this in it?" very
quickly, and removes duplicates for free. Write it in braces without colons, or build it with
`set(...)`. The empty set is `set()`, because `{}` is an empty dict.

```python
colours = {"red", "green", "red", "blue"}
print(len(colours), sorted(colours))
colours.add("pink")
colours.discard("black")
colours.remove("green")
print(sorted(colours), "red" in colours)
print(type({}), type(set()))
evens = {0, 2, 4, 6, 8}
squares = {0, 1, 4, 9}
print(evens | squares)
print(evens & squares)
print(evens - squares)
print(evens ^ squares)
```

```text
3 ['blue', 'green', 'red']
['blue', 'pink', 'red'] True
<class 'dict'> <class 'set'>
{0, 1, 2, 4, 6, 8, 9}
{0, 4}
{8, 2, 6}
{1, 2, 6, 8, 9}
```

- The duplicate `"red"` was kept once.
- `add` inserts; `remove` deletes and raises `KeyError` if the item is absent; `discard` deletes
  if present and is silent otherwise.
- `|` **union** (in either), `&` **intersection** (in both), `-` **difference** (in the first,
  not the second), `^` **symmetric difference** (in exactly one).
- A set has **no order** and no indices: `{8, 2, 6}` shows that. Use `sorted(s)` when the order
  of the output matters. `sorted(set(items))` is the classic way to list unique items in order.

## Hashable keys and members

Dictionary keys and set members must be **hashable**: Python computes a number from the value,
its **hash**, and uses it to find the entry fast. That only works if the value can never change.
Numbers, strings and tuples of them are hashable; lists, dicts and sets are not.

```python
grid = {(0, 0): "start", (2, 1): "treasure"}
print(grid[(2, 1)])
bad = {["a", "b"]: 1}
```

```text
treasure
Traceback (most recent call last):
  File "/tmp/e.py", line 3, in <module>
    bad = {["a", "b"]: 1}
          ^^^^^^^^^^^^^^^
TypeError: cannot use 'list' as a dict key (unhashable type: 'list')
```

A tuple of coordinates makes a good key; a list cannot be one. This is one more reason to choose a
tuple for a fixed group of values. (Python 3.15 also adds `frozendict`, an immutable dictionary,
covered at the advanced level.)

## Common mistakes

- **`d[key]` for a key that may be missing.** Use `in` or `get`.
- **Testing values with `in`.** `in d` checks keys; use `in d.values()` for values.
- **`{}` for an empty set.** It is an empty dict; write `set()`.
- **Methods from other languages.** Python 3.15 explains: `prices.put("tea", 2)` gives
  `AttributeError: 'dict' object has no attribute 'put'. Use d[k] = v.`
- **Expecting a set to keep order.** Sort it for display.

## Practice

1. Count the letters of `"Mississippi"`, ignoring case, then print the most common letter and its
   count (the first one found if there is a tie).
2. Alice plays `{"chess", "go", "poker"}`, Bob `{"poker", "bridge", "chess"}`. Print, sorted, the
   games both play and the games only one of them plays.
3. `marks = {"Ada": 91, "Bo": 78}`. Add Cy with 85 and change Bo to 80 in one call.

### Answers

1. ```python
   letters = {}
   for ch in "Mississippi".lower():
       letters[ch] = letters.get(ch, 0) + 1
   best = ""
   for ch, n in letters.items():
       if best == "" or n > letters[best]:
           best = ch
   print(letters)
   print(best, letters[best])
   ```

   ```text
   {'m': 1, 'i': 4, 's': 4, 'p': 2}
   i 4
   ```

   `n > letters[best]` uses `>`, so the tie with `s` keeps `i`, found first.
2. `print(sorted(alice & bob), sorted(alice ^ bob))` prints `['chess', 'poker'] ['bridge', 'go']`.
3. `marks.update({"Cy": 85, "Bo": 80})` gives `{'Ada': 91, 'Bo': 80, 'Cy': 85}`. Bo keeps his
   place because updating a key does not move it.

## Key takeaways

- A dict maps unique, hashable keys to values; `d[key]` raises `KeyError`, `get` does not.
- Assign to add or change, `del` or `pop` to remove; `in` checks keys.
- Loop with `keys()`, `values()` or `items()`; dicts keep insertion order.
- `d.get(k, 0) + 1` counts; a dict of lists groups.
- Sets hold unique items with fast `in`, and support `|`, `&`, `-` and `^`.

## Further reading

- [Tutorial: Dictionaries and sets](https://docs.python.org/3.15/tutorial/datastructures.html#dictionaries)
- [Built-in types: Mapping types, dict](https://docs.python.org/3.15/library/stdtypes.html#mapping-types-dict)
- [Built-in types: Set types](https://docs.python.org/3.15/library/stdtypes.html#set-types-set-frozenset)
- [Glossary: hashable](https://docs.python.org/3.15/glossary.html#term-hashable)
