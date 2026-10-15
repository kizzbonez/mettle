Write `solution.py`, a program run as `python solution.py TICKETS [--min-kg KG]`, and the
functions it is built from. The tests call the functions and also run the program. Every ticket
has a material; `data/tickets.csv` is a sample and `data/old-format.csv` an export from the old
system.

1. `read_tickets(path)` reads the CSV file with `pd.read_csv(path, dtype=str)`, so every value
   stays text. If any of the columns `ticket`, `material` and `weight_kg` is missing, it raises
   `ValueError` with a message that contains `path` and the name of every missing column. Other
   columns are allowed. It logs at INFO how many tickets it read, and returns the frame.
2. `totals(tickets, min_kg)` takes what `read_tickets` returns. A ticket counts when its weight,
   read with `pd.to_numeric(..., errors="coerce")`, is **at least** `min_kg`; a weight that is not
   a number never counts. It returns one row per material of the counted tickets, the material
   with the spaces around it removed and in lower case, sorted by material, with the index 0 to
   n-1 and the columns `material`, `tickets` (how many, `int64`) and `total_kg` (their total
   weight, rounded to 1 decimal). It logs at INFO how many tickets it kept out of how many, and
   does not change `tickets`.
3. `build_parser()` returns an `argparse.ArgumentParser` with the positional argument `tickets`
   and the option `--min-kg`, a `float` with the default `5.0`.
4. `main(argv=None)` parses `argv`, configures logging with
   `logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")`, runs the two
   steps and prints the summary with `to_string(index=False)`. It returns 0. Logs go to standard
   error, so standard output carries only the table. When the file cannot be read (`OSError`),
   when `read_tickets` raises `ValueError`, or when no ticket counts, `main` prints nothing, logs
   one line at ERROR level instead of a traceback, and returns 1. A `--min-kg` that is not a
   number is a usage error that argparse handles itself, with status 2. The file ends with
   `sys.exit(main())` under `if __name__ == "__main__":`.

Example:

```console
$ python solution.py data/tickets.csv
INFO: read 10 tickets from data/tickets.csv
INFO: kept 7 of 10 tickets (at least 5.0 kg)
    material  tickets  total_kg
   cardboard        1      18.5
garden waste        2     184.7
       glass        1      22.0
       metal        2     250.0
        wood        1      95.5
$ python solution.py data/old-format.csv; echo "status $?"
ERROR: data/old-format.csv has no column material, weight_kg
status 1
```

The two `INFO` lines are on standard error; their wording is yours. `Garden waste` and
`garden waste ` are one material; the 4.5 kg of glass, the 3 kg of cardboard and the wood weighed
as `n/a` do not count.

**Tips.** `DataFrame.pipe(totals, min_kg)` calls `totals(frame, min_kg)`, so the steps read in
the order the data flows. Try the program from the terminal, or call `main(["data/tickets.csv"])`.
