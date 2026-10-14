---
title: Viewing Files
summary: Look inside files without an editor, using cat for short files, less for long ones, head and tail for the beginning and end, tail -f for growing logs, wc for counts and file to identify content.
minutes: 25
objectives:
  - Choose between `cat` and `less` for a file, and move around and search in `less`
  - Show the first or last N lines of a file with `head` and `tail`, and follow a growing log with `tail -f`
  - Count the lines, words and bytes of files with `wc`
  - Identify what a file contains with `file`, whatever its name says
---

## Outline

1. Text files and binary files
2. `cat`: print and join files
3. `less`: read long files
4. `head` and `tail`: the beginning and the end
5. Following a growing file: `tail -f`
6. Counting: `wc`
7. What is this file? `file`

## Text files and binary files

A **text file** contains characters arranged in **lines**, each ending with an invisible
*newline* character. Configuration files, logs, scripts and notes are text, which is why the
commands in this lesson are so useful on Linux. A **binary file**, such as a program or a
picture, contains bytes that are not meant to be read as characters. Printing one to the
terminal shows gibberish and can leave the terminal in a strange state; the command `reset`
repairs it.

## `cat`: print and join files

`cat` (from *concatenate*) prints the files you name, one after another, with nothing in
between:

```bash
cat todo.txt
cat todo.txt later.txt
cat -n todo.txt
```

```text
Buy milk
Call the plumber
Buy milk
Call the plumber
Water the plants
     1	Buy milk
     2	Call the plumber
```

`-n` numbers the lines. `cat` suits short files; a long one scrolls past faster than you can
read it. Two errors are common:

```bash
cat missing.txt
cat pics
```

```text
cat: missing.txt: No such file or directory
cat: pics: Is a directory
```

If you run `cat` with **no** file name, it waits to read from the keyboard and seems to hang.
Press Ctrl+D (end of input) or Ctrl+C to get the prompt back.

## `less`: read long files

`less FILE` shows a file one screen at a time without loading all of it, so it opens even a huge
log instantly. It uses the keys you met with manual pages: Space and `b` page forward and back,
`g` and `G` jump to the start and end, `/word` searches forward, `?word` searches backward, `n`
and `N` repeat the search and `q` quits. `less -N FILE` numbers the lines, and `less -S FILE`
cuts long lines at the screen edge instead of wrapping them, which helps with wide logs.

`less` only reads: you cannot damage a file by viewing it. That makes it the right first tool
for any file you do not know.

## `head` and `tail`: the beginning and the end

`head` prints the first 10 lines of a file, `tail` the last 10. `-n N` changes the number. The
examples use `server.log`, a 14-line web server log.

```bash
head -n 3 server.log
tail -n 2 server.log
```

```text
2026-10-14 08:04:00 INFO request 1 served
2026-10-14 08:08:00 INFO request 2 served
2026-10-14 08:12:00 INFO request 3 served
2026-10-14 08:52:10 ERROR disk almost full
2026-10-14 08:53:00 INFO request 13 served
```

Two variants count from the other end:

- `tail -n +13 FILE` starts **at line 13** and prints to the end; a header line is skipped with
  `tail -n +2`.
- `head -n -12 FILE` prints everything **except the last 12** lines.

```bash
tail -n +13 server.log
head -n -12 server.log
```

```text
2026-10-14 08:52:10 ERROR disk almost full
2026-10-14 08:53:00 INFO request 13 served
2026-10-14 08:04:00 INFO request 1 served
2026-10-14 08:08:00 INFO request 2 served
```

Given several files, both print a `==> name <==` header before each.

## Following a growing file: `tail -f`

Logs grow while programs run. `tail -f FILE` (follow) prints the last lines and then keeps
waiting, printing every new line as it is added. It never finishes on its own; press Ctrl+C
when you have seen enough.

```bash
tail -n 1 -f server.log
```

```text
2026-10-14 08:53:00 INFO request 13 served
2026-10-14 08:55:41 INFO request 14 served
```

The first line was already there; the second appeared a moment later, when the server wrote it.
Log files are often *rotated*: renamed and replaced by a fresh file. `tail -F` follows the
**name** and reopens the new file, while `tail -f` keeps following the old, renamed one.

## Counting: `wc`

`wc` (word count) prints the number of lines, words and bytes, in that order, then the name.
A *word* is any run of characters between spaces or newlines. `-l`, `-w` and `-c` select a
single count, and several files get a `total` line:

```bash
wc server.log
wc -l server.log todo.txt
wc -w todo.txt
```

```text
 14  84 593 server.log
 14 server.log
  2 todo.txt
 16 total
5 todo.txt
```

`wc -l` counts **newline characters**, not lines as you see them. A file whose last line has no
newline at the end is one short:

```bash
cat partial.txt
wc -l partial.txt
```

```text
no newline at end
0 partial.txt
```

The file has visible text, but zero newlines. Most programs end every line properly, but files
written by hand or by Windows tools sometimes do not.

## What is this file? `file`

A name like `photo.jpg` is only a promise. `file` looks at the **content**: it checks what
kind of filesystem object it is, then compares the first bytes with known signatures (the "magic
numbers" of formats such as gzip or ELF, the Linux program format), and only then guesses at
text.

```bash
file todo.txt hello.sh mystery.jpg pics todo.txt.gz
```

```text
todo.txt:    ASCII text
hello.sh:    Bourne-Again shell script, ASCII text executable
mystery.jpg: ASCII text
pics:        directory
todo.txt.gz: gzip compressed data, was "todo.txt", last modified: Wed Oct 14 11:11:31 2026, from Unix, original size modulo 2^32 26
```

`mystery.jpg` is really text with a misleading name. Run `file` before `cat` on anything
unknown, and you will never flood your terminal with binary.

## Common mistakes

- **Using `cat` on a long or binary file.** Use `less` for long files and `file` first for
  unknown ones.
- **Typing `cat` with no file.** It waits for keyboard input. Ctrl+D or Ctrl+C ends it.
- **Expecting `tail -f` to finish.** It follows until you press Ctrl+C.
- **Trusting `wc -l` on a file without a final newline.** The last line is not counted.
- **Trusting the extension.** `.txt`, `.jpg` and `.sh` are only part of the name; `file`
  checks the content.

## Practice

1. Print lines 2 to the end of `todo.txt`, skipping the first line.
2. Which command shows the 20 most recent lines of `/var/log/syslog` and then keeps showing
   new ones as they are written?
3. `wc notes.txt` prints `3 12 70 notes.txt`. What do the three numbers mean? How many words
   does `wc -w notes.txt` report?

### Answers

**1.** `tail -n +2 todo.txt` prints from line 2 onwards, here `Call the plumber`.

**2.** `tail -n 20 -f /var/log/syslog`. Stop it with Ctrl+C. (On many systems reading that
log needs extra permission; lesson 9 explains why.)

**3.** 3 newlines (lines), 12 words, 70 bytes. `wc -w` prints `12 notes.txt`.

## Key takeaways

- `cat` prints and joins short files; `less` reads long ones safely, and `q` quits it.
- `head` and `tail` show the first and last 10 lines; `-n` changes the count, `+N` and `-N`
  count from the other end.
- `tail -f` follows a growing log until Ctrl+C.
- `wc` counts newlines, words and bytes; `file` identifies content, not names.

## Further reading

- [head(1)](https://man7.org/linux/man-pages/man1/head.1.html)
- [tail(1)](https://man7.org/linux/man-pages/man1/tail.1.html)
- [wc(1)](https://man7.org/linux/man-pages/man1/wc.1.html)
- [file(1)](https://man7.org/linux/man-pages/man1/file.1.html)
