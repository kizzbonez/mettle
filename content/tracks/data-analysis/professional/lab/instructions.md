Write `solution.py`, a program run as `python solution.py FILE [FILE ...]`, and the functions it is
built from. The tests call the functions directly and also run the program. The starter declares
them; keep their names and parameters. You may add more functions. Use pandas and NumPy.

**The files.** Each reading file in `data/` has the columns `sensor`, `time`, `co2_ppm` and
`temp_c`, in any order; a file may have other columns, which are ignored. The files have no blank
lines. `data/rooms.csv` has the columns `sensor,room`, one line per registered sensor; read it
with `pd.read_csv(path, dtype=str)`.

1. `load_readings(paths)` reads each file with `pd.read_csv(path, dtype=str, keep_default_na=False)`,
   so every value stays text exactly as written and an empty field is the empty string `""`. When a
   file lacks any of the four columns, raise `ValueError` with a message that contains the file's
   name. Otherwise return one DataFrame holding the rows of every file, files in the order given
   and rows in file order, with the index 0 to n-1 and these columns in this order:
   - `file`: the file's name without its folder (`readings-2026-03-02.csv`);
   - `line`: the row's line number in its file as `int64`; the header is line 1, so the first
     reading is line 2;
   - `sensor`, `time`, `co2_ppm`, `temp_c`: the values as read (`str`).
2. `validate(raw, rooms)` takes what `load_readings` returns and the rooms table, and returns the
   tuple `(clean, quarantine)`. First remove the spaces around every value and upper-case the
   sensor id, so ` aq-02` is `AQ-02`. Then check each row against these rules, in this order; the
   first rule a row breaks is its **reason**:
   - `unknown sensor`: the sensor id is not in `rooms["sensor"]`;
   - `bad time`: the time is not a real date and time in the form `YYYY-MM-DD HH:MM`, as
     `pd.to_datetime(..., format="%Y-%m-%d %H:%M", errors="coerce")` reads it;
   - `bad co2`: `co2_ppm` is not a number, is not a whole number (`850.0` is whole, `850.5` is
     not), or is outside 300 to 5000 inclusive;
   - `bad temperature`: `temp_c` is not empty and is not a number from 0 to 40 inclusive. An
     empty temperature is allowed: that sensor sent no temperature, which becomes NaN;
   - `duplicate`: the row broke none of the rules above and an **earlier** row that also broke
     none of them has the same sensor and time (after cleaning). The first one is kept.

   `clean` holds the rows with no reason, with the index 0 to n-1, sorted by sensor and then
   time, and the columns `sensor` (`str`, cleaned), `room` (`str`, from `rooms`), `time`
   (`datetime64[us]`), `co2_ppm` (`int64`) and `temp_c` (`float64`). `quarantine` holds the other
   rows exactly as `raw` has them (not cleaned) plus a column `reason` (`str`), in the order of
   `raw`, with the index 0 to n-1.
3. `summarise(clean)` returns one row for each day and room that has readings, sorted by date and
   then room, with the index 0 to n-1 and the columns `date` (the day at midnight, as
   `.dt.normalize()` gives it, `datetime64[us]`), `room`, `readings` (how many, `int64`),
   `mean_co2` (the mean, rounded to 1 decimal), `max_co2` (`int64`), `high` (how many readings
   were 1500 ppm or more, `int64`) and `mean_temp` (the mean of the temperatures present, rounded
   to 1 decimal, NaN when there are none).
4. `report(clean, quarantine, daily)` returns the report as one string, every line ending with a
   newline. `report` is only called when `clean` has at least one row.

   ```text
   Air quality report
   Rows read: N
   Rows kept: K (P%)
   Rows quarantined: Q
     REASON: COUNT
   Worst room each day:
     DATE ROOM: max MAX ppm, HIGH of READINGS readings high
   ```

   N is the rows of `clean` plus the rows of `quarantine`, K and Q the rows of each, and P is
   `100 * K / N` with one decimal. There is one `REASON: COUNT` line, indented by two spaces, for
   each reason that occurs, in alphabetical order of the reason, and none when nothing was
   quarantined. Then there is one line for each date of `daily`, in date order, naming the room
   with the highest `max_co2` that day; when rooms tie, the first by name. DATE is `YYYY-MM-DD`
   and the other values come from that row of `daily`.
5. The command line, built with `argparse` in `build_parser()`:

   ```text
   python solution.py FILE [FILE ...] [--rooms PATH] [--out DIR]
   ```

   `--rooms` defaults to `data/rooms.csv` and `--out` to `out`. `main(argv=None)` parses `argv`,
   runs the steps above, creates the `--out` folder (and any missing parent folders), writes four
   files into it and prints the report to standard output:
   - `readings.parquet`: `clean`, written without its index;
   - `daily.parquet`: the summary, written without its index;
   - `quarantine.csv`: `quarantine`, written without its index;
   - `report.txt`: the report.

   Configure logging with
   `logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")` and log at INFO
   what each step did (the wording is yours). Logs go to standard error; standard output carries
   only the report. `main` returns the exit status, and the file ends with `sys.exit(main())`
   under `if __name__ == "__main__":`.
6. `main` returns 0 on success. It returns 1, with nothing on standard output, no file written
   and a log line starting `ERROR: ` instead of a traceback, when a file cannot be read
   (`OSError`), when `load_readings` raises `ValueError`, or when no row passes validation.
   Leaving out FILE is a usage error, so argparse exits with status 2.

**Example.** The two school days in `data/`:

```console
$ python solution.py data/readings-2026-03-02.csv data/readings-2026-03-03.csv 2> /dev/null
Air quality report
Rows read: 134
Rows kept: 122 (91.0%)
Rows quarantined: 12
  bad co2: 3
  bad temperature: 2
  bad time: 2
  duplicate: 3
  unknown sensor: 2
Worst room each day:
  2026-03-02 Music room: max 1866 ppm, 4 of 12 readings high
  2026-03-03 Science lab: max 1934 ppm, 5 of 12 readings high
```

Some of what the functions return on the way:

```python
>>> rooms = pd.read_csv("data/rooms.csv", dtype=str)
>>> raw = load_readings(["data/readings-2026-03-02.csv", "data/readings-2026-03-03.csv"])
>>> clean, quarantine = validate(raw, rooms)
>>> quarantine.loc[[0, 4, 7, 9], ["file", "line", "sensor", "co2_ppm", "temp_c", "reason"]]
                      file  line sensor co2_ppm temp_c           reason
0  readings-2026-03-02.csv    17  AQ-07     655   20.1   unknown sensor
4  readings-2026-03-02.csv    57  AQ-04    1822   21.1        duplicate
7  readings-2026-03-03.csv     2  AQ-01    1104   20.8        duplicate
9  readings-2026-03-03.csv    15  AQ-03    1662   21,4  bad temperature
>>> daily = summarise(clean)
>>> daily.iloc[[0, 1, 3]]
        date        room  readings  mean_co2  max_co2  high  mean_temp
0 2026-03-02        Hall        12     739.5      918     0       20.2
1 2026-03-02  Music room        12    1339.8     1866     4       20.5
3 2026-03-02      Room 2        13    1113.7     1537     1       20.4
>>> daily.iloc[[5]]
        date  room  readings  mean_co2  max_co2  high  mean_temp
5 2026-03-03  Hall        13     794.3      990     0        NaN
```

Line 2 of the Tuesday file repeats Monday's 15:00 reading of AQ-01, so it is a duplicate.
Room 2 has 13 readings on Monday because ` aq-02` and `aq-02` are cleaned to `AQ-02`.
The Hall has no temperature on Tuesday, so its `mean_temp` that day is NaN.

**Tips.** Build each rule as a boolean Series over all rows, then turn the rules into reasons
with `np.select`, which takes the first condition that is true. Find duplicates only among the
rows that passed the other rules. Write and check `load_readings`, `validate`, `summarise` and
`report` first; `main` is then a few lines, and you can try it as `main(["data/readings-2026-03-04.csv"])`.
