---
title: Loops and Reading Input
summary: Repeat work with for, while and until, loop over words, numbers and files, read a file line by line with while read -r, split lines into fields with IFS, and steer a loop with break and continue.
minutes: 30
objectives:
  - Loop over words, number ranges and file names with `for`, including the case where no file matches
  - Count and calculate with arithmetic expansion `$(( ))` inside `while` and `until` loops
  - Read a file safely line by line with `while IFS= read -r`, including a last line with no newline
  - Split each line into fields with `IFS` and control a loop with `break` and `continue`
---

## Outline

1. `for` over a list
2. Ranges of numbers
3. `for` over files
4. Arithmetic, `while` and `until`
5. Reading a file line by line
6. Splitting lines into fields
7. `break` and `continue`
8. Where loops go wrong

## `for` over a list

A **loop** repeats commands. `for name in words; do ...; done` runs the commands once per word,
with the variable `name` holding the current word. The list can be literal words, a variable,
`"$@"`, or the result of a wildcard; quoting keeps a multi-word item together.

```bash
for fruit in apple 'passion fruit' fig; do
  echo "fruit: $fruit"
done
```

```text
fruit: apple
fruit: passion fruit
fruit: fig
```

## Ranges of numbers

**Brace expansion** writes a sequence for you: `{1..5}` becomes `1 2 3 4 5`, and `{a..c}` becomes
`a b c`. Its limits must be written literally, because brace expansion happens before variables
are expanded. When the limits are in variables, use `seq FIRST STEP LAST`, which prints a number
per line; `seq -w` pads them to equal width.

```bash
for n in {1..3}; do printf '%s ' "$n"; done; echo
for n in $(seq 2 2 8); do printf '%s ' "$n"; done; echo
seq -w 8 11 | paste -sd' '
```

```text
1 2 3 
2 4 6 8 
08 09 10 11
```

## `for` over files

A wildcard in the list expands to the matching file names, each one a single word even when it
contains spaces. That makes `for f in *.csv` the right way to visit files, and `for f in $(ls)`
the wrong one: the output of `ls` is text that the shell splits at every space.

```bash
for f in *.csv; do echo "$f has $(wc -l < "$f") line(s)"; done
for f in *.pdf; do echo "found: $f"; done
for f in *.pdf; do [ -e "$f" ] || continue; echo "found: $f"; done
```

```text
q1 sales.csv has 1 line(s)
q2.csv has 2 line(s)
found: *.pdf
```

When no file matches, Bash leaves the pattern as it is, so the second loop ran once with the
literal text `*.pdf`. The third loop guards against that: if the "file" does not exist, `continue`
skips to the next item.

## Arithmetic, `while` and `until`

**Arithmetic expansion** `$(( expression ))` calculates with whole numbers: `+ - * / %` and `**`
for powers. Variables inside it need no `$`. Division drops the remainder, so `$(( 7 / 2 ))` is
`3`; Bash has no decimal numbers, which is one reason awk exists.

`while condition; do ...; done` repeats as long as the condition command succeeds; `until` repeats
as long as it fails.

```bash
n=3
while [ "$n" -gt 0 ]; do
  printf '%s.. ' "$n"
  n=$((n - 1))
done
echo "liftoff"
```

```text
3.. 2.. 1.. liftoff
```

Forget to change `n` and the loop never ends; press Ctrl+C to stop it.

## Reading a file line by line

`read` reads one line from standard input into one or more variables, and its exit status is 0
while there was a line to read. Put it in a `while` condition and redirect a file into the whole
loop with `done < file`, and the loop body runs once per line. Two details make it safe:

- `-r` keeps backslashes as they are; without it, `read` treats `\` as an escape and drops it.
- `IFS=` (an empty separator for this command only) keeps spaces at the start and end of a line.

The examples read `hosts.txt`, whose last line has no newline at the end:

```text
web01 10.0.0.5
  db01 10.0.0.9
backup\01 10.0.0.12
last 10.0.0.99
```

```bash
while read line; do echo "[$line]"; done < hosts.txt
while IFS= read -r line || [ -n "$line" ]; do echo "[$line]"; done < hosts.txt
```

```text
[web01 10.0.0.5]
[db01 10.0.0.9]
[backup01 10.0.0.12]
[web01 10.0.0.5]
[  db01 10.0.0.9]
[backup\01 10.0.0.12]
[last 10.0.0.99]
```

The plain loop lost the indentation, ate the backslash and silently dropped the last line. When a
final line has no newline, `read` still fills the variable but returns a failure status, so the
loop ends before printing it; `|| [ -n "$line" ]` lets that last, non-empty line through.

## Splitting lines into fields

`IFS`, the **internal field separator**, is the set of characters `read` splits on; by default
spaces, tabs and newlines. Give `read` several variable names and each gets one field, with the
last variable receiving the rest of the line. Set `IFS` just for the `read` to split on another
character.

```bash
printf 'ada,1000,/home/ada\nbo,1001,/home/bo\n' > users.csv
while IFS=, read -r user uid home; do
  echo "$user ($uid) lives in $home"
done < users.csv
```

```text
ada (1000) lives in /home/ada
bo (1001) lives in /home/bo
```

## `break` and `continue`

`continue` skips the rest of the current pass and moves to the next item; `break` leaves the loop
at once. Both are useful for skipping comment lines or stopping at the first match.

```bash
for n in 1 2 3 4 5 6; do
  if [ "$n" -eq 2 ]; then continue; fi
  if [ "$n" -eq 5 ]; then break; fi
  echo "n=$n"
done
```

```text
n=1
n=3
n=4
```

## Where loops go wrong

A pipe runs each of its commands in a **subshell**, a separate copy of the shell, so variables
set inside `cat file | while read ...` vanish when the loop ends:

```bash
count=0
cat users.csv | while IFS= read -r line; do count=$((count + 1)); done
echo "after the pipe: $count"
count=0
while IFS= read -r line; do count=$((count + 1)); done < users.csv
echo "after the redirect: $count"
```

```text
after the pipe: 0
after the redirect: 2
```

Redirect the file into the loop instead. Also, a command inside the loop that reads standard input
itself, such as `ssh`, swallows the lines meant for `read`; give it `< /dev/null`. And when a job
is really "for every line, compute something", an awk program is usually shorter and much faster.

## Common mistakes

- **`for line in $(cat file)`.** It loops over words, not lines.
- **`read` without `-r` and `IFS=`.** Backslashes and leading spaces are lost.
- **Assuming every file ends with a newline.** Add `|| [ -n "$line" ]`.
- **Piping into `while` and expecting variables to survive.**
- **Unguarded wildcards.** With no match, the loop runs once with the pattern itself.

## Practice

1. Print `file1.txt` to `file5.txt`, one per line, with a loop.
2. Print the total of the numbers in `nums.txt`, one number per line, using a `while read` loop.
3. Print only the user names from `users.csv` whose uid is at least 1001.

### Answers

1. `for i in {1..5}; do echo "file$i.txt"; done`
2. `total=0; while IFS= read -r n || [ -n "$n" ]; do total=$((total + n)); done < nums.txt; echo "$total"`
3. `while IFS=, read -r user uid home; do [ "$uid" -ge 1001 ] && echo "$user"; done < users.csv`
   prints `bo`. `awk -F, '$2 >= 1001 { print $1 }' users.csv` does the same in one step.

## Key takeaways

- `for` walks a list: words, `{1..n}`, `$(seq ...)`, `"$@"` or a wildcard; never `$(ls)`.
- `$(( ))` does whole-number arithmetic; `while` and `until` loop on a condition.
- `while IFS= read -r line || [ -n "$line" ]; do ...; done < file` reads every line intact.
- `IFS=, read -r a b c` splits fields; `break` and `continue` steer the loop.

## Further reading

- [Bash Reference Manual: Looping Constructs](https://www.gnu.org/software/bash/manual/html_node/Looping-Constructs.html)
- [Bash Reference Manual: Bash Builtins (read)](https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html)
- [The Linux Command Line: Flow Control, Part 2 (case, while and until)](https://linuxcommand.org/lc3_wss0110.php)
