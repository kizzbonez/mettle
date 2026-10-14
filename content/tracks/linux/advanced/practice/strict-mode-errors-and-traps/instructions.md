Complete and repair `solution.sh`. The tests run it as `bash solution.sh READINGS REPORT`, with
`TMPDIR` set to an empty directory that they check afterwards. Each line of READINGS is
`METER VALUE`, where VALUE is a whole number of litres or the word `FAULT`.

1. Keep `set -Eeuo pipefail` at the top.
2. `die MESSAGE` prints `meters: MESSAGE` on standard error and exits with status 1.
3. Add an `ERR` trap that prints `meters: line N: COMMAND failed` on standard error, with N taken
   from `$LINENO` and COMMAND from `$BASH_COMMAND`. Single-quote the trap's action.
4. When READINGS is not a readable regular file, stop with `die "cannot read READINGS"`.
5. Create the work directory with `mktemp -d` and set `trap cleanup EXIT` straight after it.
   `cleanup` removes the directory, so `TMPDIR` is empty again however the script ends.
6. The loop and the report are written for you, but three of their lines are mistakes that
   lesson 3 warns about. Under `set -e` they stop the script, or make the `ERR` trap report a
   failure that never mattered. Fix them. (`grep -c` exits with status 1 when it counts 0 lines.)

**What the tests expect**

- A successful run writes REPORT and prints **nothing at all**, on standard output or standard
  error, and exits with status 0. REPORT has three lines: the number of numeric readings, the
  number of `FAULT` lines, and the meter with the highest reading (`highest: none` when there are
  no numeric readings).
- A VALUE that is neither digits nor `FAULT` stops the script with
  `meters: bad value on line N: VALUE` and status 1 (the starter's loop already calls `die`).
- When anything fails, REPORT is neither created nor changed. If moving the finished report into
  place fails, for example because REPORT's directory does not exist, the `ERR` trap reports it
  and the script exits with the status of `mv`, which is 1.

Example, with `data/readings.txt`:

```text
$ bash solution.sh data/readings.txt report.txt
$ echo $?
0
$ cat report.txt
readings: 3
faults: 1
highest: m-03 2210
```
