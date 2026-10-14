---
title: Finding Files and Acting on Them
summary: Locate files by name, type, size, age and permissions with find, run commands on what it finds with -exec, -delete and xargs, and stay safe with file names that contain spaces.
minutes: 30
objectives:
  - Combine `find` tests on name, type, size, modification time and permissions, including `-o`, `!` and parentheses
  - Act on the results with `-exec ... {} \;`, `-exec ... {} +` and `-delete`, and explain the difference
  - Pass file names safely from `find` to `xargs` with `-print0` and `xargs -0`
  - Predict how `-size` and `-mtime` round their values
---

## Outline

1. How `find` works
2. Name and type
3. Size
4. Time
5. Permissions
6. Combining tests
7. Acting on what you find
8. `xargs` and awkward file names

## How `find` works

The Basic level used `find` to look for a file by name. This lesson uses all of it. `find` walks a
directory tree, visiting every file and directory below its **starting point**, and evaluates an
**expression** for each one. The expression is made of **tests**, which are true or false for a
file, and **actions**, which do something. Tests written one after another must all be true, as
if joined by "and". With no action, `find` prints the path of every file that passes.

`find` lists files in the order the directories store them, which is not alphabetical and differs
between machines, so the examples pipe the result through `sort`. They search this tree:

```bash
find site -type f | sort
```

```text
site/cache/empty.tmp
site/cache/page.tmp
site/deploy.sh
site/img/banner.png
site/img/logo.png
site/logs/access.log
site/logs/error.log
site/logs/old/access.log.1
site/my notes.txt
```

`empty.tmp` is empty, `logo.png` is 3,000 bytes and `banner.png` 200,000, `page.tmp` was last
changed three days ago and `access.log.1` ten days ago, `deploy.sh` is executable and `error.log`
can be written by everyone.

## Name and type

`-name` matches the file's own name (not its directories) against a wildcard pattern; `-iname`
ignores case. Quote the pattern, or the shell expands `*.log` in the current directory before
`find` ever sees it. `-type f` keeps regular files, `-type d` directories and `-type l` symbolic
links. `-maxdepth 1` stops `find` from going deeper than the starting point's direct contents.

```bash
find site -name '*.log' | sort
find site -maxdepth 1 -type d | sort
```

```text
site/logs/access.log
site/logs/error.log
site
site/cache
site/img
site/logs
```

`access.log.1` does not match `*.log`, because the pattern must match the whole name.

## Size

`-size` compares a file's size: `+100k` means more than 100 kibibytes, `-1M` less than one
mebibyte, and a number with no sign means exactly. The units are `c` (bytes), `k`, `M` and `G`;
with no unit, `find` counts in 512-byte blocks, so always write one.
`-empty` finds empty files and directories.

```bash
find site -type f -size +100k
find site -type f -size -1k
```

```text
site/img/banner.png
site/cache/empty.tmp
```

The second answer surprises everyone. `find` rounds each size **up** to whole units before
comparing, so a 2-byte file counts as 1k, and "less than 1k" leaves only files of size zero. Use
bytes for small limits: `-size -1024c`.

## Time

Every file records its **modification time**, when its content last changed. `-mtime n` compares
the file's age in days: `+7` means more than seven days, `-2` less than two. Here the rounding
goes the other way: the age is cut down to whole days, so a file 1.9 days old is 1 day old.
`-mmin` does the same in minutes, and `-newer ref` keeps files changed more recently than `ref`.

```bash
find site -type f -mtime +7
find site -type f -mtime +2 | sort
```

```text
site/logs/old/access.log.1
site/cache/page.tmp
site/logs/old/access.log.1
```

## Permissions

`-perm` tests permission bits, written in octal or symbolic form. `-perm 644` means exactly
`rw-r--r--`; `-perm -u=x` means "at least the owner's execute bit is set"; `-perm /g=w,o=w`
means "any of these bits is set". The `-` form is the one used most, for questions such as "which
files can everyone write to?".

```bash
find site -type f -perm -u=x
find site -type f -perm -o=w
```

```text
site/deploy.sh
site/logs/error.log
```

## Combining tests

`-o` means "or" and `!` means "not". "And" binds more tightly than `-o`, so group with
parentheses, which must be escaped as `\(` and `\)` because they are special to the shell.

```bash
find site -type f \( -name '*.tmp' -o -name '*.log' \) | sort
```

```text
site/cache/empty.tmp
site/cache/page.tmp
site/logs/access.log
site/logs/error.log
```

Without the parentheses, `-type f` would apply only to the `*.tmp` half.

## Acting on what you find

`-exec command {} \;` runs a command once per file, with `{}` replaced by the path; the `\;` ends
the command. `-exec command {} +` passes many paths to one run of the command, which is far faster
for thousands of files. `-delete` removes each file found. `find` evaluates from left to right, so
`-delete` must come **after** the tests: `find site -delete -name '*.tmp'` would delete the whole
tree before ever testing a name.

```bash
find site -name '*.png' -exec wc -c {} +
find site -name '*.tmp' -print -delete | sort
```

```text
  3000 site/img/logo.png
200000 site/img/banner.png
203000 total
site/cache/empty.tmp
site/cache/page.tmp
```

`wc` ran once with both files, hence the `total` line. Always run the command with `-print`
alone first and read the list before adding `-delete`.

## `xargs` and awkward file names

`xargs` reads words from standard input and adds them as arguments to a command: `printf 'a b\nc\n'
| xargs echo` runs `echo a b c`. That makes it a partner for any command that produces names, but
by default it splits on spaces and newlines, and a file name may contain both.

```bash
find site -name '*.txt' | xargs wc -l
find site -name '*.txt' -print0 | xargs -0 wc -l
```

```text
wc: site/my: No such file or directory
wc: notes.txt: No such file or directory
0 total
1 site/my notes.txt
```

`-print0` ends each name with a **null character**, the one byte that can never appear in a file
name, and `xargs -0` splits only on it. Use the pair every time you connect the two commands.
Other useful options: `-n 1` runs the command once per item, `-I {}` puts each item where `{}`
appears, and `-r` skips running the command when there is no input at all.

## Common mistakes

- **Unquoted patterns.** `find . -name *.log` breaks as soon as a `.log` file sits in the current
  directory.
- **`-size -1k` for "small files".** It finds only empty files; use bytes.
- **`-delete` too early.** It acts on everything that reaches it; tests go first.
- **Forgetting the parentheses around `-o`.**
- **Plain `| xargs`.** Names with spaces break apart; use `-print0 | xargs -0`.

## Practice

1. Find every regular file under `site` larger than 2k.
2. Find the files under `site` that have **not** changed in the last five days.
3. Count the lines of every `.log` file under `site`, safely, with one `wc` command.

### Answers

1. `find site -type f -size +2k` lists `banner.png` and `logo.png` (3,000 bytes rounds up to 3k).
2. `find site -type f -mtime +4` finds files at least five whole days old: `access.log.1`. Watch
   the rounding: `+5` would mean six days or more.
3. `find site -name '*.log' -print0 | xargs -0 wc -l`, or `find site -name '*.log' -exec wc -l {} +`.

## Key takeaways

- `find` tests files by name, type, size, time and permissions; tests in a row must all pass.
- Sizes round up and ages round down: check the edge of every limit.
- `-exec ... {} +` batches files; `-delete` deletes what reaches it, so it goes last.
- Between `find` and `xargs`, always use `-print0` and `-0`.

## Further reading

- [find(1) manual page](https://man7.org/linux/man-pages/man1/find.1.html)
- [xargs(1) manual page](https://man7.org/linux/man-pages/man1/xargs.1.html)
- [GNU Findutils manual](https://www.gnu.org/software/findutils/manual/html_mono/find.html)
