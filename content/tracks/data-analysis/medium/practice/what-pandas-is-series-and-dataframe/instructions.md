Write the five functions of `solution.py` with pandas. None of them changes what it is given.

1. `price_list(prices)`: `prices` is a dict from a honey's name to its price per jar. Return a
   **Series** of the prices, indexed by the names in the dict's order, and named `"price"`.
2. `price_changes(old, new)`: `old` and `new` are two Series like the ones `price_list` returns,
   possibly with different honeys in a different order. Return `new` minus `old`, **matched by
   name** the way arithmetic between two Series matches values: the result holds every name found
   in either Series (in the order that arithmetic gives), with NaN for a honey that is in only one
   of them.
3. `market_day(sales)`: `sales` is a list of dicts, one per honey sold that day, with the keys
   `honey`, `price` and `sold`, and on some records a key `note`. Return a **DataFrame** with one
   row per record in list order, a RangeIndex from 0, and one column per key, in the order in
   which the keys first appear. A record without a note has NaN in `note`.
4. `takings(day)`: `day` is a frame like the one `market_day` returns. Return the day's takings:
   the sum over all rows of `price` times `sold`, as a number. A day with no rows took `0`.
5. `text_columns(frame)`: return a list of the names of the columns of `frame` whose dtype is
   `str`, in column order.

Example:

```python
spring = price_list({"clover": 6.5, "heather": 8.0, "wildflower": 7.0})
autumn = price_list({"heather": 8.5, "clover": 6.5, "borage": 9.0})
print(spring)
print(price_changes(spring, autumn))
day = market_day([
    {"honey": "clover", "price": 6.5, "sold": 12},
    {"honey": "heather", "price": 8.0, "sold": 5, "note": "last jars"},
    {"honey": "wildflower", "price": 7.0, "sold": 9},
])
print(day)
takings(day)         # 181.0
text_columns(day)    # ['honey', 'note']
```

```text
clover        6.5
heather       8.0
wildflower    7.0
Name: price, dtype: float64
borage        NaN
clover        0.0
heather       0.5
wildflower    NaN
Name: price, dtype: float64
        honey  price  sold       note
0      clover    6.5    12        NaN
1     heather    8.0     5  last jars
2  wildflower    7.0     9        NaN
```

**Tips.** `pd.Series` and `pd.DataFrame` take a dict and a list of dicts as they are. Selecting
one column of a frame gives a Series, so column arithmetic is Series arithmetic, and a Series has
`.sum()`. A dtype compares equal to its name written as a string, such as `"int64"`.
