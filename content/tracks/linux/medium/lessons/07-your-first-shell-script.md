---
title: Your First Shell Script
summary: Save commands in a script with a shebang line, make it executable, and give it variables, command substitution, arguments and an exit status.
minutes: 30
objectives:
  - Write a script with a shebang line, make it executable and run it in three ways
  - Assign and expand variables, quote every expansion and explain what goes wrong without quotes
  - Capture a command's output with `$( )` and read arguments with `$1`, `$#` and `"$@"`
  - Read a command's exit status from `$?` and end a script with `exit n`
---

## Outline

1. What a script is
2. The shebang line
3. Running a script
4. Variables
5. Quoting variables
6. Command substitution
7. Arguments
8. Exit status

## What a script is

A **shell script** is a text file of commands that the shell runs from top to bottom, exactly as
if you had typed them. Anything you repeat, such as a backup, a report or a clean-up, is a
candidate: write the commands once, check them once, and from then on run one command that never
mistypes a step. Scripts can be written with the editors from the Basic level. A line starting
with `#` is a **comment**, ignored by the shell and written for the next person who reads the
file, very often yourself.

## The shebang line

The first line of a script names the program that should run it:

```bash
#!/bin/bash
# hello.sh: greet the world and say what day it is.
name="world"
echo "Hello, $name!"
echo "Today is $(date +%A)."
```

Saved as `hello.sh` and run with `bash hello.sh`, it prints:

```text
Hello, world!
Today is Wednesday.
```

`#!` is called the **shebang**. When you run the file as a program, the kernel reads this line and
starts `/bin/bash` with the file's name as its argument. `#!/usr/bin/env bash` is a common
alternative: `env` searches your `PATH` for `bash`, which helps on systems where Bash lives
elsewhere. Without a shebang the file may be run by a different shell, so always write one, and
name the shell whose features you use. This course writes Bash.

## Running a script

There are three ways to run `hello.sh`:

- `bash hello.sh` starts Bash and tells it to read the file. No execute permission is needed.
- `./hello.sh` runs the file as a program. It needs the **execute permission** from the Basic
  level, and the `./` says "the file in this directory".
- `hello.sh` works only if the script's directory is listed in `PATH`. Many systems add `~/bin`
  or `~/.local/bin` for your own scripts.

```bash
./hello.sh
chmod +x hello.sh
./hello.sh
hello.sh
```

```text
bash: ./hello.sh: Permission denied
Hello, world!
Today is Wednesday.
bash: hello.sh: command not found
```

The current directory is deliberately left out of `PATH`, so a program that someone left in a
shared directory cannot run in place of a real command just because you typed its name there.

## Variables

A **variable** is a name that holds a piece of text. Assign it with `name=value`, with **no
spaces** around `=`; with spaces, the shell runs a command called `name`. Read it back with
`$name`, or `${name}` when letters follow straight after it: `"${file}_old"` is the value of
`file` followed by `_old`, while `"$file_old"` is a different, probably empty, variable. Names
are case-sensitive; by convention, your own variables are lower case and environment variables
upper case.

```bash
greeting = "hi"
file=report
echo "[$file_old] [${file}_old]"
```

```text
bash: greeting: command not found
[] [report_old]
```

## Quoting variables

After the shell replaces `$name` with its value, it splits the result into words at spaces and
expands any wildcards in it, unless the expansion is inside **double quotes**. Single quotes
switch expansion off entirely: `'$name'` is the five characters `$name`. The rule is simple:
write `"$name"` every time.

```bash
#!/bin/bash
# count.sh FILE: count the lines in FILE.
file=$1
echo "Counting lines in: $file"
wc -l < $file
```

Run as `bash count.sh "my notes.txt"`, it prints:

```text
Counting lines in: my notes.txt
count.sh: line 5: $file: ambiguous redirect
```

The unquoted `$file` split into `my` and `notes.txt`, two words where a redirection needs one.
With `wc -l < "$file"` the script prints `2`. The `echo` line worked only because its variable
was inside double quotes. ShellCheck, which the Advanced level uses, flags every unquoted
expansion for this reason.

## Command substitution

`$(command)` runs a command and puts its output in place, with trailing newlines removed. It is
how a script stores a date, a count or a file name for later.

```bash
today=$(date +%Y-%m-%d)
echo "Backup of $today"
echo "There are $(ls | wc -l) files here"
```

```text
Backup of 2026-10-14
There are 5 files here
```

You may see the older form with backquotes, `` `date` ``; it does the same, but it cannot be
nested easily, so prefer `$( )`.

## Arguments

The words after a script's name are its **arguments**, and the script sees them as
**positional parameters**: `$1` is the first, `$2` the second, and so on. `$#` is how many there
are and `$0` is the name the script was run as. `"$@"` expands to all of them, each as its own
word, exactly as they were given, which is what you want when you loop over them or pass them on.

```bash
#!/bin/bash
# args.sh: show how a script sees its arguments.
echo "script: $0"
echo "count:  $#"
echo "first:  $1"
for arg in "$@"; do
  echo "arg: [$arg]"
done
```

Run as `bash args.sh "two words" third`:

```text
script: args.sh
count:  2
first:  two words
arg: [two words]
arg: [third]
```

The `for` line repeats the indented command once for each argument; lesson 9 covers loops in
full. `$*` and an unquoted `$@` split `two words` into two arguments; `"$*"` joins everything into
one. Only `"$@"` keeps the arguments as given.

## Exit status

Every command finishes with an **exit status**, a number from 0 to 255. Zero means success and
anything else means failure; many programs use different numbers for different failures. `$?`
holds the status of the last command. A script's own status is that of the last command it ran,
unless it calls `exit n`.

```bash
ls /nope; echo "ls said $?"
true; echo "true said $?"
bash backup.sh missing.txt; echo "status $?"
```

```text
ls: cannot access '/nope': No such file or directory
ls said 2
true said 0
cp: cannot stat 'missing.txt': No such file or directory
backed up missing.txt
status 0
```

`backup.sh` holds two lines, `cp "$1" "$1.bak"` and `echo "backed up $1"`. The copy failed, yet
the script carried on, claimed success and exited with `0` because its last command, `echo`,
succeeded. A script does not stop at an error by itself. Lesson 8 shows how to test a status and
stop with `exit 1`.

## Common mistakes

- **Spaces around `=`.** `name = value` runs a command called `name`.
- **Unquoted expansions.** File names with spaces break; write `"$1"`, `"$file"`, `"$@"`.
- **Single quotes when you want a value.** `'$name'` stays literal.
- **Forgetting `./` or the execute bit.** The errors are `command not found` and
  `Permission denied`.
- **Windows line endings.** A script saved with carriage returns fails with `cannot execute:
  required file not found` (older Bash says `bad interpreter`), because the shebang now names
  `/bin/bash` plus an invisible `\r`. Remove them with `tr -d '\r'` (lesson 1).

## Practice

1. Write `greet.sh` that prints `Hello, NAME!` for its first argument.
2. What does `x=5; echo '$x' "$x" $x` print?
3. Write `stamp.sh` that prints `FILE has N lines` for the file named in its first argument.

### Answers

1. Two lines: `#!/bin/bash` and `echo "Hello, $1!"`. `bash greet.sh Ada` prints `Hello, Ada!`.
2. `$x 5 5`. Single quotes keep `$x` literal; the other two expand.
3. `#!/bin/bash`, then `lines=$(wc -l < "$1")`, then `echo "$1 has $lines lines"`. Reading from
   `<` makes `wc` print only the number, without the file name.

## Key takeaways

- A script is a file of commands with a shebang line; run it with `bash file` or make it
  executable and run `./file`.
- `name=value` assigns, `"$name"` expands; quote every expansion.
- `$(command)` captures output; `$1`, `$#` and `"$@"` give the arguments.
- Every command returns an exit status; `0` is success, and `$?` holds the last one.

## Further reading

- [Bash Reference Manual: Positional Parameters](https://www.gnu.org/software/bash/manual/html_node/Positional-Parameters.html)
- [Bash Reference Manual: Command Substitution](https://www.gnu.org/software/bash/manual/html_node/Command-Substitution.html)
- [The Linux Command Line: Writing Your First Script](https://linuxcommand.org/lc3_wss0010.php)
