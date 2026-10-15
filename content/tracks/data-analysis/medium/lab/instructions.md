Write `solution.py` with pandas. The starter declares the five functions the tests call: keep
their names and parameters. You may add helper functions and constants. The files are in `data/`:
`sessions-feb.csv` and `sessions-mar.csv` (two months, same layout) and `sites.json`.

**The export.** The first line of a sessions file is a title, not data; the second is the header.
The columns are `session_id`, `site`, `connector`, `started` (`YYYY-MM-DD HH:MM`), `kwh`,
`minutes` and `status`. `site` is one of `MKT`, `STN`, `LEI`, `HSP`, sometimes written in lower
case (`mkt`, `stn`, `lei`, `hsp`). `kwh` is a decimal, or empty, or `-` when the meter did not
report. `minutes` is a whole number, or a word such as `unknown` or `?`. `status` is `ok`,
`aborted` or `fault`.

1. **`load_sessions(path)`** reads one export and returns a DataFrame with the seven columns in the
   file's order, one row per session in file order, and a RangeIndex from 0:

   | column | dtype | rule |
   | --- | --- | --- |
   | `session_id` | `str` | as in the file |
   | `site` | `str` | lower-case codes replaced by the upper-case code |
   | `connector` | `category` | the categories are the connector names in the file (what `astype("category")` gives) |
   | `started` | `datetime64[us]` | parsed date and time |
   | `kwh` | `float64` | NaN where the file has nothing or `-` |
   | `minutes` | `Int64` | `<NA>` where the file has anything that is not a number |
   | `status` | `str` | as in the file |

2. **`load_prices(path)`** reads `sites.json`, an array of records with `code`, `name`,
   `connectors` and `price_per_kwh`, and returns a **Series** of the prices: named
   `price_per_kwh`, indexed by the site codes (index name `code`), in file order.

3. **`add_cost(sessions, prices)`** takes a frame from `load_sessions` and a Series like the one
   `load_prices` returns, and returns a **new** DataFrame: every column of `sessions`, unchanged,
   plus a last column `cost` (`float64`):
   - `kwh` times the price of the session's site, rounded to 2 decimals;
   - `0.0` for every `fault` session, whatever its `kwh` (the council does not charge for a
     failed charger);
   - NaN for any other session whose `kwh` is missing. Aborted sessions are charged normally.

   `sessions` itself must not change: no new column and no changed value.
4. **`completed_in_period(sessions, start, end)`** takes any frame with the columns above (with or
   without `cost`) and two strings such as `"2026-03-01 09:30"`. It returns the sessions whose
   `status` is `ok` and whose `started` is from `start` to `end`, **both included**: same columns
   and dtypes, original row order, renumbered from 0. With no matching session, it returns an
   empty frame with the same columns. `sessions` must not change.
5. **`site_summary(sessions)`** takes a frame from `add_cost` (possibly filtered) and returns one
   row per site that has at least one session, with these columns in this order:

   | column | dtype | meaning |
   | --- | --- | --- |
   | `site` | `str` | the site code |
   | `sessions` | `int64` | number of sessions (rows) |
   | `energy_kwh` | `float64` | sum of `kwh`, missing values skipped, rounded to 1 decimal |
   | `revenue` | `float64` | sum of `cost`, missing values skipped, rounded to 2 decimals |
   | `avg_minutes` | `Float64` | mean of `minutes`, missing values skipped, rounded to 1 decimal (the mean of an `Int64` column is `Float64`) |
   | `faults` | `int64` | number of sessions with status `fault` |

   Sort by `revenue`, highest first; equal revenue by `energy_kwh`, highest first; then by `site`,
   A to Z. Number the rows from 0. A site with no sessions (such as `PKR`) does not appear, and an
   empty input gives an empty frame with the six columns.

Example, with the February export:

```python
feb = load_sessions("data/sessions-feb.csv")
feb.shape                          # (64, 7)
feb.loc[4, "site"]                 # 'STN'  (the file says stn)
feb.loc[18, "kwh"]                 # nan    (the file says -)
feb.loc[10, "minutes"]             # <NA>   (the file says unknown)
prices = load_prices("data/sites.json")
prices["LEI"]                      # 0.39
priced = add_cost(feb, prices)
priced.loc[0, "cost"]              # 5.67   (14.53 kWh at 0.39)
priced.loc[42, "cost"]             # 0.0    (a fault)
completed_in_period(feb, "2026-02-19 00:00", "2026-02-19 23:59")["session_id"].tolist()
                                   # ['S2641', 'S2642', 'S2644']
site_summary(priced)
```

```text
  site  sessions  energy_kwh  revenue  avg_minutes  faults
0  STN        20       298.1   133.80         65.8       2
1  MKT        16       238.2   123.83         77.8       0
2  HSP        12       163.5    80.14         79.5       0
3  LEI        16       130.8    51.04         95.0       0
```

**Tips.** Look at the file with `info()` and `value_counts(dropna=False)` before writing rules.
`read_csv` has options for the title line and for `-`; `pd.to_numeric(..., errors="coerce")`
handles the words in `minutes`. `Series.map` accepts a Series as well as a dict. Build new
columns with `assign`, change chosen cells with one `loc[mask, "col"] = ...` on your own frame,
never with two brackets in a row. A `datetime64` column compares directly with strings such as
`"2026-03-01 09:30"`, and `between` includes both ends. For the summary, add a boolean
column that is `True` for faults (its sum counts them) and use one named aggregation.
