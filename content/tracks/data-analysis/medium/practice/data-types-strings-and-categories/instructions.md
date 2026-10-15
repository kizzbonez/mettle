Write the four functions of `solution.py`. `orders` is a DataFrame read with
`pd.read_csv(path, dtype="str")`, so **every column is text** (`str`, NaN for an empty field):
`order_id`, `dish`, `spice`, `price`, `qty` and `paid`. `spice` is always one of `mild`, `medium`,
`hot` and `fiery` (in that order of heat); `paid` is always `Y` or `N`. The sample is
`data/orders.csv`. No function changes the frame it is given.

1. `clean_types(orders)` returns a new frame with the same columns, in the same order:

   | column | dtype | rule |
   | --- | --- | --- |
   | `order_id`, `dish` | `str` | unchanged |
   | `spice` | `category` | **ordered**, with exactly the four categories `mild` < `medium` < `hot` < `fiery` (the starter defines `SPICE`) |
   | `price` | `float64` | the number, NaN for anything that is not a number |
   | `qty` | `Int64` | the number of portions, `<NA>` for anything that is not a number |
   | `paid` | `bool` | `True` for `Y`, `False` for `N` |

2. `unreadable(orders, column)` returns a list of the values of the text column `column` that are
   **not** missing but cannot be read as a number, in row order (repeats included). These are the
   values `clean_types` silently turns into gaps.
3. `at_least(clean, level)` takes a frame from `clean_types` and a spice level, and returns the
   orders whose spice is `level` or hotter, sorted from mildest to hottest. Orders of the same
   spice keep their order. Index labels are kept.
4. `price_in_pence(clean)` returns a Series of each order's `price` in whole pence (`Int64`),
   **rounded** to the nearest penny, with `<NA>` where the price is missing. Its name is `price`
   and it keeps the index.

Example:

```python
orders = pd.read_csv("data/orders.csv", dtype="str")
clean = clean_types(orders)
print(clean)
unreadable(orders, "qty")                           # ['two']
unreadable(orders, "price")                         # ['free']
at_least(clean, "hot")["order_id"].tolist()         # ['D103', 'D104', 'D102', 'D106']
price_in_pence(clean).tolist()
# [1150, 1295, 1225, 1095, 115, <NA>, 850, 1175]
```

```text
  order_id      dish   spice  price   qty   paid
0     D101     korma    mild  11.50     2   True
1     D102  vindaloo   fiery  12.95     1   True
2     D103  jalfrezi     hot  12.25  <NA>  False
3     D104    madras     hot  10.95     1   True
4     D105     raita    mild   1.15     3  False
5     D106     phaal   fiery    NaN     1   True
6     D107       dal    mild   8.50  <NA>   True
7     D108     bhuna  medium  11.75     1  False
```

The raita costs 1.15, and `1.15 * 100` is `114.99999999999999` in floating point: converting
that to an integer without rounding first would charge 114 pence.

**Tips.** `pd.to_numeric(..., errors="coerce")` reads what it can. Compare which values are missing
before and after it to find the unreadable ones. `astype` takes a `pd.CategoricalDtype`, and an
ordered categorical compares and sorts by its categories. `astype("Int64")` refuses a value with a
fraction.
