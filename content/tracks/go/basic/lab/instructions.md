Write `solution.go`. The starter declares the two types, the two sentinel errors, the row format
and every function the tests use, with their exact names, parameters and results: keep them. You
may add functions of your own. The tests call your functions directly, and also run your file as
a program, typing a sales sheet into its standard input.

1. **`parseCents(text string) (int, error)`** reads an amount of money as a whole number of cents:
   one to six digits, then, optionally, a point and exactly two more digits. `"4.50"` gives 450,
   `"12"` gives 1200, `"0.05"` gives 5 and `"007.00"` gives 700. For anything else, and for an
   amount of zero, return 0 and `ErrAmount` wrapped with `%w` as `amount "4.5": not a valid
   amount`, with the text quoted by `%q`. That rejects `"4.5"`, `"4."`, `".50"`, `"4.500"`,
   `"3,20"`, `"-4.00"`, `"+4.00"`, `"0.00"`, `"1234567"` and `""`. Check the characters yourself
   with a loop: `strconv.Atoi` alone accepts a sign such as `+4`. (`strings.Cut` splits at the
   point.)
2. **`parseSale(line string) (Sale, error)`** reads one line of the sheet: a stall, an amount and
   a payment method, separated by spaces (`strings.Fields`). Check in this order, and for the first
   problem return an empty `Sale` and:
   - not exactly 3 fields: `expected 3 fields, found 2` (with the real count);
   - a bad amount: `parseCents`'s error, as it is;
   - a method that is not `cash` or `card`, in any mix of upper and lower case: `ErrMethod`
     wrapped as `payment "paypal": unknown payment method`, with the field quoted as written.

   Otherwise return the sale, with the stall's name in lower case (so `Dumplings` and `dumplings`
   are one stall) and `Card` set to `true` for a card payment.
3. **`tally(sales []Sale) map[string]Takings`** adds up each stall's sales: how many there were,
   and the cents paid in cash and by card. A struct stored in a map cannot be changed in place
   (lesson 12): read it, change it, store it back.
4. **`formatCents(cents int) string`** writes cents as units, a point and two digits: 450 is
   `"4.50"`, 5 is `"0.05"`, 0 is `"0.00"` and 123456 is `"1234.56"`.
5. **`report(totals map[string]Takings, feePercent int) []string`** returns the table. Every line
   is `fmt.Sprintf(rowFormat, ...)` with six strings:
   - first a header: `"stall"`, `"sales"`, `"cash"`, `"card"`, `"total"`, `"fee"`;
   - then one row per stall, in alphabetical order of the names: the name, the number of sales
     (`strconv.Itoa`), then the cash, the card, the total (cash plus card) and the fee, each
     written with `formatCents`. A stall's fee is `feePercent` percent of its total, rounded
     down to the cent: `total * feePercent / 100`;
   - last a row named `TOTAL` with the sum of every column. Its fee is the sum of the stalls'
     fees, which can be a cent or two less than the fee on the grand total.

   With no stalls at all, the header is followed directly by a `TOTAL` row of zeros.
6. **`main`**:
   - Defines an int flag **`-fee`**, the percentage, with the default 10, and parses the flags.
     If the fee is not from 0 to 50, print `night market: -fee must be from 0 to 50` to standard
     error and exit with code 2. If any argument is left after the flags, print
     `night market: unexpected argument "notes.txt"` (the first one, quoted) and exit with code 2.
     Both happen before any input is read.
   - Reads standard input line by line with a `bufio.Scanner`, numbering the lines from 1. Every
     line counts, including those it skips. Remove spaces around each line, and skip it if it is
     then empty or starts with `#`.
   - Calls `parseSale` for every other line. For an error, print `line N: <the error>` to
     standard error and go on with the next line.
   - Checks `scanner.Err()` after the loop (print it to standard error and exit with code 1).
   - Prints the `report` of the valid sales with the chosen fee to standard output, one line
     each, or `no sales` when there are none.
   - If any lines were rejected, prints `1 line rejected` or `3 lines rejected` (with the real
     number) to standard error and exits with code 1. Otherwise it exits with code 0.

The sample sheet, typed into the program without flags, so the fee is 10%:

```text
# Canal Street night market, Friday
dumplings 4.50 cash
Dumplings 12.00 card
crepes 3.20 Cash
crepes 3.20 card
bao 6.75 card
crepes 3,20 cash
churros 2.50
dumplings 4.50 cash
bao 6.75 paypal
crepes 0.80 card
```

Standard output:

```text
stall      sales      cash      card     total      fee
bao            1      0.00      6.75      6.75     0.67
crepes         3      3.20      4.00      7.20     0.72
dumplings      3      9.00     12.00     21.00     2.10
TOTAL          7     12.20     22.75     34.95     3.49
```

Standard error, with exit code 1:

```text
line 7: amount "3,20": not a valid amount
line 8: expected 3 fields, found 2
line 10: payment "paypal": unknown payment method
3 lines rejected
```

Bao's fee is 10% of 6.75, which is 0.675, rounded down to 0.67.

**Tips.** Write and check the small functions first: `formatCents`, `parseCents`, `parseSale`.
`slices.Sorted(maps.Keys(totals))` gives the stall names in alphabetical order (lesson 11). Keep
`main` short: it reads, calls your functions and prints.
