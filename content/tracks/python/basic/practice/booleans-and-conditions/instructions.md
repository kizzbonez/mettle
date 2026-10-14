The script reads the customer's `age` (already converted to an `int`) and the `day` of the week
as text. The tests run your file as a script and type the two lines into it. Write only where a
comment says `YOUR CODE`; you may change the lines that are already there.

1. **Check the age.** If it is not from 0 to 120 (both included), print `invalid age` and
   nothing else. A chained comparison suits this.
2. **Choose the category and the price**, in whole euros:

   | Age | Category | Price |
   | --- | --- | --- |
   | under 3 | `infant` | 0 |
   | 3 to 15 | `child` | 6 |
   | 16 to 64 | `adult` | 10 |
   | 65 and over | `senior` | 7 |

3. **Tuesday saver.** If the day is Tuesday **and** the ticket is not free, the price becomes 5.
   Recognise the day whatever its capitals and any spaces around it: `tuesday`, `Tuesday` and
   `  TUESDAY ` all count, but `tues` does not.
4. **Print** the line `<category> ticket: <price>`, with the word `free` instead of a price of 0.
   When the Tuesday saver applied, print a second line, `Tuesday saver`.

Examples: for the age `12` and the day `Tuesday` the script prints

```text
child ticket: 5
Tuesday saver
```

and for `70` and `friday` it prints `senior ticket: 7`. A 1-year-old on a Tuesday gets
`infant ticket: free` and no saver line.

**Tips.** Order the `elif` tests from the youngest age up, so each one only needs an upper
limit. Clean the day before comparing it, as you did with names in lesson 5. A conditional
expression, `"free" if price == 0 else price`, chooses what to show.
