Complete the four functions in `solution.sh` and the line that calls `main`. The tests run the
script as `bash solution.sh ORDER`, and they also **source** it (`source ./solution.sh`) to call
each function on its own.

Each line of ORDER is `CODE QTY UNIT`: a part code, a quantity and a unit price in whole cents.
`main` is written for you and uses your functions; leave it as it is.

1. `die MESSAGE` prints `parts: MESSAGE` on standard error and exits with status 1.
2. `is_part_code CODE` answers through its **status** only: 0 when CODE is exactly three capital
   letters, a dash and four digits (`BRK-0042`), and 1 for anything else, including `brk-0042`,
   `BRK-042` and `XBRK-0042`. It prints nothing.
3. `line_cost QTY UNIT` prints QTY times UNIT. Costs are often far above 255, so the result
   travels as **output**, not as a status.
4. `cents_to_euros CENTS` prints a whole number of cents as euros with two decimals: `950` gives
   `9.50` and `5` gives `0.05`. `printf '%d.%02d\n' "$((cents / 100))" "$((cents % 100))"` does it.
5. Every variable your functions set must be `local`. The tests check that calling them leaves the
   caller's variables untouched and creates no new ones.
6. Run `main "$@"` only when the file is executed. When another script sources `solution.sh`,
   nothing may run and nothing may be printed.

Example, with `data/order.txt`:

```text
$ bash solution.sh data/order.txt
BRK-0042 2 x 4.50 = 9.00
CHN-0108 1 x 19.99 = 19.99
parts: skipping unknown part code brk-0042
TUB-0700 30 x 3.50 = 105.00
total 133.99
$ echo $?
0
```

The `parts: skipping ...` line is on standard error. A file that cannot be read, as in
`bash solution.sh missing.txt`, prints `parts: cannot read missing.txt` on standard error and
exits with status 1.
