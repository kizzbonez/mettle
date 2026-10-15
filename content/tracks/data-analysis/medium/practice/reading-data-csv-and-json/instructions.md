Write the three functions of `solution.py`. Each one takes the path of a file and returns a
DataFrame read with **one** `pd.read_csv` or `pd.read_json` call and the right options. The
sample files are in `data/`; the tests also give your functions other files with the same layout.
Member numbers and bike ids are codes: they keep their leading zeros, so they stay text.

1. `read_rides(path)` reads a rides export such as `data/rides.csv`. Its first **two** lines are
   notes, the third is the header. Fields are separated by `;`, decimals are written with a comma
   (`42,5`), thousands are grouped with a dot (`1.120`), dates are `DD.MM.YYYY`, and `-` marks a
   reading the bike computer lost. Return the columns `rider`, `ride_date`, `distance_km`,
   `climb_m` and `avg_speed_kmh` (not `note`), with a RangeIndex, and these dtypes:

   | column | dtype |
   | --- | --- |
   | `rider` | `str` |
   | `ride_date` | `datetime64[us]` |
   | `distance_km` | `float64`, NaN where the file has `-` |
   | `climb_m` | `int64` |
   | `avg_speed_kmh` | `float64`, NaN where the file has `-` |

2. `read_members(path)` reads a member list such as `data/members.csv`: no header, three fields
   per line separated by commas, the member number, the name and the riding group. Return the
   columns `name` and `group` (both `str`), indexed by the member number as text, with the index
   named `member`.
3. `read_checks(path)` reads a JSON Lines file of bike checks such as `data/checks.jsonl`, one
   object per line with `bike_id`, `member`, `checked_at`, `brakes_ok` and `tyre_mm`. Return those
   five columns in that order: `bike_id` and `member` as `str`, `checked_at` as
   `datetime64[us]`, `brakes_ok` as `bool`, and `tyre_mm` as `float64` (NaN for a JSON `null`).

Example:

```python
print(read_rides("data/rides.csv"))
print(read_members("data/members.csv").loc["045", "name"])
print(read_checks("data/checks.jsonl")["bike_id"].tolist())
```

```text
  rider  ride_date  distance_km  climb_m  avg_speed_kmh
0   007 2026-04-02         42.5     1120           24.8
1   012 2026-04-02         68.0      860           27.1
2   007 2026-04-05          NaN      640            NaN
3   031 2026-04-06        105.3     2045           25.6
4   012 2026-04-11         55.2      710           28.4
5   100 2026-04-12         23.9      310           19.7
6   031 2026-04-13         88.1     1530           26.0
7   045 2026-04-18         61.4      905           24.3
8   007 2026-04-19         47.0     1205           23.9
9   012 2026-04-26        120.6     1870            NaN
Zoë Fischer
['0042', '0107', '0230', '0042', '0315']
```

**Tips.** Print `dtypes` after every read: a number column that comes out as `str` means an option
is missing. `usecols` picks the columns to keep, `dtype={"col": "str"}` keeps a code as written,
and `parse_dates` needs `date_format` here. `names` gives a headerless file its column names, and
`index_col` makes one of them the index.
