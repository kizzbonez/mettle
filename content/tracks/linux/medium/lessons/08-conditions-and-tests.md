---
title: Conditions and Tests
summary: Make scripts decide with if, elif and else, compare strings, numbers and files with test, [ ] and [[ ]], chain commands with && and ||, and choose among patterns with case.
minutes: 30
objectives:
  - Explain how `if` uses a command's exit status as true or false
  - Write string, number and file tests with `test`, `[ ]` and `[[ ]]`, quoting correctly
  - Chain commands with `&&` and `||` and stop a script with a clear message when a step fails
  - Choose among several patterns with `case`
---

## Outline

1. True and false are exit statuses
2. `if`, `elif` and `else`
3. `test` and `[ ]`
4. String and number tests
5. File tests
6. `[[ ]]`
7. `&&` and `||`
8. `case`

## True and false are exit statuses

Bash has no special true and false values. A condition is simply a **command**, and its exit
status from lesson 7 is the answer: status `0` counts as true and anything else as false. So any
command can be a condition. `grep -q` (quiet) prints nothing and only sets its status, which
makes it ideal for asking "does this file contain...?".

## `if`, `elif` and `else`

```bash
if grep -q '^root:' /etc/passwd; then
  echo "root exists"
else
  echo "no root account"
fi
```

```text
root exists
```

`if` runs the command after it. If the status is 0, the commands after `then` run; otherwise
`elif` (else if) tries another condition, and `else` catches everything left. `fi`, "if" spelled
backwards, closes the block. `!` in front of a command inverts its status:
`if ! grep -q ...; then`.

## `test` and `[ ]`

To compare values you need a command whose job is comparing. That command is `test`, and `[` is
another name for it that expects a `]` as its last argument. Because `[` is a command, the spaces
around it and before `]` are required, just as you put spaces between any command and its
arguments.

```bash
[ 5 -gt 3 ]; echo "status $?"
[ 10 -lt 9 ]; echo "status $?"
[5 -gt 3]
```

```text
status 0
status 1
bash: [5: command not found
```

## String and number tests

| Test | True when |
| --- | --- |
| `"$a" = "$b"` | the strings are equal (`!=` for not equal) |
| `-z "$a"` | the string is empty |
| `-n "$a"` | the string is not empty |
| `"$x" -eq "$y"` | the numbers are equal (`-ne` not equal) |
| `"$x" -lt "$y"` | less than (`-le`, `-gt`, `-ge` for the others) |

Strings use symbols and numbers use letters, and mixing them up gives wrong answers without an
error: `[ 10 \< 9 ]` compares text and is true. Never write `<` alone inside `[ ]`: the shell
reads it as a redirection from a file called `9`.

Quote every variable inside `[ ]`. An empty or unset variable otherwise disappears entirely, and
`test` sees a different number of arguments than you meant:

```bash
name=""
[ $name = "ada" ]
[ "$name" = "ada" ]; echo "status $?"
[ -z "$name" ] && echo "name is empty"
```

```text
bash: [: =: unary operator expected
status 1
name is empty
```

## File tests

| Test | True when the path |
| --- | --- |
| `-e` | exists |
| `-f` | is a regular file |
| `-d` | is a directory |
| `-s` | exists and is not empty |
| `-r`, `-w`, `-x` | is readable, writable or executable by you |
| `a -nt b` | `a` is newer than `b` |

A script should check its input before using it, and report problems on **standard error**
(`>&2`) with an exit status that says what went wrong. By a common convention, `2` means the
script was called incorrectly.

## `[[ ]]`

`[[ ]]` is Bash's own test syntax. It accepts everything `[ ]` does, with three differences that
matter: variables inside it are not split into words, so a missing quote does no harm; `==` and
`!=` compare against a **wildcard pattern** when the right side is unquoted; and `=~` matches an
extended regular expression. Use `[ ]` in scripts that must run under any POSIX shell and `[[ ]]`
in Bash scripts.

```bash
#!/bin/bash
# grade.sh SCORE: turn a score from 0 to 100 into a grade.
score=$1
if [[ ! $score =~ ^[0-9]+$ ]]; then
  echo "not a number: $score" >&2
  exit 2
elif [ "$score" -ge 90 ]; then
  echo "A"
elif [ "$score" -ge 70 ]; then
  echo "B"
else
  echo "C"
fi
```

Run with `95`, `70`, `12` and `abc` in turn:

```text
A
B
C
not a number: abc
```

Checking the format first matters: `[ abc -ge 90 ]` would fail with `integer expression expected`.
The regex is not quoted, because inside `[[ ]]` a quoted pattern is matched literally.

## `&&` and `||`

`a && b` runs `b` only if `a` succeeded; `a || b` runs `b` only if `a` failed. They make short
conditions read like sentences, and `|| exit 1` is the standard way to stop a script at a step
that must not fail.

```bash
mkdir -p backups && echo "backups ready"
cd /nonexistent 2>/dev/null || echo "could not enter directory"
true && false || echo "this ran although the first command succeeded"
```

```text
backups ready
could not enter directory
this ran although the first command succeeded
```

The last line is a trap: `a && b || c` runs `c` when **either** `a` or `b` fails, so it is not a
true if-else. When the middle command can fail, write a real `if`.

## `case`

`case` compares one value against a list of wildcard patterns and runs the commands of the first
one that matches. Each choice ends with `;;`, `|` separates alternative patterns, `*` matches
anything and so serves as the default, and `esac` closes the block.

```bash
#!/bin/bash
# kind.sh NAME...: say what kind of file each name looks like.
for name in "$@"; do
  case $name in
    *.tar.gz | *.tgz) kind="compressed tar archive" ;;
    *.jpg | *.png)    kind="image" ;;
    [Rr][Ee][Aa][Dd][Mm][Ee]*) kind="readme" ;;
    *)                kind="unknown" ;;
  esac
  echo "$name: $kind"
done
```

Run as `bash kind.sh backup.tgz photo.png README.md notes.txt`:

```text
backup.tgz: compressed tar archive
photo.png: image
README.md: readme
notes.txt: unknown
```

`case` is clearer than a chain of `elif` whenever one value is compared with many patterns, as in
menus, file types and command-line options.

## Common mistakes

- **Missing spaces.** `[5 -gt 3]` and `[ 5 -gt 3]` are errors; `[` and `]` are words.
- **Unquoted variables in `[ ]`.** Write `[ "$a" = "$b" ]`.
- **Using `=` or `<` for numbers.** Use `-eq`, `-lt` and friends.
- **Treating `a && b || c` as if-else.**
- **Quoting the pattern in `[[ $f == "*.csv" ]]`.** A quoted pattern only matches the literal
  text `*.csv`.

## Practice

1. Write a test that is true when the first argument is an existing, non-empty regular file.
2. What does `[ "$n" -gt 5 ] && echo big || echo small` print when `n` is `abc`?
3. Write a `case` that prints `yes` for `y`, `Y`, `yes` or `YES`, `no` for anything starting
   with `n` or `N`, and `?` otherwise.

### Answers

1. `[ -f "$1" ] && [ -s "$1" ]`, or `[[ -f $1 && -s $1 ]]`.
2. An error, `[: abc: integer expression expected`, then `small`: the test failed with status 2,
   so `||` ran.
3. `case $answer in [yY] | yes | YES) echo yes ;; [nN]*) echo no ;; *) echo "?" ;; esac`

## Key takeaways

- A condition is a command; exit status 0 is true.
- `[ ]` is the `test` command: spaces around it, quotes inside it, letters for numbers.
- `[[ ]]` adds pattern and regex matching and does not split variables.
- `&&` and `||` act on success and failure; `case` picks the first matching pattern.

## Further reading

- [Bash Reference Manual: Conditional Constructs](https://www.gnu.org/software/bash/manual/html_node/Conditional-Constructs.html)
- [Bash Reference Manual: Bash Conditional Expressions](https://www.gnu.org/software/bash/manual/html_node/Bash-Conditional-Expressions.html)
- [test(1) manual page](https://man7.org/linux/man-pages/man1/test.1.html)
