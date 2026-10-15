Write `solution.py`. The starter declares the five functions the tests call: keep their names
and parameters. You may add helper functions. Use pandas (and NumPy where it helps), not loops
over rows. The files are in `data/`:

- `scales-may.csv`, the gateway's May export, and `scales-june.csv`, the first days of June,
  with the same layout: a column `time_utc` holding times such as `2026-05-01T05:30Z` (UTC),
  then one column per scale, named by hive id, holding the weight in kg.
- `hives.csv`: `hive_id`, `apiary_id`, `colony`, `installed`.
- `apiaries.csv`: `apiary_id`, `name`, `site`.

The beekeepers live on **local time**, the `Europe/London` time zone, which is UTC in winter
and one hour ahead in summer. A "day" below always means a local calendar day.

1. **`read_scales(path)`** reads one export and returns it in long form, one row per usable
   reading, with exactly these columns, in this order:
   - `time`: the reading time converted to `Europe/London` (dtype `datetime64[us, Europe/London]`);
   - `hive_id`: the column name the weight came from (dtype `str`);
   - `weight_kg`: the weight as a float. A cell that is empty or is not a number (`ERR`, `-`
     and the like) is not a usable reading: drop that row.

   Rows are sorted by `hive_id`, then by `time`; the index is `0, 1, 2, ...`. Every scale column
   in the file is kept, registered or not.

2. **`read_hives(hives_path, apiaries_path)`** returns the hive register, one row per hive, with
   the columns `hive_id`, `colony`, `apiary` (the apiary's `name`) and `site`, in this order,
   sorted by `hive_id`, index `0, 1, 2, ...`. Clean every `hive_id` by removing the spaces
   around it and making it upper case. Join each hive to its apiary on `apiary_id`; a hive
   whose apiary is not in `apiaries.csv` is kept, with `apiary` and `site` missing. The
   apiaries file must list each apiary once: merge with `validate` so that a duplicated
   `apiary_id` raises `pandas.errors.MergeError`.

3. **`unknown_scales(readings, hives)`** takes the results of 1 and 2 and returns a Series that
   counts the readings of every `hive_id` in `readings` that is not in `hives`: the index is
   those hive ids, sorted, named `hive_id`; the values are `int64` counts; the Series is named
   `readings`. When every scale is registered, return an empty Series of that form.

4. **`daily_weights(readings)`** returns each hive's mean weight on each local day as a wide
   DataFrame:
   - one row for **every** date from the first day with a reading to the last, including a date
     on which no scale sent anything (its row is all missing). The index holds each date's
     local midnight as a tz-aware `DatetimeIndex` in `Europe/London`, as `resample("D")` or
     `dt.normalize()` makes it, and is named `date`;
   - one column per `hive_id` in `readings` (registered or not), sorted, with the column index
     named `hive_id`;
   - values are the mean of that hive's readings on that day, rounded to 2 decimals, and
     missing where the hive has no reading that day.

5. **`hive_summary(daily, hives)`** takes the results of 4 and 2 and returns one row for every
   hive that is **both** in `hives` and a column of `daily`. The index is `hive_id`, and the
   columns are, in this order:
   - `colony` and `apiary`, from `hives`;
   - `gain_kg`: the hive's last daily weight minus its first daily weight, where "first" and
     "last" are the first and last dates on which **that hive** has a value; rounded to 2;
   - `best_3_days_kg`: the largest change over three days, that is the largest value of the
     day's weight minus the weight of the date three rows earlier, ignoring pairs where either
     is missing; rounded to 2;
   - `rank` (`int64`): 1 for the largest `gain_kg`. Hives with the same gain share the better
     rank and the next rank skips: two hives tied for first are both 1, the next is 3;
   - `band`: `gain_kg` in bands, as an ordered categorical with the categories `losing`,
     `steady`, `flow`, `strong` in that order (what `pd.cut` with `labels` makes). A band
     includes its lower edge: below 0 is `losing`, 0 up to but not including 3 is `steady`,
     3 up to 8 is `flow`, and 8 or more is `strong`.

   Sort the rows by `rank`, then by `hive_id`. When no registered hive is a column of `daily`,
   return an empty DataFrame that still has these six columns.

**Example.** For May, `readings = read_scales("data/scales-may.csv")` has 404 rows. The first
reading in the file, `2026-05-01T05:30Z`, is 06:30 local time, and the reading at
`2026-05-01T23:30Z` belongs to **2 May** locally:

```text
                       time hive_id  weight_kg
0 2026-05-01 06:30:00+01:00     H01       34.5
1 2026-05-01 12:30:00+01:00     H01       34.2
2 2026-05-01 18:30:00+01:00     H01       34.7
3 2026-05-02 00:30:00+01:00     H01       35.8
```

`hives = read_hives("data/hives.csv", "data/apiaries.csv")` has eight hives, `H01` to `H08`.
`unknown_scales(readings, hives)` is a Series with one entry: `H09`, 51 readings.
`daily = daily_weights(readings)` has 15 rows, 1 to 15 May, and 8 columns, `H01` to `H07`
and `H09`. Its first rows for `H01` are 34.47, 35.58 and 36.45; the row for 10 May, when the
gateway was down, is all missing. `hive_summary(daily, hives)` has seven rows (`H08` has no
readings, `H09` is not a hive) and begins:

```text
          colony             apiary  gain_kg  best_3_days_kg  rank    band
hive_id                                                                   
H01       Clover  Pear Tree Orchard    12.93            2.86     1  strong
H04        Gorse     Ridgeway Heath    10.23            3.48     2  strong
H02      Bramble  Pear Tree Orchard     9.80            2.17     3  strong
```

**Tips.** `melt`, `pd.to_numeric(..., errors="coerce")` and `pd.to_datetime(..., utc=True)`
followed by `.dt.tz_convert(...)` do most of step 1. For step 4, a `pivot_table` on a
`pd.Grouper(key="time", freq="D")`, or a `groupby` followed by `resample`, gives the daily
means, but a reshaping step may drop a date that has no data at all: `asfreq("D")` puts it
back. For step 5, `bfill` and `ffill` find each column's first and last values, and `diff`
works on rows, which is why step 4 must have one row per date.
