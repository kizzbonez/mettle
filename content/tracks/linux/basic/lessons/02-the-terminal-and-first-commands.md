---
title: The Terminal and First Commands
summary: Read the prompt, run commands with options and arguments, understand when and why a command fails, and use history, completion and editing keys to work quickly.
minutes: 25
objectives:
  - Identify the user, host and working directory in a Bash prompt
  - Split a command line into the command name, its options and its arguments
  - Read a "command not found" or "invalid option" error and check a command's exit status
  - Recall, complete and edit commands with history, Tab and the editing keys
---

## Outline

1. The prompt
2. The shape of a command
3. First commands: `echo`, `date`, `whoami`
4. When a command fails
5. Several commands on one line
6. History
7. Tab completion and editing keys
8. Clearing the screen and leaving

## The prompt

Open a terminal and the shell greets you with a **prompt**, its sign that it is waiting for a
command. On a default Debian or Ubuntu system it looks like this:

```text
dana@pc1:~$
```

It reads: user `dana`, on the computer (*host*) called `pc1`, currently in the directory `~`,
which is shorthand for your **home directory**, your own folder for files. The last character
matters: `$` means an ordinary user, `#` means the administrator, `root`. Prompts are
configurable, so yours may look different.

In this course the commands you type appear in `bash` blocks, without the prompt, and what the
shell printed appears in the `text` block underneath.

## The shape of a command

A command line is split into **words** at spaces. The first word is the **command name**; the
rest are handed to that command.

- **Options** (also called *flags*) change how the command behaves. A short option is a dash
  and a letter (`-u`); a long option is two dashes and a word (`--utc`). Several short options
  can often be joined: `-l -a` and `-la` mean the same.
- **Arguments** say what to work on: a file name, a piece of text, a date format.

Upper and lower case are different everywhere in the shell: `date` works, `Date` does not.

## First commands: `echo`, `date`, `whoami`

`echo` prints its arguments, separated by single spaces.

```bash
echo Hello from the shell
echo   lots    of     space
```

```text
Hello from the shell
lots of space
```

The second line shows the word splitting described above: the shell split the line into
three words and threw the extra spaces away before `echo` ever saw them. Lesson 7 shows how
quoting keeps spaces.

`date` prints the date and time. The option `-u` shows Coordinated Universal Time (UTC), and an
argument beginning with `+` is a format, in which `%Y`, `%m` and `%d` stand for year, month
and day. `whoami` prints the name of the user you are logged in as.

```bash
date
date +%Y-%m-%d
whoami
```

```text
Wed Oct 14 11:04:59 UTC 2026
2026-10-14
dana
```

## When a command fails

Mistakes are normal, and the shell's messages tell you exactly what went wrong if you read
them from left to right.

```bash
dtae
date -x
```

```text
bash: dtae: command not found
date: invalid option -- 'x'
Try 'date --help' for more information.
```

- `bash: dtae: command not found` comes from the shell itself (`bash:`). It found no program
  called `dtae`, usually a typing mistake. Some distributions add a suggestion below it.
- `date: invalid option -- 'x'` comes from `date`, which did start but rejected the option.
  The second line tells you where to look.

Every command finishes with an **exit status**, a number the shell keeps in the special
value `$?` until the next command runs. Zero means success; anything else means failure. The
shell uses 127 for "command not found", and most commands use 1 or 2 for their own errors.

```bash
whoami
echo $?
dtae
echo $?
```

```text
dana
0
bash: dtae: command not found
127
```

## Several commands on one line

Three separators join commands on one line:

- `;` runs the commands one after the other, whatever happens.
- `&&` runs the second command only if the first **succeeded** (exit status 0).
- `||` runs the second command only if the first **failed**.

```bash
whoami; date +%H:%M
whoami && echo "it worked"
dtae || echo "that failed"
```

```text
dana
11:04
dana
it worked
bash: dtae: command not found
that failed
```

`&&` is the one you will use most: it stops a sequence at the first failure.

## History

Bash remembers the commands you type. The **Up** and **Down** arrow keys step through them, so
correcting a long command means pressing Up, fixing it and pressing Enter. The `history` command
lists them with numbers, and `history 2` shows only the last two:

```bash
history
```

```text
    1  echo first
    2  date +%A
    3  whoami
    4  history
```

`!3` runs entry 3 again, and **Ctrl+R** searches backwards as you type a fragment (press
Ctrl+R again for older matches, Enter to run, Ctrl+G to give up). When an interactive shell
exits, the list is saved in the file `~/.bash_history`, so it survives a logout.

## Tab completion and editing keys

Press **Tab** after the first few letters of a command or file name and Bash completes it. If
several names fit, it completes as far as it can; press Tab a second time to list the choices.
Tab saves typing, and it also prevents typing mistakes: if Tab completes nothing, the name you
are typing does not exist.

| Keys | Effect |
| --- | --- |
| Ctrl+A / Ctrl+E | Jump to the start / end of the line |
| Ctrl+C | Abandon the line, or interrupt a running command |
| Ctrl+L | Clear the screen, keeping the current line |
| Ctrl+D | On an empty line: end of input, which closes the shell |

## Clearing the screen and leaving

`clear` (or Ctrl+L) wipes the terminal window; it does not undo anything. `exit` ends the
shell, and closing the last shell closes its terminal window or ends a remote session. If a
command seems stuck, it is usually still running or waiting for input: press Ctrl+C.

## Common mistakes

- **Typing the prompt.** Copying `dana@pc1:~$ date` from a page into a terminal makes the shell
  look for a command called `dana@pc1:~$`. Type only the command.
- **Wrong case.** `Date` and `ECHO` are "command not found". Commands are almost always lower
  case.
- **Forgetting the space between a command and its option.** `date-u` is one word, so the
  shell looks for a command named `date-u`.
- **Ignoring the error and repeating the command.** The first line of the error names the
  program that complained and why. Read it before trying again.
- **Using `;` when the second command depends on the first.** With `;` the second command runs
  even after a failure. Use `&&`.

## Practice

1. In `date -u +%H:%M`, which word is the command name, which is an option and which is an
   argument? What does it print?
2. What do these lines print, and why?

```bash
whoaim && echo done
echo $?
```

3. You typed a long command yesterday that contained the word `backup`. How do you find and
   run it again without retyping it?

### Answers

**1.** `date` is the command name, `-u` is an option (use UTC) and `+%H:%M` is an argument (the
format). It prints the current UTC time as hours and minutes, for example `11:04`.

**2.** The shell prints `bash: whoaim: command not found`. Because the first command failed,
`&&` skips `echo done`. The second line prints `127`, the exit status of the failed lookup,
because `echo $?` reports on the command before it.

**3.** Press Ctrl+R and type `backup`. Bash shows the most recent matching command; press
Ctrl+R again for older ones and Enter to run it. `history` followed by `!` and the entry number
works too.

## Key takeaways

- The prompt shows user, host and working directory; `$` is an ordinary user, `#` is root.
- A command line is a command name followed by options and arguments, separated by spaces.
- Error messages name the program that complained; exit status 0 means success.
- `&&` continues only after success; Up, Ctrl+R and Tab save most of your typing.

## Further reading

- [Bash manual page: READLINE and HISTORY sections (man7.org)](https://man7.org/linux/man-pages/man1/bash.1.html)
- [date(1) manual page](https://man7.org/linux/man-pages/man1/date.1.html)
- [LinuxCommand.org: What is "the shell"?](https://linuxcommand.org/lc3_lts0010.php)
