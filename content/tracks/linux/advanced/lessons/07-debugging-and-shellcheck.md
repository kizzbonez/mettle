---
title: Debugging and ShellCheck
summary: Find out what a script really does with `bash -n` and `set -x`, make traces readable with `PS4`, and let ShellCheck find the quoting, `cd` and exit-status bugs before they reach a server.
minutes: 25
objectives:
  - Check a script's syntax with `bash -n` and read the line number it reports
  - Trace a script or part of it with `set -x`, and add the file, line and function to every trace line with `PS4`
  - Run ShellCheck, read its output and severities, and fix SC2086, SC2164, SC2002, SC2155, SC2181 and SC2068
  - Silence a warning with a directive only when the code is right, and explain why
---

## Outline

1. A debugging routine
2. Syntax checks with `bash -n`
3. Tracing with `set -x` and `PS4`
4. What ShellCheck is
5. The warnings you will meet most
6. Directives and severities

## A debugging routine

Shell bugs tend to be of three kinds: the script does not parse, it runs but does something other than you think, or it works on your files and breaks on someone else's. Each has its own tool. `bash -n` catches the first. Tracing with `set -x` shows the second, because it prints every command *after* expansion, so you see what the shell really ran. ShellCheck, a **static analyser** (a program that reads code without running it), predicts the third.

## Syntax checks with `bash -n`

`bash -n script` reads the script and reports syntax errors without running anything (`-n` is `noexec`). It is quick and safe, so run it before anything else, and in automated checks before a script is deployed.

```bash
for f in *.log; do
  if [[ -s $f ]]; then
    gzip -- "$f"
done
```

```text
rotate.sh: line 4: syntax error near unexpected token `done'
rotate.sh: line 4: `done'
status 2
```

The reported line is where Bash *noticed* the problem, not where it is. The `fi` is missing on line 4, so Bash was still inside the `if` when it met `done`. An unclosed quote is worse: Bash reports `unexpected EOF while looking for matching '"'` at the end of the file, and you have to search upwards for the quote that opened it. `bash -n` cannot find logic errors or misspelt commands, because it never runs anything.

## Tracing with `set -x` and `PS4`

`set -x` (`xtrace`) makes Bash print each command to standard error before running it, after all expansions, prefixed by the value of `PS4`. `set +x` turns it off again, so you can trace just the part you suspect. `bash -x script` traces a whole script without editing it.

The default `PS4` is `+ `. The first character is repeated once per level of nesting, so `++` marks commands inside a command substitution or subshell. `PS4` is expanded each time it is printed, so it can include the file (`BASH_SOURCE`), the line (`LINENO`) and the function (`FUNCNAME`), which makes long traces far easier to follow. Single quotes matter here: they delay the expansion until each line is traced.

```bash
#!/usr/bin/env bash
PS4='+ ${BASH_SOURCE##*/}:${LINENO}:${FUNCNAME[0]:-main}: '
total() {
  local sum=0 n
  for n in "$@"; do
    sum=$((sum + n))
  done
  echo "$sum"
}
set -x
result=$(total 2 3)
set +x
echo "result is $result"
```

```text
++ trace.sh:11:main: total 2 3
++ trace.sh:4:total: local sum=0 n
++ trace.sh:5:total: for n in "$@"
++ trace.sh:6:total: sum=2
++ trace.sh:5:total: for n in "$@"
++ trace.sh:6:total: sum=5
++ trace.sh:8:total: echo 5
+ trace.sh:11:main: result=5
+ trace.sh:12:main: set +x
result is 5
```

Tracing is how quoting bugs become visible. A script containing `name="two words"` and `touch $name`, run with `bash -x`, prints `+ touch two words`: two arguments, so two files. Traces go to standard error, so they do not disturb captured output. To keep them apart from real error messages, open a file and set `BASH_XTRACEFD` to its descriptor, for example `exec 3> trace.log; BASH_XTRACEFD=3`. Traces may contain passwords and tokens from your variables, so never leave tracing on in production.

## What ShellCheck is

**ShellCheck** reads a shell script and reports constructs that are legal but probably wrong. Each finding has a code such as `SC2086`, a severity, and a page on the ShellCheck wiki that explains the problem and the fix. Run `shellcheck script.sh`; it exits 0 when it finds nothing. The sandbox has version 0.9.

```bash
#!/usr/bin/env bash
dir=$1
cd $dir
count=$(cat access.log | grep -c ' 500 ')
echo "server errors: $count"
for f in $(ls *.log); do
  cp $f /backup/
done
```

`shellcheck -f gcc report.sh` prints one line per finding (the default format adds the source line, arrows and suggested fixes):

```text
report.sh:3:1: warning: Use 'cd ... || exit' or 'cd ... || return' in case cd fails. [SC2164]
report.sh:3:4: note: Double quote to prevent globbing and word splitting. [SC2086]
report.sh:4:13: note: Useless cat. Consider 'cmd < file | ..' or 'cmd file | ..' instead. [SC2002]
report.sh:6:10: error: Iterating over ls output is fragile. Use globs. [SC2045]
report.sh:6:15: note: Use ./*glob* or -- *glob* so names with dashes won't become options. [SC2035]
report.sh:7:6: note: Double quote to prevent globbing and word splitting. [SC2086]
```

Eight short lines, six findings, every one a real bug or waste.

## The warnings you will meet most

- **SC2086, unquoted expansion.** `$dir` without quotes is split on spaces and expanded as a glob. A directory named `my files` becomes two arguments. Fix: `"$dir"`. It is reported as `info`, the lowest severity that is not style, but it causes more broken scripts than anything else.
- **SC2164, `cd` without a check.** If `cd` fails, the rest of the script runs in the wrong directory. Fix: `cd -- "$dir" || exit` (or `|| return` in a function). ShellCheck stays quiet when `set -e` is in effect, but explicit is better (lesson 3).
- **SC2002, useless use of `cat`.** `cat file | grep` starts an extra process just to read a file that `grep` can open itself. Fix: `grep -c ' 500 ' access.log`, or `< file cmd` for commands that only read standard input. It is a **style** finding, harmless but wasteful. In ShellCheck 0.11 and later it is off unless you enable it; 0.9 still reports it.
- **SC2045 and SC2035, looping over `ls`.** `$(ls)` splits names on spaces and newlines. Loop over a glob, `for f in ./*.log`, where `./` stops a name such as `-n.log` being read as an option.
- **SC2155, declare and assign separately.** `local out=$(cmd)` hides the failure of `cmd` behind the success of `local` (lesson 3).
- **SC2181, checking `$?` indirectly.** `cmd; if [ $? -ne 0 ]` breaks as soon as a line is added in between. Fix: `if ! cmd; then`.
- **SC2068, unquoted array expansion.** `${args[@]}` re-splits every element. Fix: `"${args[@]}"`.

The fixed script passes cleanly: `shellcheck report.sh; echo "status $?"` prints nothing but the status.

```bash
#!/usr/bin/env bash
dir=$1
cd -- "$dir" || exit
count=$(grep -c ' 500 ' access.log)
echo "server errors: $count"
for f in ./*.log; do
  cp -- "$f" /backup/
done
```

```text
status 0
```

## Directives and severities

ShellCheck is sometimes wrong about intent: a variable that looks unused (SC2034) may be read by a script that sources this one. A **directive** comment, `# shellcheck disable=SC2034`, on the line before a command silences that code for that command; placed before the first command of the file, it applies to the whole file. Write a comment saying *why*, and never disable a warning you do not understand. `# shellcheck source=lib/log.sh` tells ShellCheck which file a dynamic `source` loads, and `shellcheck -x` lets it follow sourced files (otherwise it notes SC1091). `-S warning` hides findings below a given severity (`error`, `warning`, `info`, `style`), which is useful when you first check an old script, but aim to fix everything.

## Common mistakes

- **Believing the line number of a syntax error.** Look above it for the unclosed `if`, `do` or quote.
- **Leaving `set -x` in a script**, which leaks secrets into logs.
- **Silencing ShellCheck instead of quoting.** Most findings are fixed by two quote marks.
- **Ignoring `note` findings** because they are not errors. SC2086 is a note.

## Practice

1. `bash -n` passes, but the script prints nothing where you expect a list of files. Which tool next, and why?
2. Fix every problem in `for f in $(ls $1); do cat $f | wc -l; done`. (ShellCheck 0.9 reports SC2045 and SC2086 twice here; the `cat` is wasteful too.)
3. Write a `PS4` that shows only the line number and the time in seconds since the script started.

### Answers

1. Trace it with `bash -x`, or `set -x` around the suspect part. A syntax check cannot show what values the variables had; a trace shows every command after expansion.
2. Loop over a glob, quote the expansions, and give the file to `wc` directly:

   ```bash
   for f in "$1"/*; do
     wc -l < "$f"
   done
   ```

3. `PS4='+ ${LINENO} ${SECONDS}s: '`. `SECONDS` counts seconds since the shell started, and the single quotes delay its expansion until each line is traced.

## Key takeaways

- `bash -n` checks syntax; the error is often above the reported line.
- `set -x` shows each command after expansion; a rich `PS4` adds file, line and function.
- ShellCheck finds quoting, `cd`, `ls` and exit-status bugs; read each wiki page once.
- Quote expansions, check `cd`, drop useless `cat`, declare then assign, test commands directly.
- Disable a check only with a directive and a reason.

## Further reading

- [ShellCheck wiki: SC2086, double quote to prevent globbing and word splitting](https://www.shellcheck.net/wiki/SC2086)
- [ShellCheck wiki: SC2164, use cd ... || exit in case cd fails](https://www.shellcheck.net/wiki/SC2164)
- [ShellCheck wiki: SC2002, useless cat](https://www.shellcheck.net/wiki/SC2002)
- [Bash Reference Manual (Chet Ramey's copy): Bash Variables, `PS4` and `BASH_XTRACEFD`](https://tiswww.case.edu/php/chet/bash/bashref.html#Bash-Variables)
