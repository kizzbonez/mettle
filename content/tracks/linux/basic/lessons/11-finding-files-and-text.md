---
title: Finding Files and Text
summary: Search inside files with grep and its everyday options, search the directory tree with find by name, type, size and age, and find where a command lives with which, type and locate.
minutes: 30
objectives:
  - Search files for a word with `grep`, using `-i`, `-v`, `-n`, `-c`, `-r`, `-l` and `-w`, and read its exit status
  - Find files with `find` by name, type, size and modification time, quoting the pattern correctly
  - Run a command on every file `find` matches with `-exec`
  - Locate a command's program file with `which` and `type`, and explain what `locate` searches
---

## Outline

1. Searching inside files: `grep`
2. Everyday `grep` options
3. Searching many files, and exit status
4. Searching for files: `find`
5. Testing name, type, size and age
6. Acting on what `find` finds
7. Where is that command? `which`, `type`, `whereis`
8. `locate`

## Searching inside files: `grep`

`grep PATTERN FILE...` prints every **line** of the files that contains the pattern. The
examples use a small project, `shop`, which contains this log:

```text
Error: payment failed for order 1042
Order 1043 shipped
error: address missing for order 1044
Order 1045 shipped
```

```bash
grep order logs/orders.log
```

```text
Error: payment failed for order 1042
error: address missing for order 1044
```

Only two lines matched: `Order` with a capital O is a different string. Quote the pattern
whenever it contains spaces or special characters: `grep 'order 1042' logs/orders.log`.

The pattern is a **regular expression**, a small language for describing text that a later
level teaches. For now treat it as plain text, but know that a few characters are special:
`.` matches any one character, so `grep 1.4` matches `1042` and `1043` alike. When you mean
the text exactly, `grep -F` (fixed strings) turns all special meanings off.

## Everyday `grep` options

| Option | Effect |
| --- | --- |
| `-i` | Ignore case: `error` also matches `Error` |
| `-v` | Invert: print the lines that do **not** match |
| `-n` | Number each line printed |
| `-c` | Print only how many lines match |
| `-w` | Match whole words only: `port` but not `airport` |
| `-r` | Search every file under a directory |
| `-l` | Print only the names of files that contain a match |

```bash
grep -i error logs/orders.log
grep -v shipped logs/orders.log
grep -c shipped logs/orders.log
grep -n port config.ini
```

```text
Error: payment failed for order 1042
error: address missing for order 1044
Error: payment failed for order 1042
error: address missing for order 1044
2
2:port=5432
```

`grep` is also a filter: with no file name it reads stdin, so it fits in pipelines.
`ls /usr/bin | grep zip` lists the commands with `zip` in their names.

## Searching many files, and exit status

```bash
grep -r TODO .
grep -rl TODO .
```

```text
./src/old/cart.py:TODO: tidy up
./src/checkout.py:TODO: add discount codes
./docs/README.md:See TODO list.
./src/old/cart.py
./src/checkout.py
./docs/README.md
```

With more than one file, each line is prefixed with the file name. `grep` reports what it found
in its exit status: **0** if a line matched, **1** if nothing matched, **2** if there was an
error such as a missing file.

```bash
grep refund logs/orders.log; echo "status $?"
grep refund nofile.log; echo "status $?"
```

```text
status 1
grep: nofile.log: No such file or directory
status 2
```

No match prints nothing at all, which is why the status matters: `grep -q` prints nothing even
on a match, and `grep -q TODO notes.txt && echo "work left"` uses only the status.

## Searching for files: `find`

`find` walks a directory tree and prints every entry that passes its **tests**:

```text
find STARTING-POINT... TESTS
```

With no starting point it uses `.`, and with no tests it prints everything. The most used test
is `-name PATTERN`, which compares the **name** (not the path) with a wildcard pattern. Always
**quote** the pattern, so that `find`, not the shell, expands it:

```bash
find . -name '*.py'
```

```text
./src/old/cart.py
./src/checkout.py
```

Without quotes the shell expands `*.py` first. If the current directory contains `top.py`,
`find` receives `-name top.py` and finds only that file; with two matching names it fails with
`find: paths must precede expression`, and its second line even suggests the cause: a
"possible unquoted pattern" after `-name`. `-iname` ignores case.

## Testing name, type, size and age

| Test | Matches |
| --- | --- |
| `-type f`, `-type d`, `-type l` | Regular files, directories, symbolic links |
| `-size +1M`, `-size +100k` | Larger than 1 MiB, larger than 100 KiB (`c` counts bytes) |
| `-mtime -7`, `-mtime +30` | Modified less than 7 days ago, at least 31 days ago (whole days count) |
| `-maxdepth 1` | Do not descend below the starting point |

Several tests together must **all** be true:

```bash
find . -type f -size +1M
find . -type f -mtime -7
find . -maxdepth 1 -type f
```

```text
./logs/big.log
./src/checkout.py
./logs/orders.log
./logs/big.log
./config.ini
```

`find` reports each directory it may not read, which floods the screen when you search from
`/`. Add `2> /dev/null` once you know those are the only errors.

## Acting on what `find` finds

`-exec COMMAND {} \;` runs a command once per match, with `{}` replaced by the path. The `\;`
(a quoted semicolon) ends the command. Ending with `+` instead passes many paths to one run:

```bash
find . -name '*.py' -exec wc -l {} +
```

```text
 1 ./src/old/cart.py
 2 ./src/checkout.py
 3 total
```

`-delete` removes every match. Run the same `find` **without** `-delete` first and read the
list, because a mistake in the tests deletes the wrong files, with no undo.

## Where is that command? `which`, `type`, `whereis`

`which NAME` searches the directories in which the shell looks for programs (the `PATH`, lesson
13) and prints the first program file of that name. It knows nothing of builtins or aliases,
which `type` does:

```bash
which ls grep cd
type -a ls
whereis ls
```

```text
/usr/bin/ls
/usr/bin/grep
ls is /usr/bin/ls
ls is /bin/ls
ls: /usr/bin/ls /usr/share/man/man1/ls.1.gz
```

`which` printed nothing for `cd`, a builtin. `whereis` also finds the manual page.

## `locate`

`locate NAME` prints every path on the system containing `NAME`, almost instantly, because it
searches a **database** rather than the disk. The database is rebuilt by `updatedb`, usually
once a day, so a file created since then is missing from the results and a deleted one may
still appear. On many systems the command is provided by the `plocate` package and may need
installing; `find` is always there and always current.

## Common mistakes

- **Unquoted `find` patterns.** `find . -name *.py` lets the shell expand the pattern first.
  Write `'*.py'`.
- **Forgetting that `grep` is case-sensitive.** Add `-i` when case should not matter.
- **Reading "no output" as failure.** Check `$?`: 1 means "searched, found nothing".
- **Taking a special character literally.** `.` and `*` mean something to `grep`; use `-F` for
  exact text.
- **Running `find ... -delete` untested.** Print the list first.

## Practice

1. Show the lines of `config.ini` that are not comments (comments start with `#`), with line
   numbers.
2. Find every directory under your home directory called `node_modules`.
3. Find the regular files under `/var/log` that were modified within the last day, hiding
   permission errors.

### Answers

**1.** `grep -vn '^#' config.ini`. `^` means "at the start of the line", a first taste of
regular expressions; `grep -vn '#' config.ini` would also drop lines with a `#` later on.

**2.** `find ~ -type d -name node_modules`

**3.** `find /var/log -type f -mtime -1 2> /dev/null`

## Key takeaways

- `grep` prints matching lines; `-i`, `-v`, `-n`, `-c`, `-w`, `-r` and `-l` cover daily use.
- `grep` exits 0 for a match, 1 for none, 2 for an error.
- `find START -name 'PATTERN' -type f -size +1M -mtime -7` combines tests; `-exec` acts on them.
- `which` finds program files, `type` also knows builtins, `locate` searches a daily database.

## Further reading

- [grep(1)](https://man7.org/linux/man-pages/man1/grep.1.html)
- [find(1)](https://man7.org/linux/man-pages/man1/find.1.html)
- [LinuxCommand.org: A Guided Tour](https://linuxcommand.org/lc3_lts0040.php)
