---
title: Text Filters
summary: Sort, count, cut, join, translate and number lines of text with the classic filter commands, then chain them into pipelines that answer real questions.
minutes: 30
objectives:
  - Sort lines as text, as numbers and by a chosen field with `sort -n`, `-r`, `-t` and `-k`
  - Count and remove duplicate lines with `uniq` and `sort -u`, and explain why `uniq` needs sorted input
  - Pick out, combine and change columns and characters with `cut`, `paste`, `tr` and `nl`
  - Build a pipeline of filters that turns a raw file into a short summary
---

## Outline

1. What a filter is
2. Sorting lines with `sort`
3. Sorting by a field
4. Duplicates: `uniq` and `sort -u`
5. Columns: `cut` and `paste`
6. Characters: `tr`
7. Numbering lines with `nl`
8. Building a pipeline

## What a filter is

A **filter** is a command that reads lines of text, changes them in one specific way and writes
the result to standard output. It reads the files you name, or standard input when you name none,
and it never changes the original file. Because every filter speaks plain lines, you can join
them with the pipes you met in the Basic level: each command does one small job, and the pipeline
as a whole answers the question.

The examples use this file, `orders.csv`, where each line is customer, product and quantity:

```text
ada,pen,3
bo,ink,12
ada,pad,1
cy,pen,25
bo,pen,3
```

A file like this, with values separated by commas, is called **CSV** (comma-separated values).

## Sorting lines with `sort`

`sort` reads every line, puts them in order and prints them. By default it compares lines as
**text**, one character at a time from the left, so `100` comes before `9` because the character
`1` sorts before `9`. The option `-n` compares the leading number of each line instead, and `-r`
reverses any order.

```bash
printf '10\n9\n100\n' | sort
printf '10\n9\n100\n' | sort -n
```

```text
10
100
9
9
10
100
```

`-h` understands sizes such as `2K` and `1G`, and `-f` ignores the difference between upper and
lower case. Text order also depends on your **locale**, the language settings of your session.
With the `C` locale, which the course sandbox uses, all capitals come before all lower-case
letters (`Banana` before `apple`). Many desktops use a locale such as `en_US.UTF-8`, where
`apple` and `Apple` sit next to each other. Run `LC_ALL=C sort` when you need the same order
everywhere.

## Sorting by a field

A **field** is one column of a line. `-t` names the character that separates fields, and
`-k START,END` says which fields form the **sort key**, the part of the line that is compared.
Add a type letter to a key to change how it is compared: `-k3,3n` means "field 3 only, as a
number". Give several `-k` options and each later key breaks ties left by the earlier ones.

```bash
sort -t, -k3,3nr -k1,1 orders.csv
```

```text
cy,pen,25
bo,ink,12
ada,pen,3
bo,pen,3
ada,pad,1
```

Largest quantity first; the two orders of 3 are ordered by customer. Always write the end of the
key. `-k2` alone means "from field 2 to the end of the line", so `pen,25` is compared as text with
`pen,3`, and `25` loses to `3`.

## Duplicates: `uniq` and `sort -u`

`uniq` removes a line that is identical to **the line just before it**. It only ever compares
neighbours, which is why it is almost always used after `sort`: sorting puts equal lines side by
side. `-c` prefixes each line with how many times it occurred, `-d` prints only lines that were
repeated and `-u` only lines that were not.

```bash
cut -d, -f2 orders.csv | uniq -c
cut -d, -f2 orders.csv | sort | uniq -c
```

```text
      1 pen
      1 ink
      1 pad
      2 pen
      1 ink
      1 pad
      3 pen
```

Without `sort`, the first `pen` is separated from the other two and is counted on its own.
`sort -u` sorts and keeps one line of each kind in a single step, which is enough when you do not
need the counts.

## Columns: `cut` and `paste`

`cut` prints selected parts of every line. `-d` sets the delimiter (the default is a tab) and `-f`
lists the fields: `-f2`, `-f1,3` or a range such as `-f2-`. `-c` selects characters by position
instead. Fields always come out in their original order, so `-f3,1` prints field 1 first. A line
that contains no delimiter at all is printed whole unless you add `-s`.

`paste` does the opposite: it joins the lines of several files side by side, separated by tabs or
by the characters given with `-d`. With `-s` it joins all the lines of one file into a single line.

```bash
cut -d, -f1,3 orders.csv | head -2
printf 'ada\nbo\n' > names.txt
printf 'Lisbon\nOslo\n' > cities.txt
paste -d: names.txt cities.txt
cut -d, -f3 orders.csv | paste -sd+
cut -d, -f3 orders.csv | paste -sd+ | bc
```

```text
ada,3
bo,12
ada:Lisbon
bo:Oslo
3+12+1+25+3
44
```

The last line uses `bc`, a calculator that reads arithmetic from its input, to total a column.

## Characters: `tr`

`tr` (translate) reads standard input only, never a file name, and replaces characters from a
first set with the matching characters of a second set. Sets can be ranges such as `a-z` or
classes such as `[:upper:]`. `-d` deletes the characters of a set, `-s` squeezes a run of one
repeated character down to one, and `-c` uses every character *not* in the set.

```bash
echo 'Hello, World' | tr '[:lower:]' '[:upper:]'
echo 'a   lot    of   spaces' | tr -s ' '
echo 'phone: 555-0142' | tr -cd '0-9\n'
tr ',' '\t' < orders.csv | head -1
printf 'a\tb\r\n' | od -c
```

```text
HELLO, WORLD
a lot of spaces
5550142
ada	pen	3
0000000   a  \t   b  \r  \n
0000005
```

The last command uses `od -c`, which shows every character of its input, including invisible ones.
Files saved on Windows end each line with a **carriage return** (`\r`) before the newline; it
shows up only in a dump like this, and `tr -d '\r'` removes it.

## Numbering lines with `nl`

`nl` prints a file with line numbers. By default it numbers only non-empty lines; `-ba` numbers
all of them, `-w` sets the width of the number and `-s` the text after it.

```bash
printf 'first\n\nthird\n' > notes.txt
nl -ba -w2 -s'. ' notes.txt
```

```text
 1. first
 2. 
 3. third
```

## Building a pipeline

Put together, the filters answer questions no single command can. Which words occur most often in
a text?

```bash
printf 'The cat sat. The cat ran!\nA dog sat; the dog slept.\n' > poem.txt
tr -cs '[:alpha:]' '\n' < poem.txt | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -rn | head -3
```

```text
      3 the
      2 sat
      2 dog
```

Read it one stage at a time: turn every run of non-letters into a single newline (one word per
line), lower-case everything, sort so equal words meet, count them, sort the counts from largest,
keep three. To build a pipeline of your own, add one stage at a time and look at the output
before adding the next.

## Common mistakes

- **`uniq` without `sort`.** Repeated lines that are not next to each other are counted
  separately.
- **A key without an end.** `-k2` runs to the end of the line; write `-k2,2`.
- **Forgetting `-n`.** Numbers sorted as text put `100` before `9`.
- **Expecting `cut` to treat several spaces as one.** Every single space is a delimiter, so
  `a  b` has an empty second field. Squeeze first with `tr -s ' '`, or use `awk` (lesson 4).
- **Giving `tr` a file name.** It reads only standard input: `tr a-z A-Z < file`.

## Practice

1. List each product in `orders.csv` with the number of orders for it, most frequent first.
2. Print `orders.csv` sorted by quantity, largest first, with tabs instead of commas.
3. Why does `cut -d, -f2 orders.csv | uniq | wc -l` print `4` and not `3`?

### Answers

1. `cut -d, -f2 orders.csv | sort | uniq -c | sort -rn` prints `3 pen`, `1 pad`, `1 ink`. The
   two products with one order tie, and `-r` reverses the whole-line comparison that breaks the
   tie too. `sort -k1,1nr -k2` reverses only the count, giving `3 pen`, `1 ink`, `1 pad`.
2. `sort -t, -k3,3nr orders.csv | tr ',' '\t'`. Sort while the commas are still there to separate
   the fields, then translate.
3. The products arrive as `pen ink pad pen pen`. `uniq` merges only the last two, which are
   neighbours, leaving four lines. Sort first and it prints three.

## Key takeaways

- A filter reads lines, changes them in one way and writes them out; pipes chain filters.
- `sort` compares text unless told otherwise: `-n` for numbers, `-t` and `-k F,F` for fields.
- `uniq` only sees neighbouring lines, so it nearly always follows `sort`.
- `cut` and `paste` take columns apart and put them together; `tr` changes single characters.

## Further reading

- [sort(1) manual page](https://man7.org/linux/man-pages/man1/sort.1.html)
- [uniq(1) manual page](https://man7.org/linux/man-pages/man1/uniq.1.html)
- [cut(1) manual page](https://man7.org/linux/man-pages/man1/cut.1.html)
- [tr(1) manual page](https://man7.org/linux/man-pages/man1/tr.1.html)
