---
title: Adding and Changing Columns
summary: Compute new columns from existing ones, build them with `assign` and pandas 3's `pd.col()`, rename and drop columns, translate values with `map` and `replace`, choose between two values with `where`, `mask` and `np.where`, and change chosen cells with `loc[mask, "col"] = ...`.
minutes: 35
objectives:
  - Add a column computed from other columns with `df["new"] = ...`
  - Build several columns at once with `assign`, using `pd.col()` or a lambda
  - Rename and drop columns, and translate values with `map` and `replace`
  - Choose values by condition with `where`, `mask` and `np.where`
  - Change the cells that match a condition with one `loc[mask, "col"] = value`
---

## Outline

1. Column arithmetic
2. `assign` and `pd.col()`
3. Renaming and dropping
4. Translating values with `map` and `replace`
5. Choosing by condition
6. Changing chosen cells with `loc`

## Column arithmetic

A small seaside hotel keeps its bookings in a frame. `src` is the booking channel as the old
system codes it:

```python
import numpy as np
import pandas as pd

bookings = pd.DataFrame(
    {
        "room": ["double", "single", "suite", "double", "single"],
        "nights": [2, 7, 3, 10, 1],
        "rate": [95.0, 60.0, 180.0, 95.0, 60.0],
        "src": ["W", "P", "A", "W", "X"],
    }
)
bookings["total"] = bookings["nights"] * bookings["rate"]
bookings["hotel"] = "Seaview"
print(bookings)
```

```text
     room  nights   rate src  total    hotel
0  double       2   95.0   W  190.0  Seaview
1  single       7   60.0   P  420.0  Seaview
2   suite       3  180.0   A  540.0  Seaview
3  double      10   95.0   W  950.0  Seaview
4  single       1   60.0   X   60.0  Seaview
```

Assigning to a new name with `[]` adds a column at the right; assigning to an existing name
replaces it. Arithmetic between columns is vectorised and matches rows by index label, as lesson 1
showed for Series. A single value, like `"Seaview"`, is repeated down the whole column, the way
NumPy broadcasts a scalar.

## `assign` and `pd.col()`

`df["new"] = ...` changes `df` itself. `assign` instead returns a **new** frame with the extra
columns and leaves the original untouched. Each keyword argument is a column. pandas 3 added
**`pd.col("name")`**, an expression that stands for a column of whatever frame it is used on:

```python
priced = bookings.assign(
    tax=(pd.col("total") * 0.08).round(2),
    per_night_tax=lambda frame: frame["rate"] * 0.08,
    long_stay=pd.col("nights") >= 7,
)
print(priced[["total", "tax", "per_night_tax", "long_stay"]])
print(bookings.columns.tolist())
```

```text
   total   tax  per_night_tax  long_stay
0  190.0  15.2            7.6      False
1  420.0  33.6            4.8       True
2  540.0  43.2           14.4      False
3  950.0  76.0            7.6       True
4   60.0   4.8            4.8      False
['room', 'nights', 'rate', 'src', 'total', 'hotel']
```

- `pd.col("total") * 0.08` is not computed when you write it. It is a recipe that `assign`
  evaluates on the frame it is called on. That matters when the frame is the result of an earlier
  step and has no variable name. Series methods such as `.round(2)` work on it too.
- Before pandas 3 the same was written with a `lambda` that receives the frame, as for
  `per_night_tax`. Both work; `pd.col` is shorter, and you will see lambdas in older code.
- Columns are created in order, so a later argument may use an earlier one:
  `assign(total=pd.col("nights") * pd.col("rate"), tax=pd.col("total") * 0.08)` works.
- `bookings` has no `tax` column: `assign` never changes the frame it is called on.

## Renaming and dropping

```python
tidy = bookings.rename(columns={"src": "source", "rate": "rate_eur"})
print(tidy.columns.tolist())
print(tidy.drop(columns=["hotel", "total"]).columns.tolist())
print(tidy.drop(index=[0, 4]).index.tolist())
```

```text
['room', 'nights', 'rate_eur', 'source', 'total', 'hotel']
['room', 'nights', 'rate_eur', 'source']
[1, 2, 3]
```

`rename(columns={old: new})` changes the names it finds and ignores the others, so a misspelt old
name fails silently: check `columns` afterwards. `drop(columns=[...])` removes columns and
`drop(index=[...])` removes rows by label; dropping a name that does not exist raises `KeyError`.
Both return new frames.

## Translating values with `map` and `replace`

`map` with a dict looks every value up in the dict. `replace` with a dict changes only the values
it lists:

```python
names = {"W": "website", "P": "phone", "A": "agency"}
print(bookings["src"].map(names).tolist())
print(bookings["src"].replace(names).tolist())
```

```text
['website', 'phone', 'agency', 'website', nan]
['website', 'phone', 'agency', 'website', 'X']
```

The code `X` is not in the dict. `map` turned it into NaN; `replace` left it as it was. Use `map`
when the dict is the complete translation and a missing key means bad data you want to see as
NaN. Use `replace` to correct a few known values and keep the rest.

## Choosing by condition

Three tools pick between two values row by row. Long stays of seven nights or more get 10 % off:

```python
long_stay = bookings["nights"] >= 7
print(bookings["rate"].where(~long_stay, bookings["rate"] * 0.9).tolist())
print(bookings["rate"].mask(long_stay, bookings["rate"] * 0.9).tolist())
bookings["stay"] = np.where(long_stay, "long", "short")
print(bookings[["nights", "stay"]])
```

```text
[95.0, 54.0, 180.0, 85.5, 60.0]
[95.0, 54.0, 180.0, 85.5, 60.0]
   nights   stay
0       2  short
1       7   long
2       3  short
3      10   long
4       1  short
```

- `s.where(cond, other)` **keeps** the values where `cond` is `True` and uses `other` elsewhere.
- `s.mask(cond, other)` is the opposite: it **replaces** where `cond` is `True`. Same result,
  read whichever way states your rule more naturally.
- `np.where(cond, a, b)`, from NumPy Foundations, builds a new array from two choices. Assigned to
  a column, the text becomes a `str` column.

## Changing chosen cells with `loc`

To change some cells of an existing column in place, give `loc` the row mask **and** the column in
one pair of brackets:

```python
bookings.loc[long_stay, "rate"] = bookings.loc[long_stay, "rate"] * 0.9
bookings.loc[bookings["src"] == "X", "src"] = "W"
bookings.loc[3, "nights"] = 9
print(bookings[["room", "nights", "rate", "src", "stay"]])
```

```text
     room  nights   rate src   stay
0  double       2   95.0   W  short
1  single       7   54.0   P   long
2   suite       3  180.0   A  short
3  double       9   85.5   W   long
4  single       1   60.0   W  short
```

`bookings.loc[rows, column] = value` is **one** operation on `bookings` itself, so pandas knows to
change `bookings`. The right-hand side may be a single value or values for exactly the selected
rows, which line up by label. Note that `long_stay` was computed before the changes: a mask is a
snapshot, and after a write it still describes the old values.

## Common mistakes

- **Chained assignment.** Two brackets in a row, `bookings[bookings["nights"] >= 7]["rate"] = 0.0`,
  first make a new object and then change that object, never `bookings`. pandas 3 warns:

  ```text
  ChainedAssignmentError: A value is being set on a copy of a DataFrame or Series through chained assignment.
  Such chained assignment never works to update the original DataFrame or Series, because the intermediate object on which we are setting values always behaves as a copy (due to Copy-on-Write).
  ```

  and `bookings` is unchanged. Write `bookings.loc[bookings["nights"] >= 7, "rate"] = 0.0`.
  Lesson 9 explains why.
- **Expecting `assign` or `rename` to change the frame.** They return a new one. Assign it:
  `bookings = bookings.assign(...)`.
- **`map` with an incomplete dict.** Every value missing from the dict becomes NaN. If you meant
  "fix these and keep the rest", use `replace`.
- **`where` the wrong way round.** `where` keeps where the condition is `True`. If your rule says
  "change where", use `mask`.

## Practice

Start again from the four-column `bookings`.

1. Add a column `guests_fee` of 15.0 per night for suites and 0.0 for other rooms, using `np.where`.
2. With `assign` and `pd.col`, return a frame with `total` (nights times rate) and `deposit`
   (20 % of `total`), without changing `bookings`.
3. Set the rate of every single room to 65.0.

### Answers

```python
bookings["guests_fee"] = np.where(bookings["room"] == "suite", 15.0 * bookings["nights"], 0.0)
quote = bookings.assign(total=pd.col("nights") * pd.col("rate"), deposit=pd.col("total") * 0.2)
bookings.loc[bookings["room"] == "single", "rate"] = 65.0
print(quote[["total", "deposit"]])
print(bookings[["room", "rate", "guests_fee"]])
```

```text
   total  deposit
0  190.0     38.0
1  420.0     84.0
2  540.0    108.0
3  950.0    190.0
4   60.0     12.0
     room   rate  guests_fee
0  double   95.0         0.0
1  single   65.0         0.0
2   suite  180.0        45.0
3  double   95.0         0.0
4  single   65.0         0.0
```

`np.where` accepts a Series as a choice, so each suite gets 15.0 times its own nights. `deposit`
uses `total` from the same `assign`. The rate change is one `loc` call, so it reaches `bookings`.

## Key takeaways

- `df["new"] = expression` adds or replaces a column of `df`; arithmetic aligns on the index.
- `assign` returns a new frame; `pd.col("name")` (pandas 3) or a lambda refers to its columns,
  and later arguments may use earlier ones.
- `rename(columns=...)` and `drop(columns=...)` return new frames.
- `map` translates every value (unknown ones become NaN); `replace` changes only the listed ones.
- `where` keeps where true, `mask` replaces where true, `np.where` picks between two choices.
- Change chosen cells with one `df.loc[mask, "col"] = value`, never with two brackets in a row.

## Further reading

- [pandas.DataFrame.assign](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.assign.html)
- [pandas.col](https://pandas.pydata.org/docs/reference/api/pandas.col.html)
- [pandas.Series.map](https://pandas.pydata.org/docs/reference/api/pandas.Series.map.html)
- [pandas.DataFrame.where](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.where.html)
