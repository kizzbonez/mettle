Write the three functions of `solution.py`. A scan file is a CSV with the columns `scan_id` (a
different text id for every scan), `store`, `till` (1 to 8), `price_pence`, `quantity` (negative
for a refund) and `scanned_at` (`YYYY-MM-DD HH:MM:SS`); `data/scans.csv` is a small one. Read
files with `pd.read_csv`: the tests watch how it is called.

1. `shrink(scans)` takes a frame as `pd.read_csv` reads a scan file (text as `str`, numbers as
   `int64`) and returns a new frame with the same columns in the same order and the same values,
   in smaller types:
   - `store`: `category`;
   - `till`, `price_pence` and `quantity`: the smallest signed integer type that holds the
     column's values, as `pd.to_numeric(..., downcast="integer")` picks it;
   - `scanned_at`: `datetime64[us]`;
   - `scan_id` stays `str`: every value is different, so a categorical would only grow.

   For the tests' 200,000 scans, about 16.5 MB as read, the result must take less than 6.3 MB by
   `memory_usage(deep=True).sum()`. The frame given is not changed.
2. `read_takings(path)` reads only the columns `store`, `price_pence` and `quantity`, choosing
   their types while reading (`usecols` and `dtype`): `store` as `category`, `price_pence` as
   `int32` and `quantity` as `int8`. It returns that frame.
3. `store_totals(path, chunksize)` reads the file in chunks of `chunksize` rows, only the three
   columns it needs, and reduces each chunk to per-store sums before reading the next. It never
   keeps the chunks or puts them back together, and never reads the whole file at once. It
   returns a DataFrame with one row per store, sorted by store name, the index named `store`, and
   the columns `items` (the sum of `quantity`, `int64`), `takings_pence` (the sum of
   `price_pence * quantity`, `int64`) and `mean_price_pence` (takings divided by items, rounded to
   2 decimals).

Example:

```python
scans = pd.read_csv("data/scans.csv")
print(shrink(scans).dtypes)
print(read_takings("data/scans.csv").dtypes)
print(store_totals("data/scans.csv", 5))
```

```text
scan_id                   str
store                category
till                     int8
price_pence             int16
quantity                 int8
scanned_at     datetime64[us]
dtype: object
store          category
price_pence       int32
quantity           int8
dtype: object
         items  takings_pence  mean_price_pence
store                                          
Ashford     19           9236            486.11
Bexley      32          27378            855.56
Carlton     15          24038           1602.53
```

With `chunksize=5` the 16 scans arrive as chunks of 5, 5, 5 and 1 rows. The mean comes from the
summed takings and items at the end: averaging each chunk's mean would weigh a chunk of 1 row like
a chunk of 5.

**Tips.** Use `pd.read_csv(path, usecols=..., chunksize=...)` in a `with` statement and iterate
over it. Small types can overflow in arithmetic: compute takings from `int64` columns.
