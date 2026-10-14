---
title: Redirection and Pipes
summary: Every command has standard input, standard output and standard error; redirect them to and from files, discard them with /dev/null, connect commands with pipes and keep a copy with tee.
minutes: 30
objectives:
  - Name the three standard streams and their numbers
  - Send output and errors to files with `>`, `>>`, `2>` and `&>`, and read input from a file with `<`
  - Explain why the order of `> file 2>&1` matters and why `sort f > f` empties `f`
  - Build pipelines with `|` and save an intermediate result with `tee`
---

## Outline

1. Three standard streams
2. Output to a file: `>` and `>>`
3. Errors to a file: `2>`
4. Both into one file: `&>` and `2>&1`
5. Throwing output away: `/dev/null`
6. Input from a file: `<`
7. Pipes
8. Saving and watching: `tee`

## Three standard streams

Every program starts with three open channels, called **streams**, each with a number, its
*file descriptor*:

| Number | Name | Normally connected to |
| --- | --- | --- |
| 0 | standard input (*stdin*) | the keyboard |
| 1 | standard output (*stdout*) | the terminal |
| 2 | standard error (*stderr*) | the terminal |

Programs write results to stdout and complaints to stderr. Both appear in the same window, so
they look alike, but they are separate, and the shell can send each one somewhere else. This
is **redirection**, and the program does not need to know: the shell sets up the streams
before the program starts.

```bash
ls /etc/hostname /nowhere
```

```text
ls: cannot access '/nowhere': No such file or directory
/etc/hostname
```

The first line went to stderr, the second to stdout.

## Output to a file: `>` and `>>`

`> FILE` sends stdout to a file. The file is created if missing and **emptied first** if it
exists. `>> FILE` appends to the end instead.

```bash
echo "started" > run.log
echo "finished" >> run.log
cat run.log
echo "oops" > run.log
cat run.log
```

```text
started
finished
oops
```

The last `>` wiped both earlier lines. Only stdout is redirected, so errors still reach the
screen:

```bash
ls /etc/hostname /nowhere > out.txt
cat out.txt
```

```text
ls: cannot access '/nowhere': No such file or directory
/etc/hostname
```

The error appeared on the terminal at once; the file holds only the normal output.

## Errors to a file: `2>`

Put the stream number in front: `2> FILE` redirects stderr (and `2>> FILE` appends).

```bash
ls /etc/hostname /nowhere 2> errors.txt
cat errors.txt
```

```text
/etc/hostname
ls: cannot access '/nowhere': No such file or directory
```

This time the normal output reached the screen and the error went to the file. `>` on its own
is short for `1>`.

## Both into one file: `&>` and `2>&1`

`&> FILE` sends both streams to one file (`&>> FILE` appends). The older, portable spelling is
`> FILE 2>&1`, read as "stdout to the file, then stderr to wherever stdout now goes". The
shell processes redirections **from left to right**, so the order matters:

```bash
ls /etc/hostname /nowhere > all.txt 2>&1
ls /etc/hostname /nowhere 2>&1 > only-out.txt
```

```text
ls: cannot access '/nowhere': No such file or directory
```

The first command printed nothing: both streams went into `all.txt`. In the second, stderr was
pointed at the terminal (where stdout was at that moment) before stdout moved to the file, so
the error still appeared.

## Throwing output away: `/dev/null`

`/dev/null` is a special file that accepts anything and keeps nothing. Reading it gives
immediate end of input. It is the place for output you do not want:

```bash
ls /etc/hostname /nowhere 2> /dev/null
```

```text
/etc/hostname
```

Hide errors only when you know what they are. A silenced error is still an error.

## Input from a file: `<`

`< FILE` connects a file to stdin, as if you typed its contents. Many commands accept a file
name *or* read stdin, and the difference shows:

```bash
wc -l names.txt
wc -l < names.txt
```

```text
4 names.txt
4
```

With `<`, `wc` never learns the name, so it prints only the number, which is handy when you want
just the number.

## Pipes

A **pipe**, `|`, connects the stdout of one command to the stdin of the next. No temporary
file is involved: both commands run at the same time and the data flows between them. A chain
of commands joined by pipes is a **pipeline**. Programs that read stdin, transform it and
write stdout are called **filters**; `sort` (sort lines), `head`, `tail` and `wc` are all
filters.

```bash
ls /usr/bin | wc -l
sort names.txt | head -n 2
ls /usr/bin | head -n 3
```

```text
379
Amir
Bea
[
addpart
apropos
```

The first counts the commands installed in `/usr/bin` on this machine. The second sorts four
names and keeps the first two. The third shows that `ls` writes one name per line when its
output is not a terminal, which is what makes counting with `wc -l` work. Only stdout goes down
a pipe; errors still reach the screen unless you add `2>&1` before the `|`.

## Saving and watching: `tee`

`tee FILE` copies its stdin to the file **and** to stdout, like a T-junction in a pipe. Use it
to keep a copy of what a pipeline produced while still seeing it, or passing it on:

```bash
date | tee stamp.txt
ls /usr/bin | tee commands.txt | wc -l
head -n 2 commands.txt
```

```text
Wed Oct 14 11:16:25 UTC 2026
379
[
addpart
```

`tee -a FILE` appends instead of overwriting.

## Common mistakes

- **Redirecting a file onto itself.** `sort names.txt > names.txt` empties `names.txt`: the
  shell truncates the output file before `sort` starts reading. Write to a new file, then
  `mv` it over the old one.
- **Using `>` when you meant `>>`.** The file is emptied with no warning. `set -o noclobber`
  makes `>` refuse to overwrite an existing file (`>|` overrides it).
- **Writing `2>&1 > file`.** Errors still go to the screen. The file comes first: `> file 2>&1`.
- **Expecting errors to go down a pipe.** `|` carries stdout only.
- **Feeding a file to `cat` just to pipe it.** `cat file | wc -l` works, but `wc -l file` or
  `wc -l < file` does the same with one program fewer.

## Practice

1. Save the list of files in `/etc` into `etc-list.txt`, and throw away any error messages.
2. Write a command that runs `ls /etc /nowhere` and puts both the output and the errors into
   `report.txt`, appending to what is already there.
3. Print how many entries `/usr/share` contains, and keep the full list in `share.txt`, in one
   pipeline.

### Answers

**1.** `ls /etc > etc-list.txt 2> /dev/null`

**2.** `ls /etc /nowhere >> report.txt 2>&1`, or `ls /etc /nowhere &>> report.txt`.

**3.** `ls /usr/share | tee share.txt | wc -l`

## Key takeaways

- Streams: 0 stdin, 1 stdout, 2 stderr; redirection is set up by the shell, left to right.
- `>` creates or empties, `>>` appends, `2>` redirects errors, `&>` or `> f 2>&1` both.
- `< file` feeds a file to stdin; `/dev/null` discards.
- `|` joins stdout to the next stdin; `tee` saves a copy on the way.

## Further reading

- [Bash manual page: REDIRECTION (man7.org)](https://man7.org/linux/man-pages/man1/bash.1.html)
- [tee(1)](https://man7.org/linux/man-pages/man1/tee.1.html)
- [LinuxCommand.org: I/O Redirection](https://linuxcommand.org/lc3_lts0070.php)
