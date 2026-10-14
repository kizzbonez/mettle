---
title: Wildcards and Quoting
summary: How the shell rewrites a command line before running it, with wildcards and brace expansion, and how single quotes, double quotes and the backslash control that, so names with spaces work.
minutes: 30
objectives:
  - Predict which file names `*`, `?` and `[...]` match, including when nothing matches
  - Generate lists of names with brace expansion, such as `{a,b}` and `{1..5}`
  - Choose between single quotes, double quotes and a backslash to protect special characters
  - Work with file names that contain spaces without errors
---

## Outline

1. The shell rewrites the line first
2. `*` and `?`
3. Brackets: `[...]`
4. When nothing matches, and hidden files
5. Brace expansion
6. Why quoting matters
7. Single quotes
8. Double quotes
9. The backslash

## The shell rewrites the line first

Before a command runs, the shell **expands** the line: it replaces patterns with the file names
they match, `~` with your home directory, `$NAME` with a variable's value, and so on. Only then
does it split the result into words and start the command. The command never sees your `*`; it
sees the list of names. `echo` simply prints its arguments, so it is the perfect tool for
seeing what an expansion produces before you hand it to `rm`.

The examples run in a directory containing these files (in a terminal, `ls` puts quotes around
a name with a space; the quotes are not part of the name):

```bash
ls
```

```text
'meeting notes.txt'   photo.JPG      report-10.txt   report-A.txt
 notes.txt            report-1.txt   report-2.txt    summary.md
```

## `*` and `?`

Matching file names with patterns is called **globbing**, and the patterns are **wildcards**.

- `*` matches any run of characters, including none.
- `?` matches exactly one character.

```bash
echo *.txt
echo report-?.txt
```

```text
meeting notes.txt notes.txt report-1.txt report-10.txt report-2.txt report-A.txt
report-1.txt report-2.txt report-A.txt
```

`report-10.txt` does not match `report-?.txt`, because `10` is two characters. Patterns are
case-sensitive like everything else: `*.jpg` does not match `photo.JPG`.

## Brackets: `[...]`

Square brackets match **one** character from a set:

| Pattern | Matches one character that is |
| --- | --- |
| `[12]` | `1` or `2` |
| `[0-9]` | any digit (a range) |
| `[a-z]` | a lower-case letter |
| `[!1]` or `[^1]` | anything except `1` |

```bash
echo report-[12].txt
echo report-[!1].txt
echo report-[0-9]*.txt
```

```text
report-1.txt report-2.txt
report-2.txt report-A.txt
report-1.txt report-10.txt report-2.txt
```

The last pattern means "a digit, then anything", which is how you include `report-10.txt`.

## When nothing matches, and hidden files

If a pattern matches nothing, Bash leaves it **unchanged** and passes it on, so the command
receives a literal `*.jpg` and complains about a file of that name:

```bash
echo *.jpg
ls *.jpg
```

```text
*.jpg
ls: cannot access '*.jpg': No such file or directory
```

Wildcards also skip **hidden files**: a leading dot must be typed. `*` does not match
`.hidden.txt`, but `.*` does.

## Brace expansion

Braces are not a pattern: they **generate** words whether or not files exist.

- `{a,b,c}` produces one word per item: `{draft,final}.txt` gives `draft.txt final.txt`.
- `{1..5}` produces a sequence; `{a..e}` works for letters, `{08..11}` keeps the zero padding,
  and `{10..0..5}` counts in steps of 5.

```bash
echo photo-{1..3}.jpg
echo {08..11}
mkdir -p trip/{day1,day2}/{photos,notes}
ls trip/day1
```

```text
photo-1.jpg photo-2.jpg photo-3.jpg
08 09 10 11
notes  photos
```

Two sets of braces combine every item with every other, so one `mkdir` made four directories.
Braces are expanded first, before wildcards, and there must be no spaces inside them.

## Why quoting matters

The shell splits a line into words at spaces, and gives special meaning to characters such as
`*`, `?`, `$`, `~`, `{`, `;`, `&`, `|`, `<`, `>`, quotes and the backslash. A file name with a
space therefore becomes two arguments:

```bash
cat meeting notes.txt
```

```text
cat: meeting: No such file or directory
Remember the milk
```

`cat` received two names. `meeting` does not exist, and `notes.txt` is a **different** file that
happens to exist, so you get a misleading mixture. With `rm` the same mistake deletes the wrong
file. **Quoting** removes special meaning so that the shell treats characters as ordinary text.

## Single quotes

Everything between single quotes is literal: no expansion of any kind, and spaces stay inside
one word.

```bash
cat 'meeting notes.txt'
echo 'Home is $HOME'
echo 'Say "hi"'
```

```text
Agenda: budget
Home is $HOME
Say "hi"
```

The one character a single-quoted string cannot contain is a single quote.

## Double quotes

Double quotes also keep spaces and stop wildcards, braces and `~`, but they still allow `$`
(variables, and `$( )`, which runs a command and inserts its output) and the backquote. A
backslash inside them escapes `$`, `` ` ``, `"` and `\`.

```bash
echo "Home is $HOME"
echo "Today is $(date +%A)"
echo "Price: \$5 for *.txt"
echo "It's fine"
```

```text
Home is /home/dana
Today is Wednesday
Price: $5 for *.txt
It's fine
```

Rule of thumb: use **double quotes** around anything that contains a variable or a file name,
and **single quotes** when you want exactly what you typed. Quotes are removed before the
command runs, which is why `echo` does not print them.

## The backslash

A backslash outside quotes protects the single next character: `meeting\ notes.txt` is one
word, and `\$5` is a literal dollar sign. Tab completion uses this style when it completes a
name with a space. A backslash at the very end of a line joins it to the next one.

If you open a quote and press Enter without closing it, the shell shows a `>` prompt: it is
waiting for the closing quote. Type it, or press Ctrl+C to abandon the line.

## Common mistakes

- **Unquoted names with spaces.** Quote them: `cat "meeting notes.txt"`.
- **Quoting a wildcard you wanted expanded.** `ls "*.txt"` asks for a file literally called
  `*.txt`: `ls: cannot access '*.txt': No such file or directory`.
- **Single quotes around a variable.** `'$HOME'` stays `$HOME`. Use double quotes.
- **Testing a destructive pattern on `rm` first.** Run `echo PATTERN` or `ls PATTERN` and read
  the list, then reuse the line with `rm`.
- **Spaces in braces.** `{a, b}` is not expanded; write `{a,b}`.

## Practice

1. In the example directory, what does `echo report-*` print? And `echo report-?0.txt`?
2. Create the files `log-01.txt` to `log-05.txt` with one command.
3. What does each line print?

```bash
echo '$USER is "me"'
echo "$USER is 'me'"
echo \$USER
```

### Answers

**1.** `report-1.txt report-10.txt report-2.txt report-A.txt`, then `report-10.txt`: `?`
matches the `1` and the `0` is literal.

**2.** `touch log-{01..05}.txt`. The leading zero in `01` makes every number two digits.

**3.**

```text
$USER is "me"
dana is 'me'
$USER
```

Single quotes keep everything; double quotes expand `$USER` and keep the single quotes as text;
the backslash protects the `$`.

## Key takeaways

- The shell expands wildcards, braces, `~` and `$` before the command runs; `echo` shows the
  result.
- `*` is any run of characters, `?` one character, `[...]` one character from a set; no match
  leaves the pattern as it is, and hidden files need an explicit dot.
- Braces generate words: `{a,b}`, `{1..5}`.
- Single quotes are fully literal; double quotes allow `$`; a backslash protects one character.

## Further reading

- [Bash manual page: QUOTING and EXPANSION (man7.org)](https://man7.org/linux/man-pages/man1/bash.1.html)
- [glob(7): globbing pathnames](https://man7.org/linux/man-pages/man7/glob.7.html)
- [LinuxCommand.org: Expansion](https://linuxcommand.org/lc3_lts0080.php)
