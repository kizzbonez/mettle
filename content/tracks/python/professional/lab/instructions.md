Write `solution.py`, a command-line program run as `python solution.py ...`. The starter declares
the functions the tests call directly; keep their names and parameters. You may add more
functions. Use only the standard library.

**The files.** `data/orders.csv` has the header `member,item,quantity` and one line per thing a
household ordered. `data/prices.json` holds an object whose `"items"` object maps each item id to
its price as a string with at most two decimals, such as `"17.85"`. Other keys are ignored.

1. `load_prices(path)` reads the JSON file and returns a `dict` from item id to a
   `decimal.Decimal` price. Raise `ValueError` (with any message) when the file is not valid
   JSON, when it has no `"items"` object, or when a price is not a string (a JSON number such as
   `17.85` would arrive as a float), is not a number (`"17,85"`), or is negative.
   `json.JSONDecodeError` is already a `ValueError`; `Decimal("17,85")` raises
   `decimal.InvalidOperation`, which is not.
2. `read_orders(path, prices)` reads the CSV file (open it with `newline=""`) and returns a `dict`
   from member name to a `dict` from item id to the total quantity (an `int`) that member
   ordered. Take the member, item and quantity of each line and remove the spaces around them.
   Check them in this order and skip the line at the first problem, logging a warning through
   the `logging` module whose message is exactly one of:
   - `line N: missing member` when the member is empty or missing;
   - `line N: unknown item 'ID'` when the item id is not a key of `prices` (ids are compared
     exactly, so `Rice-5kg` is unknown);
   - `line N: bad quantity 'TEXT'` when `int()` cannot convert the quantity, or it is below 1.

   `'ID'` and `'TEXT'` are the stripped values written with `repr()`, as `%r` or `{value!r}`
   do; a missing value counts as the empty string `''`. `N` is the line number in the file,
   counting the header as line 1, which is what `reader.line_num` holds after reading a row.
   `csv.DictReader` skips blank lines by itself: they get no warning but still count. When a
   member orders the same item on several lines, add the quantities.
3. `bill(items, prices, fee_percent)` takes one member's `{item: quantity}` dict, the prices and
   the fee percentage as a `Decimal`, and returns the tuple `(subtotal, fee, total)` of
   `Decimal`s. The subtotal is the sum of price times quantity. The fee is
   `subtotal * fee_percent / 100` rounded to whole cents with `ROUND_HALF_UP`, so 0.825 becomes
   0.83. The total is the subtotal plus the fee. With no items, all three are 0.
4. The command line has two subcommands, built with `argparse`:

   ```text
   python solution.py totals [--orders PATH] [--prices PATH] [--fee PERCENT]
   python solution.py invoice MEMBER [--orders PATH] [--prices PATH] [--fee PERCENT]
   ```

   `--orders` defaults to `data/orders.csv`, `--prices` to `data/prices.json` and `--fee` to 5.
   The fee may have decimals (`2.5`) and must be from 0 to 100. Anything else (`abc`, `-1`,
   `150`), a missing or unknown subcommand, or a missing `MEMBER` is a usage error: argparse
   prints the usage to standard error and exits with status 2. Note that `type=Decimal` is not
   enough, because argparse only turns `ValueError`, `TypeError` and
   `argparse.ArgumentTypeError` into usage errors.
5. Configure logging with `logging.basicConfig(format="%(levelname)s: %(message)s")`, so warnings
   reach standard error as `WARNING: line 6: unknown item 'tea-1kg'`. Standard output carries
   only the results below.
6. `totals` writes CSV to standard output: the header `member,subtotal,fee,total`, one line per
   member who has at least one valid line, sorted by name with Python's normal string order, and
   a last line `TOTAL` with the sum of each column. Every amount has exactly two decimals. Write
   the lines with `csv.writer`, so a name containing a comma is quoted (`"Okafor, Ada"`).
7. `invoice MEMBER` prints, for the member whose name equals `MEMBER` with its surrounding spaces
   removed, the line `Invoice for NAME`, then one line per item sorted by item id in the form
   `ITEM QUANTITY x PRICE = AMOUNT`, then `Subtotal: ...`, `Fee: ...` and `Total: ...`, every
   amount with two decimals.
8. Exit status 0 when the results were printed, even if lines were skipped. Exit status 1, with
   nothing on standard output and an `ERROR: ...` log line on standard error, when a file cannot
   be opened (`OSError`), when `load_prices` raises `ValueError`, or when the invoice's member has
   no valid lines (log `no orders for NAME`).

**Example.** The October files in `data/`:

```console
$ python solution.py totals
WARNING: line 6: unknown item 'tea-1kg'
WARNING: line 8: bad quantity 'two'
WARNING: line 10: missing member
WARNING: line 11: bad quantity '0'
member,subtotal,fee,total
Ana,55.05,2.75,57.80
Ben,17.85,0.89,18.74
Chloe,16.50,0.83,17.33
Dev,48.21,2.41,50.62
TOTAL,137.61,6.88,144.49
$ python solution.py invoice Ana 2> /dev/null
Invoice for Ana
lentils-2kg 3 x 6.95 = 20.85
oats-5kg 3 x 11.40 = 34.20
Subtotal: 55.05
Fee: 2.75
Total: 57.80
$ python solution.py invoice Zed 2> /dev/null; echo $?
1
```

The four `WARNING` lines go to standard error and the rest to standard output. Ana ordered oats
on lines 2 and 9, so her invoice shows 3 bags. ` Dev ` on line 7 is the same member as `Dev` on
line 12. Chloe's fee is 5 % of 16.50, exactly 0.825, rounded half up to 0.83.

**Tips.** Write and test `load_prices`, `read_orders` and `bill` first; the subcommands are then
a few lines each. Use `parents=` in `add_parser` to give both subcommands the same options. Keep
`main(argv=None)` returning the status and end the file with `sys.exit(main())`, so you can try
`main(["totals", "--fee", "2.5"])` directly.
