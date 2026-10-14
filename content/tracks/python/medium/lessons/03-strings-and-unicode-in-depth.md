---
title: Strings and Unicode in Depth
summary: See text as Python does, a sequence of Unicode code points, convert between `str` and `bytes` with UTF-8, compare and sort strings correctly, test, search and split them with the right method, and lay out output with the format specification mini-language.
minutes: 40
objectives:
  - Explain code points, Unicode and UTF-8, and use `ord`, `chr` and Unicode escapes
  - Encode `str` to `bytes` and decode back, choosing an error handler
  - Predict how strings compare and sort, and normalize or casefold them for comparison
  - Choose among the `is...`, find/index and split/partition methods
  - Format values with `str.format`, f-strings and the format specification mini-language
---

## Outline

1. Characters and code points
2. `str` and `bytes`: encoding and decoding
3. Comparing and sorting strings
4. Testing characters with the `is...` methods
5. Searching and splitting
6. `str.format` and the format specification mini-language

## Characters and code points

A computer stores numbers, so text needs an agreed number for each character. **ASCII** (1963) numbered 128 characters: English letters, digits, punctuation and control codes. **Unicode** numbers every character of every writing system, plus symbols and emoji: each gets a **code point**, an integer from 0 to 0x10FFFF, written `U+00E9` for `é`. The first 128 code points are ASCII's.

A Python `str` is a sequence of code points. `ord` gives a character's code point and `chr` the character for a code point:

```python
word = "café"
print(len(word), [ord(ch) for ch in word])
print(chr(233), chr(0x1F40D), "é" == "é", "\N{EURO SIGN}")
print(ord("A"), ord("a"), ord("0"), hex(ord("€")))
```

```text
4 [99, 97, 102, 233]
é 🐍 True €
65 97 48 0x20ac
```

In a literal, `\u` takes four hex digits, `\U` eight, and `\N{...}` a character's official name. `len` counts code points, not bytes and not always what a reader sees as one letter, as the next sections show.

## `str` and `bytes`: encoding and decoding

Files and networks carry **bytes**, numbers from 0 to 255. An **encoding** is the rule that turns code points into bytes. **UTF-8** is the standard one: ASCII characters take one byte each and other characters two to four. A `bytes` value is written `b'...'`; `str.encode` produces one and `bytes.decode` turns it back into text:

```python
text = "naïve €5"
data = text.encode("utf-8")
print(data)
print(len(text), len(data), type(data))
print(data.decode("utf-8"))
print(text.encode("ascii", errors="replace"))
print(b"caf\xe9".decode("utf-8", errors="replace"))
print(b"caf\xe9".decode("latin-1"))
b"caf\xe9".decode("utf-8")
```

```text
b'na\xc3\xafve \xe2\x82\xac5'
8 11 <class 'bytes'>
naïve €5
b'na?ve ?5'
caf�
café
Traceback (most recent call last):
  File "/tmp/b.py", line 9, in <module>
    b"caf\xe9".decode("utf-8")
    ~~~~~~~~~~~~~~~~~^^^^^^^^^
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 3: unexpected end of data
```

- Eight characters became eleven bytes: `ï` takes two and `€` three. In `bytes`, a value outside printable ASCII shows as `\xNN`.
- An encoding that cannot represent a character raises `UnicodeEncodeError`; bytes that are not valid in the encoding raise `UnicodeDecodeError`. The `errors` argument picks another reaction: `"strict"` (the default, raise), `"replace"` (`?` when encoding, `�` when decoding), `"ignore"` (drop it) or `"backslashreplace"` (an escape).
- The bytes `caf\xe9` are "café" in the older Latin-1 encoding but invalid UTF-8. Decoding with the wrong encoding gives an error or, worse, wrong text. Always know the encoding of your data.
- `encode()` and `decode()` without an argument use UTF-8. In Python 3.15 `open()` also defaults to UTF-8 on every system (lesson 11).

## Comparing and sorting strings

Strings compare code point by code point, left to right, which is not dictionary order:

```python
import unicodedata

print("apple" < "banana", "Zebra" < "apple", "10" < "9")
names = ["émile", "Zoe", "adam", "Bea"]
print(sorted(names))
print(sorted(names, key=str.casefold))
composed = "é"
decomposed = "é"
print(composed, decomposed, composed == decomposed, len(composed), len(decomposed))
print(unicodedata.normalize("NFC", decomposed) == composed)
print("Straße".lower(), "Straße".casefold())
```

```text
True True True
['Bea', 'Zoe', 'adam', 'émile']
['adam', 'Bea', 'Zoe', 'émile']
é é False 1 2
True
straße strasse
```

- Every capital letter (65 to 90) comes before every small letter (97 to 122), so `"Zebra" < "apple"`.
- Digits in text compare as characters: `"10" < "9"` because `"1" < "9"`. Convert to `int` to compare numbers.
- `sorted(names, key=str.casefold)` sorts by a case-free form of each name. Lesson 6 explains `key`. `casefold` is a stronger `lower` meant for comparison: it turns `ß` into `ss`. Accented letters still sort after `z`; language-aware sorting needs the `locale` module.
- `é` can be one code point or `e` plus a combining accent. They look identical but are not equal. `unicodedata.normalize("NFC", text)` brings both to the same form; normalize text from outside before comparing it.

## Testing characters with the `is...` methods

Each `is...` method returns `True` when the string is not empty and every character passes the test:

```python
print("text      decim digit numer alpha alnum space")
for text in ["123", "²", "½", "abc", "abc123", " \t", ""]:
    checks = [text.isdecimal(), text.isdigit(), text.isnumeric(),
              text.isalpha(), text.isalnum(), text.isspace()]
    print(f"{text!r:9}", *[f"{check!s:5}" for check in checks])
```

```text
text      decim digit numer alpha alnum space
'123'     True  True  True  False True  False
'²'       False True  True  False True  False
'½'       False False True  False True  False
'abc'     False False False True  True  False
'abc123'  False False False False True  False
' \t'     False False False False False True
''        False False False False False False
```

`isdigit` accepts `²`, yet `int("²")` raises ValueError. To check that text can be passed to `int`, use `isdecimal`. Also useful: `isupper`, `islower`, `istitle`, and `isidentifier` (a valid variable name). These methods know all of Unicode: `"ñ".isalpha()` is `True`. Python 3.15 uses Unicode 17.0.

## Searching and splitting

```python
path = "/home/ada/notes/2026/todo.txt"
print(path.find("/"), path.rfind("/"), path.find("zzz"), path.find("/", 1))
print(path.split("/", 2))
print(path.rsplit("/", 1))
print("key=value=more".partition("="), "no-dot".partition("."))
print("  a  b   c ".split(), "a,,b".split(","))
path.index("zzz")
```

```text
0 20 -1 5
['', 'home', 'ada/notes/2026/todo.txt']
['/home/ada/notes/2026', 'todo.txt']
('key', '=', 'value=more') ('no-dot', '', '')
['a', 'b', 'c'] ['a', '', 'b']
Traceback (most recent call last):
  File "/tmp/e.py", line 7, in <module>
    path.index("zzz")
    ~~~~~~~~~~^^^^^^^
ValueError: substring not found
```

- `find` returns the first position or `-1`; `rfind` searches from the right; both take an optional start. `index` and `rindex` do the same but raise ValueError when the text is missing. Use `in` when you only need yes or no.
- `split(sep, maxsplit)` splits at most `maxsplit` times; `rsplit` counts from the right. With no separator, `split()` splits on any run of whitespace and drops empty pieces; with one, empty pieces stay.
- `partition` always returns three parts: before, separator, after. When the separator is missing, the last two are empty. `rpartition` splits at the last one.

## `str.format` and the format specification mini-language

`str.format` fills `{}` fields with its arguments, by position or by name. After a colon, each field takes a **format specification**, the same mini-language f-strings use: `[[fill]align][sign][#][0][width][grouping][.precision][type]`.

```python
item, qty, price = "Tea", 3, 4.5
print("{} x{} = {:.2f}".format(item, qty, qty * price))
print("{0}/{1}/{0}".format("a", "b"))
print("{name:<8}|{count:>5}|".format(name=item, count=qty))
print(f"{item:*^11}")
print(f"{1234567.891:,.2f} {0.256:.1%} {3.14159:08.3f}")
print(f"{255:#x} {255:b} {255:o} {-3:+d} {5:+d} {65:c}")
print(f"{1e6:e} {123456789:_d} {2/3:.3g}")
width = 8
print(f"[{'left':<{width}}][{'mid':^{width}}][{'right':>{width}}]")
```

```text
Tea x3 = 13.50
a/b/a
Tea     |    3|
****Tea****
1,234,567.89 25.6% 0003.142
0xff 11111111 377 -3 +5 A
1.000000e+06 123_456_789 0.667
[left    ][  mid   ][   right]
```

- Alignment `<`, `>`, `^` with an optional fill character before it; strings align left and numbers right by default. The width is a minimum.
- `.2f` gives two decimals, `%` multiplies by 100, `e` is scientific notation, `g` keeps significant digits, `,` or `_` groups thousands, `0` pads with zeros, `+` always shows a sign.
- `b`, `o`, `x` and `c` show an integer in binary, octal, hex, or as the character with that code point; `#` adds the `0b`/`0o`/`0x` prefix.
- A field can contain another field, as `{width}` above. `!r` uses `repr`: `"{!r}".format("hi")` gives `'hi'` with its quotes.

Use f-strings in your own code and `str.format` when the template is stored apart from the values, for example in a settings file.

## Common mistakes

- **Mixing `str` and `bytes`.** `"id: " + b"42"` raises `TypeError: can only concatenate str (not "bytes") to str`. Decode at the edge of your program and work with `str` inside.
- **Sorting numbers stored as text.** `sorted(["10", "9", "100"])` gives `['10', '100', '9']`. Sort with `int` values.
- **Validating digits with `isdigit`**, which accepts `²`. Use `isdecimal`, or try `int()` and catch ValueError.
- **Expecting `find` to raise.** It returns `-1`, and `text[-1:]` then quietly uses the last character.

## Practice

1. Write `initials("ada  lovelace king")` that returns `"ALK"`.
2. Write `extension(filename)` returning the lower-case extension, or `""` for `README` and `.bashrc`.
3. Print a receipt line for each of `("Tea", 3, 4.5)` and `("Coffee beans", 1, 12.0)` with the name left-aligned in 14 columns.

### Answers

```python
def initials(full_name):
    return "".join([part[0].upper() for part in full_name.split()])


def extension(filename):
    head, dot, tail = filename.rpartition(".")
    return tail.lower() if dot and head else ""


print(initials("ada  lovelace king"))
print([extension(name) for name in ["report.PDF", "archive.tar.gz", "README", ".bashrc"]])
for name, count, unit in [("Tea", 3, 4.5), ("Coffee beans", 1, 12.0)]:
    print(f"{name:<14}{count:>3} x {unit:>6.2f} = {count * unit:>7.2f}")
```

```text
ALK
['pdf', 'gz', '', '']
Tea             3 x   4.50 =   13.50
Coffee beans    1 x  12.00 =   12.00
```

`split()` with no argument ignores the double space. `rpartition` finds the last dot; an empty `head` means the dot started the name.

## Key takeaways

- A `str` is a sequence of Unicode code points; `ord` and `chr` convert between characters and numbers.
- `encode` turns text into `bytes` and `decode` turns bytes back; UTF-8 is the default and the standard.
- Strings compare by code point: normalize and casefold before comparing human text.
- `find` returns `-1`, `index` raises; `split`, `rsplit` and `partition` cut text apart.
- The format mini-language controls fill, alignment, width, sign, grouping, precision and type.

## Further reading

- [Unicode HOWTO](https://docs.python.org/3.15/howto/unicode.html)
- [String methods](https://docs.python.org/3.15/library/stdtypes.html#string-methods)
- [Format Specification Mini-Language](https://docs.python.org/3.15/library/string.html#format-specification-mini-language)
