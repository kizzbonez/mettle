---
title: What pandas Is, Series and DataFrame
summary: Meet pandas, the library for labelled tables built on NumPy. Build a Series (values with an index) and a DataFrame (columns of Series sharing one index) from lists and dicts, and read their index, columns, dtypes and shape.
minutes: 30
objectives:
  - Explain what pandas adds to NumPy and when to reach for it
  - Create a Series from a list or a dict and read its values, index, name and dtype
  - Create a DataFrame from a dict of lists or a list of dicts and read its shape, columns, index and dtypes
  - Predict how arithmetic between two Series aligns on their labels
  - Name what pandas 3 changed for text columns and for copies
---

## Outline

1. Why pandas
2. A Series: values plus an index
3. Arithmetic aligns on labels
4. A DataFrame: Series that share an index
5. A DataFrame from a list of records
6. pandas 3 in one paragraph

## Why pandas

NumPy Foundations ended at the edge of what arrays do well. An array holds one dtype, its rows and
columns are numbered from 0, and `np.loadtxt` struggles with a file whose columns mix text, numbers
and dates. Real data is a table: an order log, a sensor export, a spreadsheet. Each column has its
own type and a name, and the rows often have names too (a date, a station code).

**pandas** is the library for such tables. It stores each column as an array (usually a NumPy
array, so the vectorised arithmetic you learnt still applies) and adds **labels** to rows and
columns, file readers and writers, missing-value handling, and grouping. Install it with pip, and
add pyarrow, which pandas uses for text columns and Parquet files when it is present:

```console
$ python -m pip install pandas pyarrow
```

By convention it is imported as `pd`, next to `np`. This course uses pandas 3.0 with NumPy 2.5.

## A Series: values plus an index

A **Series** is a one-dimensional array of values with a label for each one. The labels together
are the **index**.

```python
import pandas as pd

cups = pd.Series([42, 37, 51, 48], index=["Mon", "Tue", "Wed", "Thu"], name="cups")
print(cups)
print(cups["Wed"], cups.iloc[0])
print(cups.dtype, cups.shape, cups.index)
```

```text
Mon    42
Tue    37
Wed    51
Thu    48
Name: cups, dtype: int64
51 42
int64 (4,) Index(['Mon', 'Tue', 'Wed', 'Thu'], dtype='str')
```

- The printout shows the index on the left and the values on the right, then the Series' **name**
  and **dtype**. The dtype is a NumPy one, `int64`, because the values are a NumPy array inside.
- `cups["Wed"]` looks a value up by its **label**, like a dict key. `cups.iloc[0]` takes it by
  **position**, like a list index. Lesson 4 covers both in depth.
- `shape` is `(4,)`, exactly as for a 1-D array. The index itself is an `Index` object whose labels
  are text, so its dtype is `str`.

Without `index=`, pandas numbers the rows 0, 1, 2 and so on with a **RangeIndex**. From a dict, the
keys become the index in the dict's order.

## Arithmetic aligns on labels

Arithmetic on a Series is vectorised, as on an array. Between two Series, pandas matches values by
**label**, not by position:

```python
import pandas as pd

monday = pd.Series({"flat white": 18, "latte": 25, "espresso": 9})
tuesday = pd.Series({"latte": 21, "espresso": 12, "mocha": 4})
print(monday * 3.2)
print(monday + tuesday)
print(monday.to_numpy())
```

```text
flat white    57.6
latte         80.0
espresso      28.8
dtype: float64
espresso      21.0
flat white     NaN
latte         46.0
mocha          NaN
dtype: float64
[18 25  9]
```

`monday + tuesday` added the lattes to the lattes and the espressos to the espressos, although they
sit at different positions. The result has the **union** of both indexes, sorted. A label found in
only one Series has nothing to add to, so its result is **NaN**, the marker pandas uses for a
missing number. NaN is a float, which is why the integers became `float64`. This alignment is the
biggest difference from NumPy, where `+` pairs elements by position. `to_numpy()` gives back the
plain NumPy array of values, without the labels.

## A DataFrame: Series that share an index

A **DataFrame** is a table: an ordered collection of columns, each a Series, all sharing one row
index. The most common way to build one is a dict whose keys are column names and whose values are
lists of the same length:

```python
import pandas as pd

menu = pd.DataFrame(
    {
        "drink": ["flat white", "latte", "espresso", "mocha"],
        "price": [3.20, 3.40, 2.10, 3.80],
        "sold": [18, 25, 9, 4],
        "vegan": [False, True, False, False],
    }
)
print(menu)
print(menu.shape)
print(menu.columns)
print(menu.index)
```

```text
        drink  price  sold  vegan
0  flat white    3.2    18  False
1       latte    3.4    25   True
2    espresso    2.1     9  False
3       mocha    3.8     4  False
(4, 4)
Index(['drink', 'price', 'sold', 'vegan'], dtype='str')
RangeIndex(start=0, stop=4, step=1)
```

`menu.dtypes` lists the type of each column:

```python
print(menu.dtypes)
```

```text
drink        str
price    float64
sold       int64
vegan       bool
dtype: object
```

- `shape` is `(rows, columns)`. `columns` holds the column labels and `index` the row labels, here
  a RangeIndex from 0 to 3.
- Each column has its **own dtype**: text, floats, integers and booleans side by side, which one
  NumPy array cannot do. `dtypes` is itself a Series indexed by column name. Its own dtype is
  `object` because it holds dtype objects, not numbers.
- Selecting one column with `menu["price"]` gives a Series with the same index. So column
  arithmetic is Series arithmetic: `menu["price"] * menu["sold"]` is the takings per drink, and
  `.sum()` adds them up.

## A DataFrame from a list of records

Data that arrives as records, such as rows from an API, is a list of dicts. Each dict becomes a
row, and the keys become the columns:

```python
import pandas as pd

orders = [
    {"table": 4, "drink": "latte", "size": "large"},
    {"table": 7, "drink": "espresso"},
    {"table": 2, "drink": "mocha", "size": "small"},
]
frame = pd.DataFrame(orders)
print(frame)
print(frame["drink"])
print(type(frame["drink"]).__name__, frame["size"].dtype)
```

```text
   table     drink   size
0      4     latte  large
1      7  espresso    NaN
2      2     mocha  small
0       latte
1    espresso
2       mocha
Name: drink, dtype: str
Series str
```

The espresso order had no size, so that cell is **NaN**. A missing key is not an error with a
list of dicts. The column's dtype is still `str`: text columns keep NaN as their missing marker.

## pandas 3 in one paragraph

pandas 3.0 changed defaults that much code online predates. Text columns get the
dedicated **`str` dtype** instead of the generic `object` dtype, and in this course's setup it is
stored with pyarrow. **Copy-on-Write** is always on: anything you select from a DataFrame behaves
as a copy, so the old trick of assigning through two brackets, `df["col"][0] = 1`, never changes
`df` (lesson 9 is about this). A few names changed too, and the course uses the new ones. When an
answer online shows `dtype: object` for text, it was written for pandas 2 or earlier.

## Common mistakes

- **Lists of different lengths.** `pd.DataFrame({"drink": ["latte", "mocha"], "price": [3.4]})`
  raises `ValueError: All arrays must be of the same length`. Every column needs one value per
  row; use `None` for a value you do not have.
- **Expecting position pairing.** `monday + tuesday` aligns on labels and leaves NaN where a label
  is missing on one side. If you really want position pairing, compare `.to_numpy()` arrays, but
  usually the labels are telling you something.
- **Using `[0]` for the first value.** On a Series with text labels, `cups[0]` raises
  `KeyError: 0` in pandas 3, because `[]` looks up labels. Use `cups.iloc[0]`.
- **Reading `dtype: object` advice.** In pandas 3 a text column's dtype is `str`, so a check like
  `frame["drink"].dtype == object` is `False`.

## Practice

1. Build a Series of rainfall in millimetres for `"Mon"` to `"Wed"`: 2.5, 0.0 and 11.2. Print its
   dtype and the value for Tuesday.
2. Build a DataFrame of three buses with columns `route` (`"12"`, `"7A"`, `"31"`), `stops`
   (14, 22, 9) and `electric` (True, False, True). Print its shape and dtypes.
3. `a = pd.Series({"x": 1, "y": 2})` and `b = pd.Series({"y": 10, "z": 20})`. What does `a + b`
   print, and why?

### Answers

```python
import pandas as pd

rain = pd.Series([2.5, 0.0, 11.2], index=["Mon", "Tue", "Wed"])
print(rain.dtype, rain["Tue"])

buses = pd.DataFrame(
    {"route": ["12", "7A", "31"], "stops": [14, 22, 9], "electric": [True, False, True]}
)
print(buses.shape)
print(buses.dtypes)
```

```text
float64 0.0
(3, 3)
route         str
stops       int64
electric     bool
dtype: object
```

The routes are text (`"7A"` could never be a number), so `route` is `str`. For exercise 3,
`a + b` is `x NaN, y 12.0, z NaN` with dtype `float64`: only `y` is in both indexes, and NaN
forces the result to float.

## Key takeaways

- pandas adds labelled rows and columns, mixed column types and file tools on top of NumPy arrays.
- A Series is values plus an index; a DataFrame is columns of Series sharing one index.
- Arithmetic between Series aligns on labels and gives NaN where a label is on one side only.
- `shape`, `index`, `columns` and `dtypes` describe a DataFrame; each column has its own dtype.
- In pandas 3, text columns are `str`, and selections behave as copies.

## Further reading

- [pandas user guide: Intro to data structures](https://pandas.pydata.org/docs/user_guide/dsintro.html)
- [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html)
- [What's new in 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
- [pandas installation](https://pandas.pydata.org/docs/getting_started/install.html)
