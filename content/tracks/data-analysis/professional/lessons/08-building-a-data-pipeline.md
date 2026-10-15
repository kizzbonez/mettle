---
title: Building a Data Pipeline
summary: Turn an analysis into a program that runs the same way every time. Split the work into read, validate, clean, transform, aggregate and write steps, one function each; chain them with `pipe`; take configuration from a command line built with `argparse`; log what every step did; and fail loudly with a clear message and exit status when the input is wrong.
minutes: 40
objectives:
  - Split a data job into small step functions that each take and return data
  - Chain the steps with `pipe` and keep configuration in one place
  - Build a command line with `argparse`, with typed options, defaults and help
  - Log what each step did with `logging`, separately from the results
  - Fail loudly on bad input with a clear error and a non-zero exit status
---

## Outline

1. From an analysis to a pipeline
2. One function per step
3. Chaining steps and configuration
4. A command line with `argparse`
5. Logging what each step did
6. Failing loudly
7. Running it

## From an analysis to a pipeline

An exploratory analysis is a sequence of cells that worked once. A **pipeline** is the same work
as a program: it reads raw files, checks them, cleans and reshapes the data, aggregates it and
writes the results, and it does that identically every time it is run, by anyone, on any day's
file. The previous lessons gave you each part: validation (lesson 1), tests (2), speed and memory
(3, 4), Parquet (5), sound numbers (6) and reproducibility (7). This lesson puts them together.

The example is a bike-share scheme that exports one CSV of trips per day. The manager wants the
number of trips and the median trip length per station and day:

```text
trip_id,start_station,started,ended
T001,Quay,2026-05-04 07:58,2026-05-04 08:14
T002,Market,2026-05-04 08:03,2026-05-04 08:21
T003,quay ,2026-05-04 08:10,2026-05-04 08:11
T004,Station,2026-05-04 08:15,2026-05-04 08:40
T004,Station,2026-05-04 08:15,2026-05-04 08:40
T005,Market,2026-05-04 12:30,
...
```

The export has the usual faults: a station name typed in lower case with a trailing space, a
one-minute "trip" that was really a bike being re-docked, a repeated row, and a bike still out.

## One function per step

Give each step its own small function that takes data and returns data: easy to read, to test
on its own with a tiny frame (lesson 2), and to replace. The first half of `bikeshare.py`:

```python
"""bikeshare: daily trips per station from the Riverside bike-share export."""
import argparse
import logging
import sys
from pathlib import Path

import pandas as pd

logger = logging.getLogger("bikeshare")
REQUIRED = ["trip_id", "start_station", "started", "ended"]
TIME_FORMAT = "%Y-%m-%d %H:%M"


def read_trips(path):
    trips = pd.read_csv(path, dtype=str)
    missing = [column for column in REQUIRED if column not in trips.columns]
    if missing:
        raise ValueError(f"{path} has no column {', '.join(missing)}")
    logger.info("read %d trips from %s", len(trips), path)
    return trips


def clean(trips, min_minutes):
    started = pd.to_datetime(trips["started"], format=TIME_FORMAT, errors="coerce")
    ended = pd.to_datetime(trips["ended"], format=TIME_FORMAT, errors="coerce")
    minutes = (ended - started).dt.total_seconds() / 60
    keep = minutes.ge(min_minutes) & ~trips.duplicated("trip_id")
    logger.info("kept %d trips, dropped %d (unfinished, shorter than %s min or repeated)",
                keep.sum(), (~keep).sum(), min_minutes)
    return pd.DataFrame({
        "trip_id": trips["trip_id"],
        "station": trips["start_station"].str.strip().str.title(),
        "started": started,
        "minutes": minutes,
    })[keep]


def summarise(trips):
    summary = (
        trips.assign(day=trips["started"].dt.normalize())
        .groupby(["day", "station"], as_index=False)
        .agg(trips=("trip_id", "size"), median_minutes=("minutes", "median"))
    )
    logger.info("summarised %d station-days", len(summary))
    return summary


def write(summary, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "daily.parquet"
    summary.to_parquet(path, index=False)
    logger.info("wrote %s", path)
```

- `read_trips` reads everything as text and **validates the structure** at once: without the
  four columns nothing else can work.
- `clean` parses and filters. An unfinished trip has no end time, so its `minutes` is NaN and
  `ge(min_minutes)` is `False` for it, like a too-short trip. Station names are normalised before
  anyone groups by them. Lesson 1's quarantine would fit here when the dropped rows matter.
- `summarise` is the **transform** and **aggregate** step; `write` stores the result in Parquet,
  so the types survive for whoever reads it next.
- Each step logs one line saying what it did. Constants such as `REQUIRED` and `TIME_FORMAT` sit
  at the top, where a reader finds the rules without reading the code.

## Chaining steps and configuration

A `run` function composes the steps. `DataFrame.pipe(func, *args)` calls `func(frame, *args)`,
so the chain reads in the order the data flows. Everything that can change between runs comes in
as an argument, never from global variables:

```python
def run(source, out_dir, min_minutes):
    summary = read_trips(source).pipe(clean, min_minutes).pipe(summarise)
    write(summary, out_dir)
    return summary
```

`run` is also what a test calls, with a small file and a temporary folder.

## A command line with `argparse`

The configuration comes from the command line. The standard library's `argparse` module (covered
in depth in the Python course's Production Python level) turns a description of the arguments
into a parser that converts types, fills in defaults, writes the help and rejects bad input:

```python
def build_parser():
    parser = argparse.ArgumentParser(prog="bikeshare", description=__doc__)
    parser.add_argument("trips", type=Path, help="trip export (CSV)")
    parser.add_argument("--out", type=Path, default=Path("out"), help="output folder (default: out)")
    parser.add_argument("--min-minutes", type=float, default=2.0, help="shortest real trip (default: 2)")
    return parser
```

`trips` is a **positional** argument, required; `--out` and `--min-minutes` are **options** with
defaults. `type=float` converts the text, and a value it cannot convert is a usage error. The
dashes in `--min-minutes` become `args.min_minutes`. For many settings, a configuration file
(TOML, read with `tomllib`) can supply the defaults, but the command line stays the place to
override them.

## Logging what each step did

`print` is for results; diagnostics belong in a **log**. The `logging` module sends messages
through named loggers (`logging.getLogger("bikeshare")` above) at levels `DEBUG`, `INFO`,
`WARNING`, `ERROR` and `CRITICAL`. `logging.basicConfig` sets where they go (standard error by
default), the lowest level shown and the format. Pass values as arguments, `logger.info("read %d
trips", n)`, and the text is only built when the message is shown. Because the log goes to
standard error and the results to standard output, `python bikeshare.py trips.csv > daily.txt`
saves the table and still shows the log.

## Failing loudly

When the input is wrong, a pipeline should stop, say exactly what is wrong, and tell the caller
through its **exit status**: 0 for success, anything else for failure. A scheduler or a shell
script checks that number. `main` turns the expected failures into a clear log line and status 1,
and leaves unexpected errors to show their traceback, since those are bugs:

```python
def main(argv=None):
    args = build_parser().parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    try:
        summary = run(args.trips, args.out, args.min_minutes)
    except (OSError, ValueError) as error:
        logger.error("%s", error)
        return 1
    print(summary.to_string(index=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

`main(argv=None)` reads `sys.argv` when run as a program, and accepts a list in tests:
`main(["trips.csv", "--min-minutes", "0"])`.

## Running it

```console
$ python bikeshare.py trips.csv
INFO bikeshare: read 11 trips from trips.csv
INFO bikeshare: kept 8 trips, dropped 3 (unfinished, shorter than 2.0 min or repeated)
INFO bikeshare: summarised 6 station-days
INFO bikeshare: wrote out/daily.parquet
       day station  trips  median_minutes
2026-05-04  Market      1            18.0
2026-05-04    Quay      2            16.5
2026-05-04 Station      1            25.0
2026-05-05  Market      2            28.5
2026-05-05    Quay      1            21.0
2026-05-05 Station      1            15.0
$ python bikeshare.py old-export.csv; echo "status $?"
ERROR bikeshare: old-export.csv has no column start_station, ended
status 1
$ python bikeshare.py trips.csv --min-minutes two; echo "status $?"
usage: bikeshare [-h] [--out OUT] [--min-minutes MIN_MINUTES] trips
bikeshare: error: argument --min-minutes: invalid float value: 'two'
status 2
```

The log tells the story of the run: 11 rows in, 3 dropped (the re-docked bike, the repeat and the
bike still out), 6 station-days out. An export from an older system without the right columns
stops at once with the names of the missing columns and status 1, instead of a `KeyError` deep
in `clean`. argparse handles usage errors itself, with status 2, and `--help` prints the help it
generated from the `help=` texts.

## Common mistakes

- **One long function.** It cannot be tested in parts, and a failure says nothing about which
  step broke. Keep steps small and named.
- **Settings buried in the code.** A threshold written inside `clean` is changed by editing code.
  Pass it in from the command line or a configuration file.
- **Printing diagnostics to standard output.** They end up inside the results file. Log them.
- **Catching every exception.** `except Exception` turns bugs into "ERROR" lines without a
  traceback. Catch the failures you expect (`OSError`, `ValueError`).
- **Exiting with status 0 after a failure.** A scheduler then reports success and the next job
  reads a stale or missing file.

## Practice

1. Add an option `--station NAME` that keeps only one station's trips, applied after `clean`.
2. Why does `clean` normalise the station names before `summarise` groups by them?
3. Write the test call that runs the whole pipeline on a small file without the command line.

### Answers

```python
# in build_parser:
    parser.add_argument("--station", help="keep only this station")


def run(source, out_dir, min_minutes, station=None):
    trips = read_trips(source).pipe(clean, min_minutes)
    if station:
        trips = trips[trips["station"] == station]
    summary = summarise(trips)
    write(summary, out_dir)
    return summary

# in main: run(args.trips, args.out, args.min_minutes, args.station)

summary = run(Path("trips.csv"), Path("test-out"), 2.0, station="Quay")
print(summary[["day", "trips"]].to_string(index=False))
```

```text
       day  trips
2026-05-04      2
2026-05-05      1
```

1. Filter after cleaning, so the comparison uses the normalised name.
2. Otherwise `"quay "` and `"Quay"` would be counted as two stations.
3. `run` takes plain values, so a test calls it directly and checks the returned frame with
   `assert_frame_equal`.

## Key takeaways

- A pipeline is read, validate, clean, transform, aggregate and write, one small function each.
- Chain steps with `pipe`; pass configuration in as arguments.
- `argparse` gives typed options, defaults, help and usage errors (status 2) for free.
- Log each step's counts with `logging` to standard error; print only results.
- Fail loudly: a clear message and a non-zero exit status for bad input.

## Further reading

- [Python: argparse tutorial](https://docs.python.org/3/howto/argparse.html)
- [Python: Logging HOWTO](https://docs.python.org/3/howto/logging.html)
- [pandas: DataFrame.pipe](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.pipe.html)
