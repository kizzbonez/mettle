Write `solution.py`, a command-line program run as:

```text
python solution.py [FILE ...] [-u {c,f}] [-p DIGITS]
```

1. Build the interface with `argparse`:
   - `FILE`: zero or more file names (`nargs="*"`). No files at all, or a file named `-`, means
     standard input.
   - `-u` / `--unit`: `c` or `f` (use `choices`), default `c`.
   - `-p` / `--precision`: the number of decimals shown, a whole number of 0 or more, default `1`.
     Write a small type function that converts with `int()` and raises
     `argparse.ArgumentTypeError` for a negative number, so `-p -1` is a usage error too.

   Anything argparse rejects ends the program with its usage message on standard error and exit
   status 2. That is argparse's own behaviour; you get it for free.
2. Read every file in order. Each line holds one temperature in degrees Celsius. Remove the spaces
   around it; skip empty lines silently. When `float()` cannot convert a line, print
   `skipping NAME line N: 'TEXT'` to **standard error** (`NAME` as given on the command line, `-`
   for standard input, `N` counting from 1 in that file, `TEXT` the stripped line between single
   quotes) and carry on.
3. Print the summary to **standard output**, four lines, converting every value to Fahrenheit
   first (`c * 9 / 5 + 32`) when the unit is `f`:

   ```text
   count: N
   min: LOWEST
   max: HIGHEST
   mean: AVERAGE
   ```

   `N` is a plain integer; the three temperatures have exactly `DIGITS` decimals
   (`f"{value:.{digits}f}"`).
4. Exit status: `0` after printing the summary. `1`, with nothing on standard output, when a
   file cannot be opened (catch `OSError`; print `error: ` and the error to standard error) or
   when there was not a single reading (print `error: no readings` to standard error). Read all
   the files before printing anything, so a missing last file leaves standard output empty.
5. Put the work in `main(argv=None)`, which passes `argv` to `parse_args` and **returns** the
   status, and end the file with:

   ```python
   if __name__ == "__main__":
       sys.exit(main())
   ```

**Example.** `data/balcony.txt` holds `12.5`, `14.0`, `n/a`, an empty line, `9.5` and `16.0`:

```console
$ python solution.py data/balcony.txt
skipping data/balcony.txt line 3: 'n/a'
count: 4
min: 9.5
max: 16.0
mean: 13.0
$ printf '21\n19.5\n' | python solution.py -u f -p 2
count: 2
min: 67.10
max: 69.80
mean: 68.45
$ python solution.py data/balcony.txt -p two; echo $?
usage: solution.py [-h] [-u {c,f}] [-p PRECISION] [FILE ...]
solution.py: error: argument -p/--precision: invalid precision value: 'two'
2
```

The `skipping` line goes to standard error and the four summary lines to standard output.
