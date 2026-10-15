---
title: Working with Text
summary: Clean and take apart text columns with the `.str` accessor. Normalise case and spaces, test for substrings, replace with and without regular expressions, split into columns, pull values out with named groups, handle missing values, and map messy answers onto a fixed set of categories.
minutes: 40
objectives:
  - Normalise text with `str.strip` and `str.lower`, and measure it with `str.len`
  - Test text with `str.contains` and `str.startswith`, knowing which one treats the pattern as a regular expression
  - Replace text literally and with regular expressions using `str.replace`
  - Split text into columns with `str.split(expand=True)` and extract values with named groups in `str.extract`
  - Clean free-text answers into a fixed set of categories
---

## Outline

1. The `.str` accessor
2. Testing text: `contains` and `startswith`
3. Replacing, with and without regular expressions
4. Splitting into columns
5. Extracting values with named groups
6. Cleaning messy categories into a fixed set

## The `.str` accessor

A Python string has methods such as `strip` and `lower`. A text column holds many strings, and its **`.str` accessor** offers the same methods, applied to every value at once and returning a new Series. In pandas 3 a text column has the `str` dtype (lesson 8 of pandas Foundations), and missing values in it are `NaN`, which every `.str` method passes through untouched.

A commuter survey asked "How do you get to work?" and got what free text always gets:

```python
import pandas as pd

answers = pd.Series(["  Bike", "bus", "BUS ", None, "Car (shared)", "bicycle", "Walk"])
clean = answers.str.strip().str.lower()
print(clean)
print(clean.str.len().tolist())
```

```text
0            bike
1             bus
2             bus
3             NaN
4    car (shared)
5         bicycle
6            walk
dtype: str
[4.0, 3.0, 3.0, nan, 12.0, 7.0, 4.0]
```

`strip` removes spaces at both ends (`lstrip` and `rstrip` do one end), and `lower` makes `"bus"` and `"BUS "` equal. Each call returns a Series, so the calls chain. `str.len` counts characters; the lengths are floats because the missing answer has no length and `NaN` is a float.

## Testing text: `contains` and `startswith`

Methods that test text return a boolean Series, ready to use as a mask. In a `str` column a missing value tests as `False`:

```python
print(clean.str.contains("bi").tolist())
print(clean.str.startswith("b").tolist())
print(clean.str.contains("BI", case=False).sum())
```

```text
[True, False, False, False, False, True, False]
[True, True, True, False, False, True, False]
2
```

`case=False` ignores case, and `sum` counts the matches. One difference matters: `startswith` and `endswith` compare plain text, but **`contains` treats its pattern as a regular expression** by default. A **regular expression** (regex) is a small pattern language from Python's `re` module, where characters such as `.`, `+`, `?`, `(` and `)` have special meanings. To search for a literal `+`, pass `regex=False`. The pieces this lesson uses:

- `\d` a digit, `\s` a space or tab, `.` any character, `[A-Z]` one capital letter.
- `+` one or more of the previous item, `*` zero or more, `?` zero or one, `{3}` exactly three.
- `a|b` either, `(...)` a group, `\(` a literal parenthesis, `$` the end of the text.

## Replacing, with and without regular expressions

`str.replace` is the opposite: by default it replaces the **literal** text. With `regex=True` the pattern is a regular expression, which can match many different strings at once:

```python
notes = pd.Series(["bike", "car (shared)", "car (own)", None])
print(notes.str.replace("(shared)", "").tolist())
print(notes.str.replace("(shared)", "", regex=True).tolist())
print(notes.str.replace(r"\s*\(.*\)", "", regex=True).tolist())
```

```text
['bike', 'car ', 'car (own)', nan]
['bike', 'car ()', 'car (own)', nan]
['bike', 'car', 'car', nan]
```

The first call removed the literal `(shared)` but left a trailing space. In the second, the parentheses became a regex **group**, so only the word `shared` was matched and removed. The third pattern says "any spaces, an opening parenthesis, anything, a closing parenthesis" (`\(` is an escaped, literal parenthesis), so it removes every note in brackets. Write regex patterns as raw strings, `r"..."`, so Python leaves the backslashes alone.

## Splitting into columns

`str.split(sep)` turns each string into a list. With `expand=True` the pieces become the columns of a DataFrame instead, and `n=1` splits at the first separator only, so the rest stays together:

```python
signups = pd.DataFrame({"name": ["Okafor, Ada", "Lindqvist,Sven", "Moreau, Anne Marie"]})
parts = signups["name"].str.split(",", n=1, expand=True)
signups["last"] = parts[0].str.strip()
signups["first"] = parts[1].str.strip()
print(signups)
```

```text
                 name       last       first
0         Okafor, Ada     Okafor         Ada
1      Lindqvist,Sven  Lindqvist        Sven
2     Moreau, Anne Marie     Moreau  Anne Marie
```

The new columns are named `0` and `1`. Splitting on `","` rather than `", "` copes with the missing space after `Lindqvist`, and `strip` tidies the pieces. Without `expand=True`, each value would be a list, ready for `explode` from lesson 3.

## Extracting values with named groups

When the part you want is defined by a pattern rather than a separator, use `str.extract`. Each regex group becomes a column, and a **named group**, written `(?P<name>...)`, names its column:

```python
items = pd.Series(["Oat milk 1L", "Coffee beans 250g", "Sugar 1.5kg", "Napkins", "Syrup 750 ml"])
pattern = r"(?P<amount>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|ml|L)$"
sizes = items.str.extract(pattern)
print(sizes)
sizes["amount"] = pd.to_numeric(sizes["amount"])
print(sizes["amount"].tolist())
```

```text
  amount unit
0      1    L
1    250    g
2    1.5   kg
3    NaN  NaN
4    750   ml
[1.0, 250.0, 1.5, nan, 750.0]
```

Read the pattern piece by piece: `\d+` is one or more digits, `(?:\.\d+)?` an optional decimal part (`(?:...)` groups without making a column), `\s*` optional spaces, `kg|g|ml|L` one of four units, and `$` the end of the text. `Napkins` has no match, so its row is all `NaN`. Extracted values are always text (dtype `str`), so convert numbers with `pd.to_numeric`.

## Cleaning messy categories into a fixed set

A report needs a small, fixed list of answers. The recipe is: normalise the text, strip the noise, map every known spelling to its category, and let anything unknown become missing so you can see it:

```python
answers = pd.Series(["  Bike", "bus", "BUS ", None, "Car (shared)", "bicycle", "Walk", "Cycle", "tram?"])
clean = answers.str.strip().str.lower()
clean = clean.str.replace(r"\s*\(.*\)", "", regex=True)
to_mode = {"bike": "cycle", "bicycle": "cycle", "cycle": "cycle",
           "bus": "bus", "car": "car", "walk": "walk"}
mode = pd.Categorical(clean.map(to_mode), categories=["walk", "cycle", "bus", "car"])
print(pd.Series(mode).value_counts(dropna=False))
```

```text
cycle    3
bus      2
NaN      2
walk     1
car      1
Name: count, dtype: int64
```

`map` with a dict returns `NaN` for any value not among its keys, so `"tram?"` joins the unanswered row as missing instead of inventing a sixth category. The categorical fixes the allowed values and their order. `value_counts(dropna=False)` keeps the `NaN` count in view: two answers need a decision, perhaps a new `"tram"` key.

## Common mistakes

- **`.str` on a column that is not text.** `pd.Series([12, 7]).str.lower()` raises `AttributeError: Can only use .str accessor with string values, not integer`. Convert with `astype(str)` if text is really meant.
- **Regex characters in `contains`.** `pd.Series(["2+1 offer"]).str.contains("+")` fails; in this sandbox, whose `str` columns use pyarrow, the error is `pyarrow.lib.ArrowInvalid: Invalid regular expression: no argument for repetition operator: +`. Use `regex=False`.
- **Expecting `replace` to use a regex.** `str.replace(r"\d+", "")` looks for the literal characters `\d+` and changes nothing. Add `regex=True`.
- **Old object columns.** Before pandas 3, text often sat in `object` columns, where `contains` gives `None` or `NaN` for missing values and a mask built from it fails. Pass `na=False`, or convert with `astype("str")`.

## Practice

1. Clean `codes = pd.Series(["ldn-0042", "MAN-0007 ", None, "ldn-0113"])` to upper case without spaces, then extract `city` (three letters) and `number` (four digits) as named groups.
2. Count how many cleaned codes start with `LDN`.
3. From `notes = pd.Series(["late 15 min", "on time", "late 5 min", None])`, get the minutes late as floats, `NaN` where there are none.

### Answers

```python
clean = codes.str.strip().str.upper()
print(clean.str.extract(r"(?P<city>[A-Z]{3})-(?P<number>\d{4})"))
print(clean.str.startswith("LDN").sum())
print(notes.str.extract(r"late (\d+) min", expand=False).astype(float).tolist())
```

```text
  city number
0  LDN   0042
1  MAN   0007
2  NaN    NaN
3  LDN   0113
2
[15.0, nan, 5.0, nan]
```

`[A-Z]{3}` means exactly three capital letters. `number` stays text, which keeps its leading zeros, as an identifier should. With one group and `expand=False`, `extract` returns a Series instead of a one-column DataFrame.

## Key takeaways

- `.str` applies string methods to a whole column; missing values pass through as `NaN`.
- `contains` uses a regex by default and `replace` does not; set `regex=` deliberately.
- `split(expand=True)` makes columns; `n=1` limits the splits.
- `extract` with named groups `(?P<name>...)` gives named columns of text; convert numbers afterwards.
- Clean categories by normalising, mapping known spellings, and counting what is left with `dropna=False`.

## Further reading

- [pandas user guide: Working with text data](https://pandas.pydata.org/docs/user_guide/text.html)
- [API reference: Series.str.replace](https://pandas.pydata.org/docs/reference/api/pandas.Series.str.replace.html)
- [API reference: Series.str.extract](https://pandas.pydata.org/docs/reference/api/pandas.Series.str.extract.html)
- [Python: Regular expression HOWTO](https://docs.python.org/3.15/howto/regex.html)
