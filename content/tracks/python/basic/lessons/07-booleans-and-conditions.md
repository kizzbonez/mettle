---
title: Booleans and Conditions
summary: The bool type and comparison operators, chained comparisons, and, or and not with short-circuit evaluation and the values they return, truthiness, if, elif and else including nesting, the conditional expression, and pass.
minutes: 30
objectives:
  - Write comparisons, including chained ones, and predict their bool results
  - Combine conditions with and, or and not, and explain short-circuit evaluation and the values these operators return
  - Predict the truth value of numbers, strings and None
  - Choose between if, if-else and if-elif-else chains, and order their conditions correctly
  - Write a conditional expression and use pass as a placeholder
---

## Outline

1. `True`, `False` and comparisons
2. Combining conditions: `and`, `or`, `not`
3. Truthiness
4. `if`, `elif` and `else`
5. Nesting and ordering conditions
6. The conditional expression
7. `pass`

## `True`, `False` and comparisons

A program becomes useful when it can make decisions. Decisions rest on the type **`bool`**, which
has exactly two values, `True` and `False` (capitalised; `true` is a `NameError`). A **Boolean
expression** is any expression whose result is one of them. The most common ones are
**comparisons**:

| Operator | Meaning |
| --- | --- |
| `==` | equal |
| `!=` | not equal |
| `<`, `<=` | less than, less than or equal |
| `>`, `>=` | greater than, greater than or equal |

```python
temperature = 23
print(temperature > 20, temperature == 23, temperature != 23)
print(type(temperature > 20))
print(1 == 1.0, 1 == "1")
print("apple" < "banana", "Zebra" < "apple")
print(18 <= temperature < 25)
print(True + True, True == 1)
print(3 < "4")
```

```text
True True False
<class 'bool'>
True False
True True
True
2 True
Traceback (most recent call last):
  File "/tmp/a.py", line 8, in <module>
    print(3 < "4")
          ^^^^^^^
TypeError: '<' not supported between instances of 'int' and 'str'
```

- Numbers of different types compare by value, so `1 == 1.0`. A number never equals a string:
  `1 == "1"` is `False`, which is why input must be converted before comparing.
- Strings compare character by character by their code numbers, so all capitals come before all
  lower-case letters: `"Zebra" < "apple"`.
- Comparisons can be **chained**: `18 <= temperature < 25` means `18 <= temperature and
  temperature < 25`, just as in mathematics. Most languages cannot do this.
- `bool` is a kind of `int`: `True` behaves as 1 and `False` as 0 in arithmetic. Do not rely on it.
- Ordering a number against a string has no meaning, so `<` raises `TypeError`.

## Combining conditions: `and`, `or`, `not`

`and` is true when both sides are true, `or` when at least one is, and `not` flips a value.
Their priority, from highest to lowest, is `not`, `and`, `or`, all below the comparisons, so
`not age > 18` means `not (age > 18)`.

Two details make Python's versions special:

- **Short-circuit evaluation.** `a and b` does not evaluate `b` if `a` is already false, and
  `a or b` does not evaluate `b` if `a` is already true. The answer is already known.
- **They return one of their operands**, not necessarily `True` or `False`: `a or b` returns `a`
  if it is true, otherwise `b`; `a and b` returns `a` if it is false, otherwise `b`. Only `not`
  always returns a `bool`.

```python
age = 15
has_ticket = True
print(age >= 12 and has_ticket)
print(age < 12 or age > 65)
print(not has_ticket)
nickname = ""
print(nickname or "guest")
print(0 and 1 / 0)
print(5 and "yes", 0 or "" or "last")
```

```text
True
False
False
guest
0
yes last
```

`nickname or "guest"` is a common idiom for a default value: the empty string is false, so `or`
returns `"guest"`. `0 and 1 / 0` never divides, because `0` is false and `and` stops there; no
`ZeroDivisionError` happens.

## Truthiness

Every Python object, not only `True` and `False`, has a **truth value**. These are **false**
("falsy"):

- `False`, and `None`, Python's "no value" object (lesson 12)
- zero of any numeric type: `0`, `0.0`
- empty strings and empty collections: `""`, and the empty list, tuple, dict and set you will
  meet in lessons 9 to 11

Everything else is **true** ("truthy"), including `-1`, `"0"`, `"False"` and `" "` (a space is a
character). So `if reply:` means "if reply is not empty". To ignore a reply of only spaces, test
`if reply.strip():`.

## `if`, `elif` and `else`

An **`if` statement** runs a block of code only when a condition is true. The line ends with a
colon `:`, and the block under it is indented by four spaces. `else:` gives a block for when the
condition is false. `elif` (short for "else if") tests another condition, and you may have as
many as you need. Python checks the conditions from top to bottom and runs **only the first**
block whose condition is true.

```python
score = int(input("Score (0-100): "))
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 50:
    grade = "C"
else:
    grade = "F"
print(f"Grade: {grade}")
if grade != "F":
    print("Passed.")
    if score == 100:
        print("A perfect score!")
```

```text
Score (0-100): 100
Grade: A
Passed.
A perfect score!
```

With 74 it prints `Grade: C` and `Passed.`; with 12, only `Grade: F`. The shapes are:

- `if` alone: do something or nothing.
- `if` / `else`: exactly one of two blocks runs.
- `if` / `elif` / ... / `else`: exactly one of several blocks runs.
- `if` / `elif` without `else`: at most one runs, possibly none.

The final line, `print(f"Grade: {grade}")`, is back at the left margin, so it is no longer part of
any block and always runs.

## Nesting and ordering conditions

A block may contain another `if`; that is **nesting**, as with the perfect score above. Each level
adds four spaces. Keep nesting shallow: two levels are fine, four are hard to read, and often an
`and` says the same thing more simply.

In an `elif` chain, **order matters**. Put the most specific test first:

```python
score = 95
if score >= 50:
    print("C")
elif score >= 90:
    print("A")
```

```text
C
```

95 is at least 50, so the first block runs and the `elif` is never checked. Test `>= 90` first.

A classic combined condition is the leap year rule: divisible by 4, except centuries, unless
divisible by 400.

```python
year = int(input())
if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
    print(f"{year} is a leap year")
else:
    print(f"{year} is not a leap year")
```

For 2024, 1900, 2000 and 2026 it reports leap, not leap, leap, not leap. The parentheses are
needed because `and` binds tighter than `or`.

## The conditional expression

When an `if`/`else` only chooses between two values, a **conditional expression** (sometimes
called the ternary operator) does it in one line: `value_if_true if condition else
value_if_false`.

```python
items = 3
label = "item" if items == 1 else "items"
print(f"{items} {label}")
```

```text
3 items
```

Note the order: the condition sits in the middle, unlike `condition ? a : b` in C or Java. Use it
only for short choices.

## `pass`

A block cannot be empty. When you need a block that does nothing, for example while sketching a
program, write **`pass`**, the statement that does nothing:

```python
age = 70
if age > 65:
    pass  # discount rules come later
else:
    print("full price")
```

With `age = 70` this prints nothing. Without `pass`, the empty `if` block would be an
`IndentationError`.

## Common mistakes

- **`=` instead of `==`.** `if x = 5:` gives
  `SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?`
- **`if day == "sat" or "sun":`** is always true, because it means
  `(day == "sat") or "sun"`, and `"sun"` is a non-empty string. Write
  `day == "sat" or day == "sun"`.
- **Comparing input to a number.** `input() == 5` is always `False`; convert first.
- **Wrong order in an `elif` chain**: a broad test first hides the specific ones.
- **Forgetting the colon** after `if`, `elif` or `else`: `SyntaxError: expected ':'`.

## Practice

1. What does `print(0 or "none", 7 and 0, not "")` print?
2. Read an integer and print `negative`, `zero` or `positive`.
3. Rewrite with a conditional expression: if `minutes` is more than 60, `size` is `"long"`,
   otherwise `"short"`.

### Answers

1. `none 0 True`. `0` is false, so `or` returns `"none"`; `7` is true, so `and` returns `0`;
   `""` is false, so `not ""` is `True`.
2. ```python
   number = int(input())
   if number < 0:
       print("negative")
   elif number == 0:
       print("zero")
   else:
       print("positive")
   ```

   Exactly one branch runs; `else` covers everything left, the positive numbers.
3. `size = "long" if minutes > 60 else "short"`

## Key takeaways

- Comparisons return `True` or `False` and can be chained: `0 <= x < 10`.
- `and` and `or` short-circuit and return one of their operands; `not` returns a `bool`.
- `False`, `None`, zero and empty strings or collections are false; everything else is true.
- In `if`/`elif`/`else`, only the first true branch runs, so order the tests from specific to
  general.
- `a if condition else b` chooses a value; `pass` fills a block that must exist but does nothing.

## Further reading

- [Tutorial: if statements](https://docs.python.org/3.15/tutorial/controlflow.html#if-statements)
- [Built-in types: Truth value testing, Boolean operations, Comparisons](https://docs.python.org/3.15/library/stdtypes.html#truth-value-testing)
- [Language reference: Boolean operations and conditional expressions](https://docs.python.org/3.15/reference/expressions.html#boolean-operations)
