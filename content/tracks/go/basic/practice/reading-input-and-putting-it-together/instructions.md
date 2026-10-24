`solution.go` is a program. The `Reading` type and the `summary` function, which builds the report
lines, are written for you. Write `parseReading` and `main`. The tests call `parseReading`
directly, and run your program with a file typed into its standard input.

1. **`parseReading(line string) (Reading, error)`** reads one line such as `08:00 412`. Split it
   with `strings.Fields`. On any problem, return an empty `Reading` and one of these errors,
   checked in this order:
   - not exactly 2 fields: `expected 2 fields, found 3` (with the real count);
   - the count is not a whole number: wrap `strconv.Atoi`'s error with `%w` as
     `count "4l2": strconv.Atoi: parsing "4l2": invalid syntax`;
   - the count is negative: `count -3 is negative`.

   Otherwise return the reading, with the hour exactly as written.
2. **`main`**:
   - defines an int flag **`-busy`** (default 0) with `flag.Int`, and calls `flag.Parse()`. If the
     value is negative, print `-busy must not be negative` to standard error and exit with code 2,
     without reading anything;
   - reads standard input line by line with a `bufio.Scanner`, counting lines from 1 (every line
     counts, including the ones it skips);
   - removes spaces around each line, and skips it if it is then empty or starts with `#`;
   - calls `parseReading` for every other line. For an error, prints `line N: <the error>` to
     **standard error** and goes on with the next line;
   - checks `scanner.Err()` after the loop (print it to standard error and exit with code 1);
   - prints each line of `summary(readings, busy)` to **standard output**, where `readings` holds
     the good readings in input order;
   - exits with code 1 if any line was rejected, and 0 otherwise.

A day's file typed into `./counter -busy 300`:

```text
# Bridge Street, Monday
07:00 134
08:00 412
09:00 4l2
10:00 96

11:00 301 bikes
12:00 -3
17:00 388
```

Standard output:

```text
total: 1030
busiest: 08:00 (412)
hours with 300 or more: 08:00 17:00
```

Standard error, with exit code 1:

```text
line 4: count "4l2": strconv.Atoi: parsing "4l2": invalid syntax
line 7: expected 2 fields, found 3
line 8: count -3 is negative
```
