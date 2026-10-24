Every Friday evening, stalls line Canal Street for the night market: dumplings, crêpes, bao,
churros. Each stall keeps a sheet of its sales, one line per sale: the stall, the amount, and
whether the customer paid in cash or by card. At midnight the organiser types all the sheets into
one file:

```text
# Canal Street night market, Friday
dumplings 4.50 cash
Dumplings 12.00 card
crepes 3.20 Cash
```

The market keeps a small fee, a percentage of each stall's takings. Until now the organiser worked
it out with a spreadsheet. It counted `Dumplings` and `dumplings` as two stalls, read a tired
stallholder's `3,20` as three hundred and twenty, and quietly skipped any line it could not make
sense of, so the fees it produced were argued about every week.

You are writing its replacement: a small command-line program that reads the file from standard
input, checks every line, prints the night's table with each stall's fee, and reports exactly
which lines need fixing, so that the organiser can correct them and run it again.
