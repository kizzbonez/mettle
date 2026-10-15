---
title: Filtering and Sorting
summary: Keep the rows that match a condition with boolean masks, combine conditions with `&`, `|` and `~`, use `isin`, `between` and `query`, and order rows with `sort_values`, `sort_index`, `nlargest` and `nsmallest`.
minutes: 35
objectives:
  - Filter rows with a boolean mask built from a column comparison
  - Combine conditions with `&`, `|` and `~`, with the parentheses they need
  - Use `isin`, `between` and `query` for common conditions
  - Sort by one or several columns in mixed directions, place missing values, and keep ties stable
  - Pick the top or bottom rows with `nlargest` and `nsmallest`
---

## Outline

1. A comparison gives a mask
2. Combining conditions
3. `isin`, `between` and `query`
4. Sorting by values
5. Missing values, ties and the index
6. Top and bottom rows

## A comparison gives a mask

You are looking for a flat to rent. The agency's list:

```python
import pandas as pd

flats = pd.DataFrame(
    {
        "district": ["Old Town", "Riverside", "Old Town", "Hillside",
                     "Riverside", "Docks", "Hillside", "Docks"],
        "rooms": [2, 3, 1, 4, 2, 2, 3, 1],
        "rent": [1150, 1420, 790, 1650, 1020, 980, 1420, 720],
        "area_m2": [54, 78, 31, 102, 49, 58, 81, None],
        "balcony": [True, True, False, True, False, True, False, False],
    }
)
cheap = flats["rent"] < 1000
print(cheap.tolist())
print(flats[cheap])
print(cheap.sum())
```

```text
[False, False, True, False, False, True, False, True]
   district  rooms  rent  area_m2  balcony
2  Old Town      1   790     31.0    False
5     Docks      2   980     58.0     True
7     Docks      1   720      NaN    False
3
```

Comparing a column with a value gives a **boolean Series**, a **mask**, with the same index as the
frame. Putting a mask inside `[]` keeps the rows where it is `True`. This is the one case where
`[]` on a DataFrame selects rows instead of columns. The rows keep their original labels (2, 5,
7), which is how you can tell where they came from. As with NumPy masks, `sum()` counts the `True`
values: three flats under 1000.

`flats.loc[mask, columns]` does the same and also picks columns. Prefer it when you need both,
and always when you assign, as lesson 6 shows.

## Combining conditions

Combine masks with `&` (and), `|` (or) and `~` (not), exactly as with NumPy arrays. Each comparison
needs its own parentheses, because `&` and `|` bind more tightly than `<` and `>=`:

```python
family = flats[(flats["rooms"] >= 2) & (flats["rent"] <= 1200)]
print(family)
print(flats.loc[~flats["balcony"] | (flats["rooms"] == 1), ["district", "rent"]])
```

```text
    district  rooms  rent  area_m2  balcony
0   Old Town      2  1150     54.0     True
4  Riverside      2  1020     49.0    False
5      Docks      2   980     58.0     True
    district  rent
2   Old Town   790
4  Riverside  1020
6   Hillside  1420
7      Docks   720
```

`flats["balcony"]` is already boolean, so it is a mask by itself and `~` flips it. Python's `and`,
`or` and `not` do not work on a Series; the Common mistakes section shows the error.

## `isin`, `between` and `query`

Three helpers make common conditions shorter:

```python
print(flats[flats["district"].isin(["Docks", "Riverside"])])
print(flats.loc[flats["rent"].between(1000, 1420), "rent"].tolist())
budget = 1200
print(flats.query("rooms >= 2 and rent <= @budget and balcony"))
```

```text
    district  rooms  rent  area_m2  balcony
1  Riverside      3  1420     78.0     True
4  Riverside      2  1020     49.0    False
5      Docks      2   980     58.0     True
7      Docks      1   720      NaN    False
[1150, 1420, 1020, 1420]
   district  rooms  rent  area_m2  balcony
0  Old Town      2  1150     54.0     True
5     Docks      2   980     58.0     True
```

- `isin(list)` is `True` where the value is one of the listed ones: one call instead of a chain of
  `==` joined by `|`.
- `between(low, high)` includes **both** ends by default, so both flats at 1420 are kept. Pass
  `inclusive="left"`, `"right"` or `"neither"` to change that.
- `query` takes the condition as a string and names columns directly. Inside the string, `and`,
  `or` and `not` are allowed, and `@budget` refers to the Python variable `budget`. A column name
  with a space goes in backticks: `` `floor area` > 50 ``. Never build the string from text a user
  typed: `query` evaluates expressions.

## Sorting by values

`sort_values` returns a new frame ordered by one or more columns. `ascending=False` reverses the
order. With a list of columns, the second breaks ties in the first, and `ascending` can be a list
with one direction per column:

```python
print(flats.sort_values("rent", ascending=False).head(4))
print(flats.sort_values(["district", "rent"], ascending=[True, False]))
```

```text
    district  rooms  rent  area_m2  balcony
3   Hillside      4  1650    102.0     True
1  Riverside      3  1420     78.0     True
6   Hillside      3  1420     81.0    False
0   Old Town      2  1150     54.0     True
    district  rooms  rent  area_m2  balcony
5      Docks      2   980     58.0     True
7      Docks      1   720      NaN    False
3   Hillside      4  1650    102.0     True
6   Hillside      3  1420     81.0    False
0   Old Town      2  1150     54.0     True
2   Old Town      1   790     31.0    False
1  Riverside      3  1420     78.0     True
4  Riverside      2  1020     49.0    False
```

The second sort puts districts in alphabetical order and, within each district, the dearest flat
first. Text sorts by character code, so `"docks"` in lower case would come after every capitalised
name.

## Missing values, ties and the index

```python
print(flats.sort_values("area_m2", na_position="first").head(3))
by_rent = flats.sort_values("rent", kind="stable")
print(by_rent.index.tolist())
print(by_rent.sort_index().index.tolist())
```

```text
    district  rooms  rent  area_m2  balcony
7      Docks      1   720      NaN    False
2   Old Town      1   790     31.0    False
4  Riverside      2  1020     49.0    False
[7, 2, 5, 4, 0, 1, 6, 3]
[0, 1, 2, 3, 4, 5, 6, 7]
```

- Missing values go **last** whatever the direction; `na_position="first"` moves them to the top.
- Two flats cost 1420 (rows 1 and 6). A **stable** sort keeps tied rows in their original order, so
  1 stays before 6. The default algorithm for one column is quicksort, which does not promise that:
  sorting 200,000 rows with many ties by one column scrambles the tied rows. Pass `kind="stable"`
  when the order of ties matters, for example in a report that must come out the same every time.
  When sorting by several columns, `kind` is ignored and ties keep their order.
- `sort_index()` sorts by the row labels, here undoing the sort.

## Top and bottom rows

`nlargest(n, column)` returns the `n` rows with the largest values, sorted, and `nsmallest` the
smallest. It is shorter, and on large frames faster, than sorting everything and taking `head`:

```python
print(flats.nlargest(3, "area_m2"))
```

```text
    district  rooms  rent  area_m2  balcony
3   Hillside      4  1650    102.0     True
6   Hillside      3  1420     81.0    False
1  Riverside      3  1420     78.0     True
```

With ties at the cut-off, `keep="all"` returns every tied row, even if that is more than `n`.

## Common mistakes

- **`and` instead of `&`.** `flats[flats["rooms"] >= 2 and flats["rent"] <= 1200]` raises
  `ValueError: The truth value of a Series is ambiguous. Use a.empty, a.bool(), a.item(), a.any() or a.all().`
  Python's `and` asks for one `True` or `False`, and a Series of eight booleans is neither.
- **Missing parentheses.** `flats["rooms"] >= 2 & flats["rent"] <= 1200` is read as
  `flats["rooms"] >= (2 & flats["rent"]) <= 1200`, a chained comparison, and fails with the same
  ValueError. Wrap every comparison.
- **`== None` for missing values.** `flats[flats["area_m2"] == None]` has 0 rows, because NaN
  equals nothing. Use `flats[flats["area_m2"].isna()]` (lesson 7).
- **Forgetting that sorting returns a new frame.** `flats.sort_values("rent")` alone changes
  nothing. Assign the result.

## Practice

1. Print the mean rent of the Old Town flats.
2. Print district, rent and area of the flats with at least 50 m² and a balcony, cheapest first.
3. Sort by rooms (most first) and then by rent (cheapest first), and print the first four rows of
   `rooms` and `rent`.

### Answers

```python
print(flats.loc[flats["district"] == "Old Town", "rent"].mean())
big = flats[(flats["area_m2"] >= 50) & flats["balcony"]]
print(big.sort_values("rent")[["district", "rent", "area_m2"]])
ordered = flats.sort_values(["rooms", "rent"], ascending=[False, True])
print(ordered[["rooms", "rent"]].head(4))
```

```text
970.0
    district  rent  area_m2
5      Docks   980     58.0
0   Old Town  1150     54.0
1  Riverside  1420     78.0
3   Hillside  1650    102.0
   rooms  rent
3      4  1650
1      3  1420
6      3  1420
5      2   980
```

The Docks flat with no area is left out of exercise 2: `NaN >= 50` is `False`.

## Key takeaways

- A comparison on a column gives a boolean mask; `df[mask]` or `df.loc[mask, cols]` keeps the
  `True` rows with their labels.
- Combine masks with `&`, `|`, `~`, and put every comparison in parentheses; never `and`/`or`.
- `isin`, `between` (inclusive) and `query` (with `@variable`) shorten common filters.
- `sort_values` takes several columns and a list of directions; NaN goes last; use
  `kind="stable"` when ties must keep their order.
- `nlargest` and `nsmallest` give the top or bottom rows directly.

## Further reading

- [pandas user guide: Boolean indexing](https://pandas.pydata.org/docs/user_guide/indexing.html#boolean-indexing)
- [pandas.DataFrame.sort_values](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.sort_values.html)
- [pandas.DataFrame.query](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.query.html)
- [pandas.Series.between](https://pandas.pydata.org/docs/reference/api/pandas.Series.between.html)
