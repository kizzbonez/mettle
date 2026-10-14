---
title: Reports with awk
summary: Use awk to split lines into fields, select records with patterns, keep running totals in variables and arrays, and print tidy reports with printf.
minutes: 30
objectives:
  - Describe records and fields and use `$0`, `$1`, `NF`, `$NF` and `NR`
  - Write `pattern { action }` rules, including comparisons, regex matches and `BEGIN` and `END`
  - Total and count values by key with variables and associative arrays
  - Format a report with `printf` widths and decimal places
---

## Outline

1. What awk is
2. Records and fields
3. Patterns and actions
4. Choosing the field separator
5. `BEGIN`, `END` and variables
6. Arrays for totals by key
7. Formatting with `printf`

## What awk is

`awk` is a small programming language built for one job: reading text that is arranged in
columns and computing something from it. Where `cut` can only pick columns, awk can compare them,
add them up, count them and print the result in any layout. On Linux the `awk` command is usually
**GNU awk** (`gawk`); everything in this lesson works in any awk.

An awk program is a list of **rules**, each written `pattern { action }`. For every input line,
awk tests each pattern in turn and runs the action of every pattern that matches. Leave out the
pattern and the action runs for every line; leave out the action and awk prints the matching
lines. Put the program in single quotes so the shell leaves `$1` and the braces alone.

The examples read `sales.txt`, with columns region, item, quantity and unit price:

```text
north  pen   3   1.20
south  ink   12  7.50
north  pad   1   4.00
east   pen   25  1.20
south  pen   3   1.20
```

## Records and fields

awk calls each line a **record** and splits it into **fields**. By default fields are separated
by runs of spaces and tabs, and spaces at the start or end of a line are ignored, which is exactly
what `cut` cannot do. Inside an action:

- `$0` is the whole record and `$1`, `$2` and so on are its fields.
- `NF` is the number of fields, so `$NF` is the last field.
- `NR` is the number of the current record, counting from 1.

```bash
awk '{ print $1, $3 }' sales.txt | head -2
awk '{ print NR ": " $2 " has " NF " fields, last is " $NF }' sales.txt | head -2
```

```text
north 3
south 12
1: pen has 4 fields, last is 1.20
2: ink has 4 fields, last is 7.50
```

A comma in `print` puts a space between the values. Values written next to each other with no
comma are joined directly, which is how the second command builds a sentence.

## Patterns and actions

A pattern can be a comparison such as `$3 >= 10` or `$2 == "pen"`, a regular expression between
slashes that is tested against the whole line, or `$2 ~ /^p/`, which tests one field (`!~` means
"does not match"). Combine patterns with `&&` (and), `||` (or) and `!` (not). awk compares two
values as numbers when both look like numbers, and as text otherwise.

```bash
awk '$3 >= 10' sales.txt
awk '$2 == "pen" { print $1 }' sales.txt
awk '$2 ~ /^p/ && $3 < 5 { print $1, $2 }' sales.txt
```

```text
south  ink   12  7.50
east   pen   25  1.20
north
east
south
north pen
north pad
south pen
```

## Choosing the field separator

When fields are separated by something other than spaces, give the separator with `-F`.
`-F,` reads CSV and `-F:` reads files such as `/etc/passwd`, whose seven fields are separated by
colons.

```bash
printf 'ada:x:1000:1000:Ada:/home/ada:/bin/bash\nbo:x:1001:1001:Bo:/home/bo:/bin/sh\n' > passwd.txt
awk -F: '$7 == "/bin/bash" { print $1 }' passwd.txt
awk -F: '{ print $1 " -> " $6 }' passwd.txt
```

```text
ada
ada -> /home/ada
bo -> /home/bo
```

## `BEGIN`, `END` and variables

`BEGIN` is a special pattern whose action runs once before the first line is read; `END` runs
once after the last line. Between them, **variables** carry values from line to line. An awk
variable needs no declaration: one that has never been set counts as `0` in arithmetic and as an
empty string in text, so `total += x` just works. `-v name=value` sets a variable from the
command line before the program starts, which is the safe way to pass in a shell value.

```bash
awk 'BEGIN { print "Sales report" } { total += $3 * $4 } END { print "revenue", total }' sales.txt
awk -v min=5 '$3 >= min { print $2 }' sales.txt
```

```text
Sales report
revenue 131.2
ink
pen
```

`+=` adds to a variable; awk also has `-=`, `++` (add one) and the usual `+ - * / %`.

## Arrays for totals by key

An awk **array** maps keys to values, and the keys can be any text, so you can keep one total per
region or one count per item without knowing the names in advance. `revenue[$1] += ...` adds to
the entry for this line's region, creating it the first time. In `END`, the loop
`for (key in array)` visits every key.

```bash
awk '{ revenue[$1] += $3 * $4 } END { for (r in revenue) print r, revenue[r] }' sales.txt | sort
awk '{ count[$2]++ } END { for (i in count) print i, count[i] }' sales.txt | sort
```

```text
east 30
north 7.6
south 93.6
ink 1
pad 1
pen 3
```

`for (key in array)` visits the keys in no particular order, which is why the output is piped
through `sort`. This "array plus `END`" pattern replaces whole pipelines of `sort | uniq -c`.

## Formatting with `printf`

`print` is quick but gives no control over layout. `printf` takes a **format string** with one
placeholder per value: `%s` for text, `%d` for a whole number and `%f` for a decimal number. A
number between `%` and the letter sets a minimum width, a `-` aligns to the left, and `.2` sets
two decimal places. Unlike `print`, `printf` adds no newline; write `\n` yourself.

```bash
awk '{ revenue[$1] += $3 * $4 }
     END { for (r in revenue) printf "%-6s %8.2f\n", r, revenue[r] }' sales.txt | sort -k2,2nr
```

```text
south     93.60
east      30.00
north      7.60
```

A program longer than a line can span several lines inside the quotes, as here.

## Common mistakes

- **Double quotes around the program.** The shell then replaces `$1` with its own first
  argument. Use single quotes, and `-v` to pass values in.
- **Forgetting `-F` for CSV.** Without it, a line like `ada,pen,3` is a single field.
- **Expecting array order.** `for (k in a)` has no defined order; sort the output.
- **Forgetting `\n` in `printf`.** Every row ends up on one line.
- **Comparing values that only look like numbers.** A field such as `10kg` is text, and text
  compares character by character, so `10kg` sorts before `9kg`.

## Practice

1. Print the item and quantity of every sale in the `south` region.
2. Print the number of lines in `sales.txt` and the average quantity, with two decimal places.
3. Print each item with its total quantity, largest first.

### Answers

1. `awk '$1 == "south" { print $2, $3 }' sales.txt` prints `ink 12` and `pen 3`.
2. `awk '{ sum += $3 } END { printf "%d lines, average %.2f\n", NR, sum / NR }' sales.txt` prints
   `5 lines, average 8.80`. In `END`, `NR` still holds the number of the last record.
3. `awk '{ qty[$2] += $3 } END { for (i in qty) print i, qty[i] }' sales.txt | sort -k2,2nr`
   prints `pen 31`, `ink 12`, `pad 1`.

## Key takeaways

- awk splits each record into fields: `$1` to `$NF`, with `$0` the whole line and `NR` its number.
- A rule is `pattern { action }`; either part may be left out.
- `BEGIN` and `END` run before and after the input; variables start at zero.
- Arrays keyed by text total anything by group; `printf` lays the result out.

## Further reading

- [gawk(1) manual page](https://man7.org/linux/man-pages/man1/gawk.1.html)
- [The GNU Awk User's Guide: Examining fields](https://www.gnu.org/software/gawk/manual/html_node/Fields.html)
