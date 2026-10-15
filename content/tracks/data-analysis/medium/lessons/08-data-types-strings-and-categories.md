---
title: Data Types, Strings and Categories
summary: Know the dtypes pandas uses, convert columns with `astype` and `pd.to_numeric(errors="coerce")`, understand pandas 3's default `str` dtype and what it refuses, and use categoricals, ordered or not, to save memory and sort by meaning.
minutes: 35
objectives:
  - Name the common pandas dtypes and the kind of data each holds
  - Convert columns with `astype` and know what it truncates or refuses
  - Turn text with bad entries into numbers with `pd.to_numeric(errors="coerce")`
  - Explain the pandas 3 `str` dtype, how to test for it and when `object` still appears
  - Create plain and ordered categoricals and compare their memory with text columns
---

## Outline

1. The dtypes you will meet
2. Converting with `astype` and `to_numeric`
3. The `str` dtype
4. Categoricals
5. Memory

## The dtypes you will meet

Every column has one dtype, and it decides what the column can hold and what operations mean:

| dtype | holds | missing marker |
| --- | --- | --- |
| `int64` | whole numbers | none: a gap turns the column into `float64` |
| `float64` | decimals | NaN |
| `bool` | `True`/`False` | none |
| `datetime64[us]` | dates and times | NaT |
| `str` | text (pandas 3 default) | NaN |
| `category` | a fixed set of values | NaN |
| `Int64`, `Float64`, `boolean` | nullable numbers and booleans | `<NA>` |
| `object` | any Python objects, mixed types | `None` or NaN |

A running club exported its race results. Everything arrives as text:

```python
import io

import numpy as np
import pandas as pd

results_csv = """runner,club,age_group,finish_min,paid
Ana,Harriers,20-39,48.5,yes
Ben,Striders,40-59,DNF,yes
Cara,Harriers,U20,51.2,no
Dev,Joggers,60+,63.0,yes
Eli,Striders,20-39,45.9,yes
"""
results = pd.read_csv(io.StringIO(results_csv))
print(results.dtypes)
```

```text
runner        str
club          str
age_group     str
finish_min    str
paid          str
dtype: object
```

`finish_min` should be a number, but Ben did not finish and the file says `DNF`. One word in a
column of numbers is enough to make `read_csv` read the whole column as text.

## Converting with `astype` and `to_numeric`

`astype(dtype)` converts a whole column and raises if any value cannot be converted.
`pd.to_numeric(..., errors="coerce")` converts what it can and turns the rest into NaN:

```python
try:
    results["finish_min"].astype("float64")
except ValueError as error:
    print("ValueError:", error)
results["finish_min"] = pd.to_numeric(results["finish_min"], errors="coerce")
results["paid"] = results["paid"].map({"yes": True, "no": False})
print(results.dtypes)
```

```text
ValueError: could not convert string to float: 'DNF'
runner            str
club              str
age_group         str
finish_min    float64
paid             bool
dtype: object
```

- `astype` failed on `DNF`. That is useful: it names the bad value.
- `errors="coerce"` made Ben's time NaN, which is honest: he has no finishing time. Check how many
  values became NaN, comparing `isna().sum()` before and after, so that a typo such as `4l.5` does
  not vanish unnoticed.
- `yes`/`no` text became a real `bool` column through `map` with a dict, from lesson 6.

Two `astype` behaviours to know, both inherited from NumPy:

```python
print(pd.Series([2.7, -1.9, 3.5]).astype("int64").tolist())
print(pd.Series(["7", "12", "3"]).astype("int64").sum())
print(pd.Series([1.5, np.nan]).astype("str").tolist())
```

```text
[2, -1, 3]
22
['1.5', nan]
```

Converting floats to integers **truncates** toward zero (2.7 becomes 2 and -1.9 becomes -1); it does
not round. Text that holds clean numbers converts directly, so the sum is 22, not the string
`"7123"`. Converting to `str` keeps NaN as a missing value instead of writing the text `"nan"`, as
pandas 2 did. Converting a float column with NaN to `int64` raises `IntCastingNaNError`, because
`int64` has no missing marker; use `Int64` there.

## The `str` dtype

Since pandas 3, text columns get the **`str` dtype**. It holds only strings and missing values. In
this course's setup pyarrow stores the text, compactly, in one block of memory. Earlier pandas used
the `object` dtype, an array of pointers to Python objects of any type:

```python
clubs = results["club"]
print(clubs.dtype, clubs.dtype == "str", clubs.dtype == object)
print(pd.api.types.is_string_dtype(clubs))
try:
    results.loc[0, "club"] = 7
except TypeError as error:
    print("TypeError:", error)
mixed = pd.Series(["Harriers", 7, None])
print(mixed.dtype, mixed.tolist())
```

```text
str True False
True
TypeError: Invalid value '7' for dtype 'str'. Value should be a string or missing value, got 'int' instead.
object ['Harriers', 7, None]
```

- Test for text with `dtype == "str"` or `pd.api.types.is_string_dtype(...)`. The old test
  `dtype == object` is `False` now, and code that relies on it silently skips text columns.
- A `str` column **refuses** anything that is not a string: putting the number 7 into a club name
  raises `TypeError`. Write `"7"` if you mean text, or convert the column with `astype("object")`
  if it must hold mixed values.
- Mixed data still gets `object`. A Series of a string, an integer and `None` cannot be `str`, so
  pandas falls back to `object` and keeps `None` as it is.
- Single values come out as ordinary Python `str` objects, and `.str` methods (advanced level) work
  the same on both dtypes.

## Categoricals

A **categorical** column stores each distinct value once, in its **categories**, and each row as a
small integer **code** that points into them. Age groups have a meaning order, which alphabetical
order does not respect (`"20-39"` sorts before `"U20"`). An **ordered** categorical fixes that:

```python
order = pd.CategoricalDtype(["U20", "20-39", "40-59", "60+"], ordered=True)
results["age_group"] = results["age_group"].astype(order)
print(results.sort_values("age_group")[["runner", "age_group"]])
print(results.loc[results["age_group"] >= "40-59", "runner"].tolist())
print(results["age_group"].cat.codes.tolist())
try:
    results.loc[1, "age_group"] = "80+"
except TypeError as error:
    print("TypeError:", error)
```

```text
  runner age_group
2   Cara       U20
0    Ana     20-39
4    Eli     20-39
1    Ben     40-59
3    Dev       60+
['Ben', 'Dev']
[1, 2, 0, 3, 1]
TypeError: Cannot setitem on a Categorical with a new category (80+), set the categories first
```

- Sorting follows the category order, and `>=` compares by it: `"60+"` is above `"40-59"`.
- `.cat.codes` shows the integers stored: Ana's `20-39` is code 1, the second category.
- Only listed categories are allowed, which catches typos at the moment they are written.
- `astype("category")` without a list takes the distinct values as categories, unordered and sorted.

## Memory

Categoricals pay off when a column repeats a few values many times. Here are 100,000 club names in
three forms; `memory_usage` reports bytes, without and with `deep`:

```python
rng = np.random.default_rng(1)
entries = pd.Series(rng.choice(["Harriers", "Striders", "Joggers"], size=100_000))
as_object = entries.astype("object")
as_category = entries.astype("category")
for label, s in [("str", entries), ("object", as_object), ("category", as_category)]:
    print(f"{label:9}{s.memory_usage(index=False):>9}{s.memory_usage(index=False, deep=True):>10}")
```

```text
str        1566689   1566689
object      800000   5666689
category    100048    100048
```

- `object` looks small without `deep` (800,000 bytes is just one pointer per row) but really uses
  5.7 MB, because every Python string object has overhead. For a frame with `object` columns,
  `info()` prints the memory as a lower bound with a `+`, such as `180.0+ bytes`.
- `str` stores the characters themselves in one block plus offsets: 1.6 MB, measured exactly
  either way.
- `category` needs one `int8` code per row plus three strings: 0.1 MB, about sixteen times smaller
  than `str`.

When almost every value is different (names, ids), a categorical saves nothing, since every value is
a category. Use it for columns with few distinct values, or when an order matters.

## Common mistakes

- **`astype(int)` to round.** It truncates: 2.7 becomes 2. Round first with `round()` if that is
  what you mean.
- **`errors="coerce"` without checking.** Every unreadable value becomes NaN silently. Count the
  NaN before and after, or look at the rows that turned NaN.
- **`dtype == object` to find text.** In pandas 3 text is `str`; use
  `pd.api.types.is_string_dtype`.
- **Assigning a number into a `str` column.** It raises `TypeError: Invalid value ... for dtype 'str'`.
  Assign a string, or NaN for missing.
- **Sorting ordinal text alphabetically.** `"20-39"` comes before `"U20"`. Use an ordered
  `CategoricalDtype`.

## Practice

1. Convert `pd.Series(["12", "n/a", "7", "five"])` to numbers, unreadable values becoming NaN, and
   count how many became NaN.
2. Make a shirt size column `["M", "XL", "S", "M"]` an ordered categorical from `S` to `XL` and
   sort it.
3. What does `pd.Series([9.99, -0.5]).astype("int64")` give, and why?

### Answers

```python
counts = pd.to_numeric(pd.Series(["12", "n/a", "7", "five"]), errors="coerce")
print(counts.tolist(), counts.isna().sum())
sizes = pd.Series(["M", "XL", "S", "M"]).astype(
    pd.CategoricalDtype(["S", "M", "L", "XL"], ordered=True)
)
print(sizes.sort_values().tolist())
print(pd.Series([9.99, -0.5]).astype("int64").tolist())
```

```text
[12.0, nan, 7.0, nan] 2
['S', 'M', 'M', 'XL']
[9, 0]
```

Both `n/a` and `five` became NaN, and the column is `float64` because of them. The sizes sort by
the category order, not alphabetically. `astype("int64")` truncates toward zero: 9.99 becomes 9 and
-0.5 becomes 0.

## Key takeaways

- One dtype per column: `int64`, `float64`, `bool`, `datetime64`, `str`, `category`, nullable
  `Int64`/`boolean`, and `object` for mixed values.
- `astype` converts and raises on bad values; float to int truncates.
- `pd.to_numeric(errors="coerce")` turns bad entries into NaN; count them.
- pandas 3 text is `str`: only strings or NaN, tested with `== "str"` or `is_string_dtype`.
- Categoricals store codes plus categories; they save memory on repeated values and an ordered one
  sorts and compares by meaning.

## Further reading

- [pandas user guide: Migration guide for the new string data type](https://pandas.pydata.org/docs/user_guide/migration-3-strings.html)
- [pandas user guide: Categorical data](https://pandas.pydata.org/docs/user_guide/categorical.html)
- [pandas.to_numeric](https://pandas.pydata.org/docs/reference/api/pandas.to_numeric.html)
- [pandas user guide: dtypes](https://pandas.pydata.org/docs/user_guide/basics.html#dtypes)
