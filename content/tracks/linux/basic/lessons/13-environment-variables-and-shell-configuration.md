---
title: Environment Variables and Shell Configuration
summary: Store values in shell variables, pass them to programs with export, understand how PATH decides which command runs, save typing with aliases, make settings permanent in .bashrc and .profile, and run a first file of commands.
minutes: 30
objectives:
  - Set, read and remove shell variables, and export them so programs inherit them
  - Explain how the shell uses `PATH` to find a command, and add a directory to it
  - Define and remove aliases, and make aliases and variables permanent in `~/.bashrc`
  - Say which startup files a login shell and an interactive non-login shell read
---

## Outline

1. Shell variables
2. Environment variables and `export`
3. A value for one command only
4. Command substitution: `$( )`
5. `PATH`: how the shell finds commands
6. Aliases
7. Startup files: `.bashrc` and `.profile`
8. From commands to a script

## Shell variables

A **variable** is a name the shell remembers a value for. Assign with `NAME=value`, with **no
spaces** around `=`, and read with `$NAME`:

```bash
greeting="Good morning"
echo "$greeting, $USER"
greeting = "Hi"
```

```text
Good morning, dana
bash: greeting: command not found
```

With spaces, the shell reads `greeting` as a command name and `=` and `"Hi"` as its arguments.
Quote values that contain spaces, and quote `"$NAME"` when you use it, for the reasons in lesson
7. When a name runs into other text, braces mark where it ends: `"${greeting}s"` gives `Good
mornings`, whereas `"$greetings"` reads a different, unset variable, which is empty. `unset
NAME` removes a variable; `set` with no arguments lists every variable and function.

By convention, variables the system uses are in capitals (`HOME`, `PATH`); use lower case for
your own so you never overwrite one by accident.

## Environment variables and `export`

A plain variable lives only in the current shell. Each program you start is a new **process**,
a running program with its own copy of an **environment**: a list of names and values it
inherits from the process that started it. `export NAME` marks a variable to be copied into the
environment of every command started afterwards:

```bash
city=Lisbon
bash -c 'echo "city is [$city]"'
export city
bash -c 'echo "city is [$city]"'
```

```text
city is []
city is [Lisbon]
```

`bash -c '...'` starts a second shell, a child process, to run one line. Before `export` it
inherits nothing called `city`; after, it does. Inheritance only goes **down**: a child can never
change its parent's variables. `export NAME=value` assigns and exports in one step, and `env`
(or `printenv`) lists the environment. Some you will meet constantly:

| Variable | Holds |
| --- | --- |
| `HOME` | Your home directory, which `~` and `cd` use |
| `USER` | Your user name |
| `PWD` | The working directory, kept up to date by `cd` |
| `SHELL` | Your login shell |
| `PATH` | Where to look for commands (below) |
| `LANG` | Language and character set for messages, dates and sorting |
| `EDITOR` | The editor other programs open (lesson 12) |
| `PS1` | The prompt's layout |
| `HISTSIZE` | How many commands history remembers |

## A value for one command only

An assignment written in front of a command applies only to that command's environment and is
forgotten afterwards. `TZ` selects a time zone:

```bash
TZ=Asia/Tokyo date
date
```

```text
Wed Oct 14 20:21:39 JST 2026
Wed Oct 14 11:21:39 UTC 2026
```

## Command substitution: `$( )`

`$(COMMAND)` runs a command and puts its output, minus any trailing newlines, into the line. It
expands inside double quotes, which makes it ideal for storing results in variables:

```bash
today=$(date +%F)
echo "Backup for $today"
echo "There are $(ls /etc | wc -l) entries in /etc"
```

```text
Backup for 2026-10-14
There are 83 entries in /etc
```

## `PATH`: how the shell finds commands

When you type a name without a `/`, Bash checks for an alias, then a function, then a builtin.
If none matches, it searches the directories listed in `PATH`, **in order**, separated by
colons, and runs the first program file of that name it finds. If none has it, you get
`command not found`.

```bash
echo $PATH
hello
PATH="$HOME/bin:$PATH"
hello
which hello
```

```text
/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
bash: hello: command not found
hello from my own command
/home/dana/bin/hello
```

`hello` is an executable file in `~/bin`. At first that directory is not in `PATH`, so the shell
never looks there. The assignment puts it **in front** of the existing list (keeping
`:$PATH`, so nothing is lost) and the command is found. Overwrite `PATH` without `$PATH` and
even `ls` stops working until you open a new shell.

This also explains the `./` of lesson 9. The current directory is not in `PATH`, deliberately:
otherwise a malicious file called `ls` in a shared directory could run instead of the real one.
To run a program that is not in `PATH`, give a path to it: `./backup.sh` or
`/home/dana/bin/hello`.

## Aliases

An **alias** is a shortcut the shell replaces with longer text when it is the first word of a
command:

```bash
alias ll='ls -lh'
alias
type ll
unalias ll
```

```text
alias ll='ls -lh'
ll is aliased to `ls -lh'
```

`alias` alone lists all aliases, and `unalias` removes one. Aliases are for typing at the
prompt; Bash does not expand them in scripts. Your distribution may define some already, such
as `ls='ls --color=auto'`, which is why `type ls` can surprise you.

## Startup files: `.bashrc` and `.profile`

Everything set at the prompt disappears when the shell exits. To keep a setting, put it in a
**startup file**, which Bash reads as it starts. Which file depends on how it was started:

- A **login shell** is the first shell of a session: logging in on a text console or over the
  network. It reads `/etc/profile`, then the **first** it finds of `~/.bash_profile`,
  `~/.bash_login` and `~/.profile`.
- An **interactive non-login shell** is any other shell you type into, such as a new terminal
  window on most desktops. It reads `~/.bashrc`.

The two are joined on purpose: Debian's and Ubuntu's `~/.profile` reads `~/.bashrc`, so put
aliases, prompt settings and `export`s you want everywhere in `~/.bashrc`. Use `~/.profile` for
things a login needs once, such as adding `~/bin` to `PATH`, which Debian's `.profile` already
does when that directory exists. `/etc/profile` (and, on Debian and Ubuntu,
`/etc/bash.bashrc`) holds system-wide defaults for every user, and `~/.bash_logout` runs when a
login shell exits.

```bash
echo "export EDITOR=nano" >> ~/.bashrc
echo "alias ll='ls -lh'" >> ~/.bashrc
source ~/.bashrc
echo "EDITOR=$EDITOR"
```

```text
EDITOR=nano
```

A startup file is read only at start-up, so after editing one, either open a new terminal or
run `source ~/.bashrc` (also written `. ~/.bashrc`), which runs the file in the current shell.
Edit with care: a mistake in `~/.bashrc` affects every new terminal. Keep a copy first with
`cp ~/.bashrc ~/.bashrc.bak`.

## From commands to a script

A file of commands is a **script**, and `bash FILE` runs it, line by line, in a new shell. Words
after the file name reach the script as `$1`, `$2` and so on, and `$#` holds how many there are:

```bash
cat greet.sh
bash greet.sh Ada Lovelace
bash greet.sh "Ada Lovelace"
```

```text
echo "Hello, $1"
echo "You gave $# arguments"
Hello, Ada
You gave 2 arguments
Hello, Ada Lovelace
You gave 1 arguments
```

The quoting rules of lesson 7 decide what counts as one argument. That is all you need for this
level's lab; the next level teaches scripting properly.

## Common mistakes

- **Spaces around `=`.** `name = value` runs a command called `name`.
- **Forgetting `export`.** A plain variable is invisible to programs you start.
- **Replacing `PATH` instead of extending it.** Always include `$PATH` in the new value.
- **Editing `~/.bashrc` and expecting the open shell to change.** Run `source ~/.bashrc`.
- **Putting `.` in `PATH`.** It lets files in whatever directory you are in pose as commands.

## Practice

1. Make `project=apollo` visible to programs you start, and check it with `bash -c`.
2. You put a program called `report` in `/opt/tools/bin`. Make it runnable by name in this shell
   only, and say how to make that permanent.
3. Why does an alias defined at the prompt work there, but not when the same line is used inside
   a script run with `bash script.sh`?

### Answers

**1.** `export project=apollo`, then `bash -c 'echo $project'` prints `apollo`.

**2.** `PATH="$PATH:/opt/tools/bin"` (or in front, to win over other programs of that name).
Add the same line, with `export` in front, to `~/.bashrc` or `~/.profile`.

**3.** Aliases belong to interactive use. A script is run by a new, non-interactive shell, which
does not expand aliases and does not read `~/.bashrc`.

## Key takeaways

- `NAME=value` sets a shell variable; `export` puts it in the environment children inherit.
- `NAME=value command` sets it for one command; `$(command)` inserts a command's output.
- `PATH` is searched in order; extend it with `PATH="$HOME/bin:$PATH"`; `.` is not in it.
- Aliases and settings go in `~/.bashrc`; login shells read `~/.profile`; `source` reloads.

## Further reading

- [Bash manual: Bash Startup Files](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html)
- [Bash manual page: PARAMETERS, ENVIRONMENT and ALIASES (man7.org)](https://man7.org/linux/man-pages/man1/bash.1.html)
- [env(1)](https://man7.org/linux/man-pages/man1/env.1.html)
