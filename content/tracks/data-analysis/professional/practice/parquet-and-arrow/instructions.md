Write the three functions of `solution.py`. A frame of crossings has the columns `route` (`str`),
`departure` (`datetime64[us]`), `passengers` (`int64`), `cars` (`Int64`, missing for a boat that
takes no cars) and `cancelled` (`bool`), and may have any index, gaps included. Paths and folders
are given as `str`. No function may change the frame it is given.

1. `save_week(crossings, path)` writes `crossings` to the Parquet file `path`, compressed with
   `zstd` and **without the index**, replacing the file if it exists. Read back with
   `pd.read_parquet`, the file gives the same columns with the same dtypes and the index 0 to n-1.
2. `save_by_route(crossings, folder)` writes `crossings` as a Parquet dataset **partitioned by
   route**, without the index: `folder` then holds one subfolder `route=NAME` for each route and
   nothing else. If `folder` already exists, delete it first (`shutil.rmtree`), so that it holds
   only these crossings.
3. `busy_crossings(folder, route, min_passengers)` reads a dataset written like that and returns
   the crossings of `route` with at least `min_passengers` passengers: only the columns
   `departure`, `passengers` and `cars`, with their dtypes, sorted by departure, with the index 0
   to n-1. Let `pd.read_parquet` do the choosing: pass it `columns` and `filters` (the tests watch
   the call) instead of reading everything and selecting afterwards. When no crossing matches,
   the result has no rows and the same three columns.

Example:

```python
crossings = pd.DataFrame({
    "route": ["North", "Island", "North", "Bay", "Island", "North"],
    "departure": pd.to_datetime(["2026-07-06 11:00", "2026-07-06 07:30", "2026-07-06 07:00",
                                 "2026-07-06 08:15", "2026-07-06 10:30", "2026-07-06 09:00"]),
    "passengers": [288, 48, 212, 96, 61, 305],
    "cars": pd.array([38, None, 40, 12, None, 55], dtype="Int64"),
    "cancelled": [False, False, False, True, False, False],
})
save_week(crossings, "week-27.parquet")
print(pd.read_parquet("week-27.parquet").dtypes)
save_by_route(crossings, "ferries")
print(sorted(os.listdir("ferries")))
print(busy_crossings("ferries", "North", 250))
```

```text
route                    str
departure     datetime64[us]
passengers             int64
cars                   Int64
cancelled               bool
dtype: object
['route=Bay', 'route=Island', 'route=North']
            departure  passengers  cars
0 2026-07-06 09:00:00         305    55
1 2026-07-06 11:00:00         288    38
```

The nullable `cars` column comes back as `Int64` with its gaps, which a CSV file could not do.

**Tips.** `to_parquet` takes `compression=`, `index=` and `partition_cols=`. Filters are a list of
`(column, operator, value)` tuples, all of which must hold; a filter may name the partition
column even when `columns` leaves it out. `pyarrow.parquet.read_schema(path).names` lists the
columns stored in a file.
