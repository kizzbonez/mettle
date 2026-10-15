Write the four functions of `solution.py`. A week of visits has one row per day, museum and
ticket type, with the columns `day` (`datetime64[us]`), `museum` and `ticket` (`str`) and
`visitors` (a number, missing when a till lost its count). Read the samples with
`pd.read_csv("data/this-week.csv", parse_dates=["day"])`, and the same for `last-week.csv`. No
function may change the frames it is given.

1. `visitor_table(visits)` returns the total visitors for each museum (rows, index named
   `museum`) and ticket type (columns, named `ticket`), with `0` where a museum sold no ticket of
   a type, and a row and a column named `Total`: what `pivot_table(margins=True,
   margins_name="Total", fill_value=0)` gives with `aggfunc="sum"`. The counts are `int64` when
   `visitors` has no gaps, and floats when it has some.
2. `render(table)` takes such a table and returns it as text with `to_string`, after adding a
   last column `share`: each row's `Total` divided by the grand total. Every count is formatted
   `"{:,.0f}"` (a whole number with thousands separators) and the share `"{:.1%}"`.
3. `batch_warnings(previous, current, max_change=0.2, max_null_rise=0.05)` compares this week's
   visits with last week's and returns a list of warnings, in this order:
   - `row count P -> C (+X%)` when the number of rows changed by more than `max_change` (a
     share: 0.2 is 20%), up or down; the change is formatted `"{:+.0%}"`;
   - `COLUMN: missing values up R%` for each column of `current`, in column order, whose share
     of missing values rose by more than `max_null_rise`; the rise is formatted `"{:.0%}"`;
   - `museum: new value(s) A, B` for museums in `current` but not in `previous`, and
     `museum: missing value(s) A, B` for museums in `previous` but not in `current`, each in
     alphabetical order and only when there are some. A missing museum (NaN) is not a value.

   With nothing to report the list is empty.
4. `write_report(path, previous, current)` writes the report for `current` to the file `path`,
   UTF-8, every line ending with a newline, replacing any earlier file:

   ```text
   Museum visitors, FIRST to LAST

   TABLE

   Data checks:
     - WARNING
   ```

   FIRST and LAST are the first and last `day` of `current` as `YYYY-MM-DD`, TABLE is
   `render(visitor_table(current))`, and there is one `  - WARNING` line per warning of
   `batch_warnings(previous, current)`, or the single line `  - none` when there are none.

Example: `write_report("report.txt", last_week, this_week)` writes

```text
Museum visitors, 2026-09-07 to 2026-09-08

ticket   adult child concession  Total  share
museum                                       
Art      1,965     0        380  2,345  20.2%
Maritime 2,342   860        215  3,417  29.5%
Railway    803   530          0  1,333  11.5%
Science  4,092     0        410  4,502  38.8%
Total    9,202 1,390      1,005 11,597 100.0%

Data checks:
  - row count 12 -> 15 (+25%)
  - visitors: missing values up 13%
  - museum: new value(s) Railway
```

The Science museum's till lost both days' child counts, so the table shows 0 children there:
the check on missing values is what tells the reader that 0 is not a real figure.

**Tips.** `isna().mean()` gives each column's share of missing values. A set difference finds
new and missing museums. `to_string(formatters=...)` takes a dict from column name to a function
such as `"{:,.0f}".format`.
