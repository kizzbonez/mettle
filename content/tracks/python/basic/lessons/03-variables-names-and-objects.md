---
title: Variables, Names and Objects
summary: How assignment binds a name to an object, why Python's names have no fixed type, what type() and id() reveal, the first difference between == and is, the rules and conventions for naming, and multiple and chained assignment.
minutes: 30
objectives:
  - Explain assignment as binding a name to an object, and predict what a name refers to after reassignment
  - Use type() and id() to inspect an object's type and identity
  - Tell == (equal values) from is (the same object)
  - Choose legal, PEP 8 style names and avoid keywords
  - Use multiple and chained assignment, including swapping two values
---

## Outline

1. Objects: identity, type and value
2. Assignment binds a name to an object
3. Dynamic typing
4. Equal or identical: `==` and `is`
5. Naming rules and keywords
6. Naming conventions and constants
7. Multiple and chained assignment

## Objects: identity, type and value

Everything a Python program works with, every number and every piece of text, is an **object**.
The language reference puts it this way: "Every object has an identity, a type and a value."

- The **value** is the data itself: `42`, or the text `"Ada"`.
- The **type** says what kind of object it is and what you can do with it. `42` is an `int`
  (integer), `"Ada"` is a `str` (string), `4.2` is a `float`, and `True` is a `bool`.
- The **identity** is a number that tells this object apart from every other object alive at the
  same time. In CPython it is the object's address in memory.

The built-in function `type()` tells you an object's type, and `id()` its identity.

## Assignment binds a name to an object

A **variable** in Python is a **name** that refers to an object. The statement `score = 10` is an
**assignment**: Python evaluates the right-hand side, gets the object `10`, and **binds** the name
`score` to it. `=` does not mean "equals" as in mathematics. Read it as "now refers to".

```python
score = 10
print(score)
score = score + 5
print(score)
bonus = score
score = 0
print(score, bonus)
```

```text
10
15
0 15
```

Line 3 reads `score` (10), adds 5, and rebinds `score` to the new object 15. Then `bonus = score`
binds a second name to that same object 15. Rebinding `score` to 0 afterwards changes what
`score` refers to, not the object, so `bonus` still refers to 15. Think of names as labels tied to
objects: assignment moves a label; it never changes the object.

A name must be bound before you use it. `print(points)` before any `points = ...` stops with
`NameError: name 'points' is not defined`, sometimes followed by a guess such as
`Did you mean: 'print'?`.

## Dynamic typing

In languages such as C or Java you declare a variable's type, and it can then hold only values of
that type. In Python, **names have no type; objects do**. The same name can refer to an `int` now
and a `str` later. This is called **dynamic typing**.

```python
thing = 42
print(type(thing), id(thing))
thing = "forty-two"
print(type(thing), id(thing))
thing = 4.2
print(type(thing))
thing = True
print(type(thing))
```

```text
<class 'int'> 124315464937424
<class 'str'> 124315453973872
<class 'float'>
<class 'bool'>
```

`<class 'int'>` is how Python prints a type. The identities are large numbers that change from run
to run, and yours will differ; what matters is that the two are different, because `thing` now
refers to a different object. Freedom has a cost: Python will not stop you from rebinding a name
to something unexpected, so choose names that make the intended kind of value obvious.

## Equal or identical: `==` and `is`

Two different questions can be asked about two names:

- `a == b`: do they have **equal values**?
- `a is b`: are they **the same object** (the same identity)?

```python
price = 250000
same = price
typed = int("250000")
print(price == typed, price is typed)
print(price is same)
```

```text
True False
True
```

`int("250000")` turns the text `"250000"` into a number (lesson 6), creating a new `int` object.
Its value equals `price`, so `==` is `True`, but it is a different object, so `is` is `False`.
`same` was bound to the very object `price` refers to, so `price is same` is `True`.

CPython keeps a single object for each small integer and may reuse objects for equal values, so
`is` sometimes says `True` for equal numbers or strings. That is an implementation detail you
must not rely on. **Compare values with `==`.** `is` has one everyday use, checking for `None`,
which lesson 12 shows.

## Naming rules and keywords

A name (the reference calls it an **identifier**) must follow these rules:

- It contains letters, digits and underscores (`_`), and does not start with a digit.
- It is **case-sensitive**: `colour` and `Colour` are two different names.
- It is not a **keyword**. Keywords are words reserved by the language.

```text
False      await      else       import     pass
None       break      except     in         raise
True       class      finally    is         return
and        continue   for        lambda     try
as         def        from       nonlocal   while
assert     del        global     not        with
async      elif       if         or         yield
```

Python 3.15 has these 35 keywords. A few **soft keywords** (`match`, `case`, `_`, `type`, and
`lazy`, new in 3.15) are reserved only in particular statements and can still be used as names
elsewhere. Breaking a rule is a `SyntaxError` before anything runs:

```text
2nd_place = "Bo"     ->  SyntaxError: invalid decimal literal
class = "Year 9"     ->  SyntaxError: invalid syntax
my-score = 3         ->  SyntaxError: cannot assign to expression here.
                         Maybe you meant '==' instead of '='?
```

`my-score` is read as `my` minus `score`, and you cannot assign to a subtraction.

## Naming conventions and constants

Legal is not the same as good. PEP 8, Python's style guide, says variable and function names
"should be lowercase, with words separated by underscores": `max_speed`, `first_name`. This style
is called *snake_case*. Pick names that say what the value means (`seconds_left`, not `x2`), and
avoid `l`, `O` and `I` as single-letter names, which look like `1` and `0`. Also avoid reusing
built-in names such as `print`, `type` or `id`: `print = 5` is allowed, and then `print("hi")`
fails with `TypeError: 'int' object is not callable`.

Python has no true constants. By convention, a name in `ALL_CAPS` is a **constant**, a value the
program sets once and never changes, such as `MAX_PLAYERS = 4`. Python does not enforce it:
assigning `MAX_PLAYERS = 5` later works. The capitals are a promise between programmers.

## Multiple and chained assignment

Python can bind several names in one statement.

```python
width, height = 1920, 1080
print(width, height)
low = high = 0
print(low, high)
left, right = "L", "R"
left, right = right, left
print(left, right)
```

```text
1920 1080
0 0
R L
```

- **Multiple assignment** `width, height = 1920, 1080` binds the names on the left to the values
  on the right, in order. Both sides need the same number of items. (Lesson 10 explains that this
  is tuple unpacking.)
- **Chained assignment** `low = high = 0` binds both names to the same object.
- **Swapping**: `left, right = right, left` evaluates the whole right side first, then binds. In
  most languages a swap needs a third, temporary variable; in Python it is one line.

## Common mistakes

- **Reading `=` as "equals".** `score = score + 5` is not an equation; it rebinds `score` to a new
  value. Comparing for equality is `==`.
- **Using a name before assigning it**: `NameError: name 'points' is not defined`. Check spelling
  and capitals too, because `Total` and `total` differ.
- **Using `is` to compare values.** `typed is price` was `False` although both are 250000. Use
  `==`.
- **Shadowing a built-in.** After `type = "admin"`, calling `type(42)` fails with
  `TypeError: 'str' object is not callable`. Choose another name, such as `user_type`.

## Practice

1. What does this print?

   ```python
   apples = 5
   pears = apples
   apples = apples + 1
   print(apples, pears)
   ```

2. Which of these names are legal, and which follow PEP 8? `total_cost`, `TotalCost`, `3d_view`,
   `for`, `_hidden`, `max-speed`.
3. Using multiple assignment, swap `first` and `third` in
   `first, second, third = "gold", "silver", "bronze"` and print all three.

### Answers

1. `6 5`. `pears` was bound to the object 5. Rebinding `apples` to 6 does not move `pears`.
2. Legal: `total_cost` (PEP 8 style for variables), `TotalCost` (legal, but CapWords is meant for
   class names), `_hidden` (legal; a leading underscore signals "internal"). Illegal: `3d_view`
   starts with a digit, `for` is a keyword, and `max-speed` contains a minus sign.
3. ```python
   first, second, third = "gold", "silver", "bronze"
   first, third = third, first
   print(first, second, third)
   ```

   ```text
   bronze silver gold
   ```

## Key takeaways

- Every object has an identity, a type and a value; `id()` and `type()` show the first two.
- Assignment binds a name to an object. Rebinding a name never changes the object or other names.
- Names have no type; objects do. That is dynamic typing.
- `==` compares values; `is` asks whether two names refer to the same object.
- Names use letters, digits and underscores, cannot start with a digit or be a keyword, and are
  written in snake_case; `ALL_CAPS` marks a constant by convention.
- `a, b = 1, 2` assigns several names, `a = b = 0` chains, and `a, b = b, a` swaps.

## Further reading

- [Language reference: Objects, values and types](https://docs.python.org/3.15/reference/datamodel.html#objects-values-and-types)
- [Language reference: Identifiers and keywords](https://docs.python.org/3.15/reference/lexical_analysis.html#identifiers)
- [PEP 8: Naming conventions](https://peps.python.org/pep-0008/#naming-conventions)
- [Built-in functions: id() and type()](https://docs.python.org/3.15/library/functions.html#id)
