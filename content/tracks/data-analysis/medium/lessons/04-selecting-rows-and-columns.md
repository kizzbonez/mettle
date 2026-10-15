---
title: Selecting Rows and Columns
summary: Pick columns with `[]`, rows and cells by label with `loc` and by position with `iloc`, single values with `at` and `iat`, and move a column into the index and back with `set_index` and `reset_index`.
minutes: 35
objectives:
  - Select one column as a Series and several as a DataFrame
  - Select rows, columns and cells by label with `loc`, including inclusive label slices
  - Select by position with `iloc`, with Python's exclusive slices and negative positions
  - Read single values with `at` and `iat`, and explain the KeyError and IndexError they can raise
  - Make a column the index with `set_index` and undo it with `reset_index`
---

## Outline

1. Columns with `[]`
2. A meaningful index with `set_index`
3. Labels with `loc`
4. Positions with `iloc`
5. Single values with `at` and `iat`
6. Back to a column with `reset_index`

## Columns with `[]`

A weather service publishes last month's rain for five stations. All the examples start from this
frame:

```python
import pandas as pd

stations = pd.DataFrame(
    {
        "code": ["ABN", "BRT", "CDF", "DUN", "EXE"],
        "town": ["Aberdeen", "Bristol", "Cardiff", "Dundee", "Exeter"],
        "altitude_m": [65, 11, 52, 45, 30],
        "rain_mm": [61.2, 48.0, 102.5, 55.1, 70.3],
    }
)
town = stations["town"]
pair = stations[["town", "rain_mm"]]
print(type(town).__name__, town.shape, type(pair).__name__, pair.shape)
print(pair.head(2))
```

```text
Series (5,) DataFrame (5, 2)
       town  rain_mm
0  Aberdeen     61.2
1   Bristol     48.0
```

One name in the brackets gives that column as a **Series**. A **list** of names gives a
**DataFrame** with those columns in the order listed: the outer brackets are the selection, the
inner ones are the Python list. `stations[["town"]]` is a DataFrame with one column, not a
Series.

Square brackets on a DataFrame look up **columns**. That one rule explains most surprises below.

## A meaningful index with `set_index`

The default index numbers the rows 0 to 4, which says nothing about them. Each station has a unique
code, which makes a better row label. `set_index` moves a column into the index:

```python
stations = stations.set_index("code")
```

`set_index` returns a **new** DataFrame and leaves the original alone, which is why the result is
assigned back to `stations`. Almost every pandas method works this way.

## Labels with `loc`

`loc` selects by **label**. Inside its brackets, the first part chooses rows and the optional
second part, after a comma, chooses columns:

```python
print(stations.loc["CDF"])
print(stations.loc["CDF", "rain_mm"])
print(stations.loc[["ABN", "EXE"], ["town", "rain_mm"]])
print(stations.loc["BRT":"DUN", "town"])
```

```text
town          Cardiff
altitude_m         52
rain_mm         102.5
Name: CDF, dtype: object
102.5
          town  rain_mm
code                   
ABN   Aberdeen     61.2
EXE     Exeter     70.3
code
BRT    Bristol
CDF    Cardiff
DUN     Dundee
Name: town, dtype: str
```

- One row label gives that row as a Series whose index is the column names. A row mixes text and
  numbers, so this Series has the general `object` dtype.
- A row label and a column label give one value.
- Lists of labels give a DataFrame, in the order you listed them.
- A **label slice** `"BRT":"DUN"` **includes both ends**, unlike every Python slice you know. With
  labels there is no "one past the end" to point at, so pandas includes the stop.
- A colon alone means "all": `stations.loc[:, "rain_mm"]` is the whole column.

`loc` also accepts a boolean Series for the rows, which lesson 5 uses to filter.

## Positions with `iloc`

`iloc` selects by **integer position**, counting from 0, whatever the labels are. It follows the
rules of Python lists and NumPy arrays, so slices exclude the stop and negative numbers count from
the end:

```python
print(stations.iloc[0, 0], stations.iloc[-1, 2])
print(stations.iloc[1:3])
print(stations.iloc[[0, -1], [0, 2]])
```

```text
Aberdeen 70.3
         town  altitude_m  rain_mm
code                              
BRT   Bristol          11     48.0
CDF   Cardiff          52    102.5
          town  rain_mm
code                   
ABN   Aberdeen     61.2
EXE     Exeter     70.3
```

Positions count the columns of the frame as it is now: after `set_index`, position 0 is `town`,
because `code` is the index, not a column. `iloc[1:3]` gives positions 1 and 2, two rows. Compare
`loc["BRT":"DUN"]`, three rows.

Use `loc` when you know the names, which is most of the time: the code says what it means and
keeps working when rows are reordered. Use `iloc` for "the first", "the last five" or "every
other row".

## Single values with `at` and `iat`

For one cell, `at[row, column]` takes labels and `iat[i, j]` takes positions. They do the same as
`loc` and `iloc` for one value, a little faster, and say clearly that one value is expected:

```python
print(stations.at["DUN", "altitude_m"], stations.iat[3, 1])
try:
    stations.loc["GLA"]
except KeyError as error:
    print("KeyError:", error)
try:
    stations.iloc[7]
except IndexError as error:
    print("IndexError:", error)
print(stations.iloc[3:10].index.tolist())
```

```text
45 45
KeyError: 'GLA'
IndexError: single positional indexer is out-of-bounds
['DUN', 'EXE']
```

A missing label raises `KeyError`, and a position past the end raises `IndexError`. A **slice**
past the end is not an error: `iloc[3:10]` stops at the last row, like a list slice.

## Back to a column with `reset_index`

`reset_index` does the opposite of `set_index`: the index becomes a column again and the rows get a
fresh RangeIndex. With `drop=True` the old index is thrown away instead:

```python
back = stations.reset_index()
print(back.columns.tolist(), back.index)
picked = stations.loc[["CDF", "EXE"]]
print(picked.reset_index(drop=True))
```

```text
['code', 'town', 'altitude_m', 'rain_mm'] RangeIndex(start=0, stop=5, step=1)
      town  altitude_m  rain_mm
0  Cardiff          52    102.5
1   Exeter          30     70.3
```

Use `reset_index()` when you need the labels as data again, for example to write them to a file.
Use `reset_index(drop=True)` after filtering or sorting, when you want the rows numbered 0, 1, 2
and the old labels mean nothing.

## Common mistakes

- **Rows with `[]`.** `stations["CDF"]` raises `KeyError: 'CDF'`, because `[]` looks for a column
  named `CDF`. Use `stations.loc["CDF"]`.
- **Positions with `[]` on a Series.** `stations["rain_mm"][0]` raises `KeyError: 0` in pandas 3:
  the index holds codes, and `[]` on a Series means a label. Older pandas fell back to positions
  here; pandas 3 does not. Use `.iloc[0]`.
- **Expecting `loc` slices to stop early.** `loc["BRT":"DUN"]` includes `DUN`. Only `iloc` slices
  exclude the stop.
- **Forgetting to assign.** `stations.set_index("code")` on its own line changes nothing; the new
  frame is thrown away. Write `stations = stations.set_index("code")`.
- **One pair of brackets for several columns.** `stations["town", "rain_mm"]` looks for a single
  column named by the tuple `("town", "rain_mm")` and raises `KeyError`. Use a list:
  `stations[["town", "rain_mm"]]`.

## Practice

Use `stations` with `code` as its index.

1. Print the town of station `BRT`.
2. Print `altitude_m` and `rain_mm` for stations `CDF` to `EXE`.
3. Print the rain of the last two stations, by position.
4. `stations[1:3]` is legal and returns rows. Which rows, and why is `iloc[1:3]` the clearer way
   to write it?

### Answers

```python
print(stations.loc["BRT", "town"])
print(stations.loc["CDF":"EXE", ["altitude_m", "rain_mm"]])
print(stations.iloc[-2:, -1])
```

```text
Bristol
      altitude_m  rain_mm
code                     
CDF           52    102.5
DUN           45     55.1
EXE           30     70.3
code
DUN    55.1
EXE    70.3
Name: rain_mm, dtype: float64
```

The label slice includes `EXE`. `iloc[-2:, -1]` takes the last two rows of the last column. For
exercise 4: a slice inside `[]` is a special case that selects rows by position, here `BRT` and
`CDF`, while a single value or a list inside `[]` selects columns. `iloc[1:3]` says "positions"
without relying on that exception.

## Key takeaways

- `df["col"]` is a Series, `df[["a", "b"]]` a DataFrame; `[]` on a DataFrame means columns.
- `loc[rows, columns]` uses labels, and its slices include both ends.
- `iloc[rows, columns]` uses positions, with Python's exclusive slices and negative indexes.
- `at` and `iat` read or set one value; a missing label is a `KeyError`.
- `set_index` and `reset_index` move a column into the index and back; both return a new frame.

## Further reading

- [pandas user guide: Indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html)
- [pandas.DataFrame.loc](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.loc.html)
- [pandas.DataFrame.iloc](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.iloc.html)
- [pandas.DataFrame.set_index](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.set_index.html)
