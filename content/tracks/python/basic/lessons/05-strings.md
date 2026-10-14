---
title: Strings
summary: Write string literals with single, double and triple quotes, escape sequences and raw strings, index and slice strings, understand why they cannot be changed, join and repeat them, test membership, use the most common string methods, and format values with f-strings.
minutes: 35
objectives:
  - Write string literals containing quotes, newlines, tabs and backslashes
  - Index and slice a string, including negative indices and steps
  - Explain string immutability and build new strings with +, * and methods
  - Clean and take apart text with strip, lower, upper, replace, split, join, find, count and startswith
  - Format numbers and text in f-strings with width, alignment and decimal places
---

## Outline

1. String literals and quotes
2. Escape sequences, raw strings and triple quotes
3. Indexing and slicing
4. Strings are immutable
5. Joining, repeating and `in`
6. Common string methods
7. f-strings and format specifications

## String literals and quotes

A **string** (type `str`) is a sequence of characters: letters, digits, spaces, punctuation, and
any character of any language. You write a string **literal** between single quotes `'...'` or
double quotes `"..."`; both make the same string. PEP 8 asks you to pick one style and stay with
it. Choose the other kind when the text contains a quote:

```python
print('It\'s raining')
print("It's raining")
print('She said "hi"')
```

```text
It's raining
It's raining
She said "hi"
```

`'It\'s raining'` uses a **backslash** to **escape** the apostrophe: `\'` means "a quote that is
part of the text, not the end of the string". Using double quotes outside is simpler.

## Escape sequences, raw strings and triple quotes

A backslash followed by certain characters is an **escape sequence**, standing for one character
that is hard to type:

| Escape | Meaning |
| --- | --- |
| `\n` | new line |
| `\t` | tab |
| `\\` | one backslash |
| `\'` and `\"` | a quote |

A **raw string**, written with `r` before the quote, turns escapes off: every backslash is kept.
It suits Windows paths. A **triple-quoted** string, `"""..."""` or `'''...'''`, may span several
lines, and the line breaks become part of it.

```python
print("C:\\Users\\ada")
print(r"C:\Users\ada")
print("name\tscore\nAda\t92")
poem = """Roses are red,
violets are blue."""
print(poem)
print(len("Hi\n"), len(""))
```

```text
C:\Users\ada
C:\Users\ada
name	score
Ada	92
Roses are red,
violets are blue.
3 0
```

`len()` counts characters: `"Hi\n"` has three, because `\n` is one character. `""` is the
**empty string**, of length 0.

## Indexing and slicing

Each character has a position, its **index**, counted from **0**. Negative indices count from the
end: `-1` is the last character. A **slice** `s[start:stop]` takes the characters from `start` up
to but **not including** `stop`. Leaving out `start` means "from the beginning", leaving out `stop`
means "to the end", and a third number is a **step**.

```python
word = "Python"
print(word[0], word[5], word[-1], word[-2])
print(word[0:2], word[2:5], word[:2], word[4:], word[-2:])
print(word[::2], word[::-1], word[1:100])
print(word[6])
```

```text
P n n o
Py tho Py on on
Pto nohtyP ython
Traceback (most recent call last):
  File "/tmp/b.py", line 5, in <module>
    print(word[6])
          ~~~~^^^
IndexError: string index out of range
```

```text
 P   y   t   h   o   n
 0   1   2   3   4   5
-6  -5  -4  -3  -2  -1
```

`word[::-1]` steps backwards and reverses the string. A slice never fails: `word[1:100]` simply
stops at the end. A single index past the end is an `IndexError`: a six-character string has
indices 0 to 5. Python has no separate character type; `word[0]` is a string of length 1.

## Strings are immutable

Strings are **immutable**: once created, a string object never changes.

```python
word = "Python"
word[0] = "J"
```

```text
Traceback (most recent call last):
  File "/tmp/c.py", line 2, in <module>
    word[0] = "J"
    ~~~~^^^
TypeError: 'str' object does not support item assignment
```

Instead you build a **new** string and, if you like, bind the old name to it:
`word = "J" + word[1:]` makes `"Jython"`. Every string method below also returns a new string and
leaves the original as it was.

## Joining, repeating and `in`

`+` **concatenates** (joins) two strings, and `*` **repeats** a string. `in` and `not in` test
whether one string occurs inside another, and are case-sensitive.

```python
word = "Python"
print("J" + word[1:])
print("ab" * 3, "-" * 10)
print("th" in word, "TH" in word, "x" not in word)
print("Age: " + 7)
```

```text
Jython
ababab ----------
True False True
Traceback (most recent call last):
  File "/tmp/d.py", line 5, in <module>
    print("Age: " + 7)
          ~~~~~~~~^~~
TypeError: can only concatenate str (not "int") to str
```

`+` will not join text and a number. Convert the number with `str(7)` (lesson 6) or, better, use
an f-string.

## Common string methods

A **method** is a function that belongs to an object, called with a dot: `text.upper()`.

```python
entered = "  ada LOVELACE  "
clean = entered.strip()
print(clean.upper(), clean.lower(), clean.title())
sentence = "the cat sat on the mat"
print(sentence.count("at"), sentence.find("sat"), sentence.find("dog"))
print(sentence.replace("the", "a"))
words = sentence.split()
print(words)
print("-".join(words))
print("2026-10-15".split("-"))
print(sentence.startswith("the"), sentence.endswith("mat"))
```

```text
ADA LOVELACE ada lovelace Ada Lovelace
3 8 -1
a cat sat on the mat
['the', 'cat', 'sat', 'on', 'the', 'mat']
the-cat-sat-on-the-mat
['2026', '10', '15']
True True
```

- `strip()` removes spaces, tabs and newlines from both ends; `lstrip()` and `rstrip()` from one.
- `upper()`, `lower()` and `title()` change case.
- `count(sub)` counts occurrences; `find(sub)` gives the index of the first one, or `-1` if there
  is none. To ask only "is it there?", use `in`.
- `replace(old, new)` replaces every occurrence.
- `split()` with no argument splits on runs of whitespace; `split("-")` splits on each `-`. The
  result is a **list** of strings, written in square brackets (lesson 9).
- `sep.join(words)` is the reverse: it glues strings together with `sep` between them.
- `startswith` and `endswith` test the beginning and the end.

## f-strings and format specifications

An **f-string** has an `f` before the quote, and any expression in `{braces}` inside it is
evaluated and inserted. After a colon you may add a **format specification**: a width, an
alignment (`<` left, `>` right, `^` centre), and for numbers a precision such as `.2f` (two
decimal places), `d` (whole number), `,` (thousands separator) or `%`.

```python
name = "Ada"
score = 92.456
count = 7
print(f"{name} scored {score:.1f} points")
print(f"|{name:>8}|{name:<8}|{name:^8}|")
print(f"|{count:3d}|{count:05d}|{score:8.2f}|")
print(f"{1234567:,} {0.256:.1%}")
print(f"{count * 2 = }")
```

```text
Ada scored 92.5 points
|     Ada|Ada     |  Ada   |
|  7|00007|   92.46|
1,234,567 25.6%
count * 2 = 14
```

`{score:.1f}` rounds for display only; `score` is unchanged. `{count:05d}` pads with zeros to
width 5. A `=` after the expression prints the expression too, which is handy while checking a
program. To print a literal brace, double it: `f"{{"`.

## Common mistakes

- **Single backslashes in Windows paths.** `"C:\Users\ada"` is a `SyntaxError`, because `\U`
  starts an escape: `(unicode error) 'unicodeescape' codec can't decode bytes in position 2-3:
  truncated \UXXXXXXXX escape`. Write `r"C:\Users\ada"` or `"C:\\Users\\ada"`.
- **Expecting a method to change the string.** `name.strip()` on its own line does nothing
  useful. Write `name = name.strip()`.
- **Off-by-one slices.** `word[0:3]` has three characters, indices 0, 1 and 2; the stop is
  excluded.
- **Forgetting the `f`.** `"Total: {total}"` prints the braces literally.

## Practice

1. For `code = "Py-2026-X"`, print `2026` with a slice, the last character with a negative index,
   and the code in lower case with the dashes removed.
2. `entry = "  Grace,  Hopper "`. Print `Hopper, Grace` using `split` and `strip`.
3. Print a two-row price list, `Tea` at 2.5 and `Biscuits` at 12, with names left-aligned in 10
   characters and prices right-aligned in 8 with two decimals.

### Answers

1. ```python
   code = "Py-2026-X"
   print(code[3:7], code[-1], code.lower().replace("-", ""))
   ```

   ```text
   2026 X py2026x
   ```

   Methods can be chained: `lower()` returns a new string, and `replace` is called on it.
2. `entry.split(",")` gives the two parts with their spaces; strip each one.

   ```python
   first, last = entry.split(",")
   print(f"{last.strip()}, {first.strip()}")
   ```

   ```text
   Hopper, Grace
   ```

3. ```python
   print(f"{'Tea':<10}{2.5:>8.2f}")
   print(f"{'Biscuits':<10}{12:>8.2f}")
   ```

   ```text
   Tea           2.50
   Biscuits     12.00
   ```

## Key takeaways

- Strings are written in `'...'`, `"..."` or `"""..."""`; `\n`, `\t` and `\\` are escapes, and
  `r"..."` turns escapes off.
- Indices start at 0, negative ones count from the end, and slices exclude their stop.
- Strings are immutable: methods and operators return new strings.
- `+` joins, `*` repeats, `in` searches; `split` and `join` take text apart and put it together.
- f-strings insert values, and `:>8.2f`-style specifications control width and decimals.

## Further reading

- [Tutorial: Text](https://docs.python.org/3.15/tutorial/introduction.html#text)
- [Built-in types: String methods](https://docs.python.org/3.15/library/stdtypes.html#string-methods)
- [Tutorial: Formatted string literals](https://docs.python.org/3.15/tutorial/inputoutput.html#formatted-string-literals)
- [Language reference: String literals and escape sequences](https://docs.python.org/3.15/reference/lexical_analysis.html#string-and-bytes-literals)
