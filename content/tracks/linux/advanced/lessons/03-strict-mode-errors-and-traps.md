---
title: Strict Mode, Errors and Traps
summary: Make a script stop when something fails with `set -euo pipefail`, learn the places where those options quietly do nothing, check the failures that matter explicitly, and clean up on every exit with `trap`.
minutes: 30
objectives:
  - Explain what `set -e`, `set -u` and `set -o pipefail` each change, and show a failure each one catches
  - Predict at least three situations in which `set -e` does not stop the script
  - Check a command's failure explicitly with `||`, `if !` and `die`, without reading `$?` afterwards
  - Use `trap ... EXIT` to clean up on every exit and `trap ... ERR` with `set -E` to report where a script failed
---

## Outline

1. What Bash does when a command fails
2. `set -e`: stop on failure
3. `set -u` and `set -o pipefail`
4. Where `set -e` does nothing
5. Checking errors explicitly
6. Cleaning up with `trap`

## What Bash does when a command fails

Every command ends with an **exit status**: 0 for success, anything else for failure. By default Bash looks at the status only when you ask (with `if`, `&&`, `||`), and otherwise runs the next line whatever happened. That is convenient at a prompt and dangerous in a script.

```bash
cd /srv/releases/current
echo "deleting old files in $PWD"
```

Saved as `deploy.sh` and run with `bash deploy.sh; echo "status $?"` (the other examples here were run the same way):

```text
deploy.sh: line 1: cd: /srv/releases/current: No such file or directory
deleting old files in /work
status 0
```

The `cd` failed, the script carried on in whatever directory it started in, and it even reported success. Had the second line been `rm -rf ./*`, it would have emptied the wrong directory. Robust scripts need a rule for failures.

## `set -e`: stop on failure

`set -e` (long name `set -o errexit`) makes the shell exit as soon as a command fails, with that command's status. Put it at the top of the script and the `deploy.sh` above stops at the `cd` with status 1 before reaching the `echo`.

The Bash community usually adds two more options and calls the combination **strict mode**: `set -euo pipefail`. Many experienced scripters, including the maintainers of Greg's Wiki, warn that `set -e` is full of exceptions. The fair position: it is a useful safety net for unexpected failures, but it is not error handling. The failures you can foresee you must still check yourself.

## `set -u` and `set -o pipefail`

`set -u` (`nounset`) makes expanding a variable that was never set an error. It turns typos into failures instead of empty strings. `"$@"` and `"$*"` are exempt, so a script with no arguments still works, and `${var:-}` reads a variable that may legitimately be unset.

A **pipeline** (`a | b | c`) normally has the status of its *last* command, so a failure on the left is invisible. `set -o pipefail` gives the pipeline the status of the rightmost command that failed, or 0 if all succeeded. Without it, the array `PIPESTATUS` still records each command's status, until the next command runs.

```bash
set -euo pipefail
grep error missing.log | sort || echo "pipeline failed with status $?"
release_dir=/srv/app
echo "using ${relase_dir}"
echo "not reached"
```

```text
grep: missing.log: No such file or directory
pipeline failed with status 2
strict.sh: line 4: relase_dir: unbound variable
status 1
```

Without `pipefail` the pipeline would have returned the status of `sort`, 0. And without `-u`, the misspelt `relase_dir` would have expanded to nothing.

## Where `set -e` does nothing

`set -e` is ignored for any command whose status is being tested: the condition of `if`, `while` and `until`, every command of an `&&` or `||` list except the last, and anything after `!`. That is necessary (otherwise `if grep -q ...` could never take its `else` branch), but it spreads in surprising ways.

```bash
set -euo pipefail

check() {
  false
  echo "check kept going after false"
}
if check; then echo "check reported success"; fi

load() {
  local data=$(cat /nonexistent)
  echo "load continued; data='$data'"
}
load

count=0
((count++))
echo "never printed: count is $count"
```

```text
check kept going after false
check reported success
cat: /nonexistent: No such file or directory
load continued; data=''
status 1
```

Three traps for the unwary:

1. Because `check` was called as an `if` condition, `set -e` was switched off for its **whole body**. `false` was ignored and the function's status came from the `echo`.
2. `local data=$(cat ...)` has the status of `local`, which succeeded. The failure of `cat` was masked. Declare first, then assign: `local data; data=$(cat ...)`. ShellCheck reports this as SC2155. The same applies to `export` and `readonly`.
3. `((count++))` evaluates to the *old* value, 0, and an arithmetic command whose value is 0 has status 1, so the script died at a harmless increment. Write `count=$((count + 1))` instead.

Also note that command substitution normally does not inherit `set -e`, so `x=$(false; echo hi)` carries on inside the substitution. `shopt -s inherit_errexit` changes that.

## Checking errors explicitly

For failures you expect, decide what should happen and write it down. A `die` function (lesson 1) keeps that short:

```bash
die() { printf 'error: %s\n' "$1" >&2; exit 1; }

if ! version=$(cat VERSION 2>/dev/null); then
  echo "no VERSION file, using 0.0.0"
  version=0.0.0
fi
echo "version $version"
cd /srv/app 2>/dev/null || die "cannot enter /srv/app"
echo "not reached"
```

```text
no VERSION file, using 0.0.0
version 0.0.0
error: cannot enter /srv/app
status 1
```

The `||` runs `die` only when `cd` fails. `if ! var=$(cmd)` captures the output and tests the status in one step, because an assignment takes the status of its command substitution. Avoid `cmd; if [ $? -ne 0 ]`: any line later inserted between the two silently changes what `$?` means (ShellCheck SC2181), and under `set -e` the script exits before reaching the test.

## Cleaning up with `trap`

`trap 'commands' CONDITION` registers commands that the shell runs when a condition occurs. Two conditions are not real signals but are made for scripts:

- `EXIT` runs when the shell exits for any reason: the end of the script, `exit`, a failure under `set -e`, or a signal that terminates it. Use it to delete temporary files and undo half-finished work. The script's exit status is kept, unless the trap itself calls `exit`.
- `ERR` runs whenever a command fails in a place where `set -e` would act. Functions, command substitutions and subshells do not inherit it unless you also `set -E` (`errtrace`).

Inside a trap, `$LINENO` is the line being run and `$BASH_COMMAND` is the command, as written.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

workdir=$(mktemp -d)
cleanup() {
  rm -rf -- "$workdir"
  echo "cleanup: removed the work directory" >&2
}
trap cleanup EXIT
trap 'echo "error: line $LINENO: \"$BASH_COMMAND\" failed" >&2' ERR

echo "copying into the work directory"
cp /etc/hostname "$workdir/"
cp /etc/no-such-file "$workdir/"
echo "not reached"
```

```text
copying into the work directory
cp: cannot stat '/etc/no-such-file': No such file or directory
error: line 14: "cp /etc/no-such-file "$workdir/"" failed
cleanup: removed the work directory
status 1
```

`mktemp -d` creates a new private directory (lesson 9 covers it), and the `EXIT` trap guarantees it disappears however the script ends. Set the trap right after creating what it cleans up, never before (it would try to remove a path that does not exist yet) and never at the end (a failure in between would leave it behind). Single quotes around the `ERR` action delay `$LINENO` and `$BASH_COMMAND` until the trap runs.

## Common mistakes

- **Treating `set -e` as error handling.** Check expected failures yourself.
- **`local var=$(cmd)`, `export var=$(cmd)`**, which hide the failure of `cmd`.
- **`((count++))` under `set -e`** when `count` can be 0.
- **Calling a function in an `if` and expecting `set -e` to work inside it.**
- **Double quotes around a trap action**, which expand variables when the trap is set instead of when it runs.

## Practice

1. Under `set -e`, `grep -c ERROR app.log` exits the script when the log has no errors. Why, and how do you keep going?
2. Why does `set -o pipefail` make `producer | head -n 1` fail sometimes?
3. Write the first lines of a script that creates a temporary file and is certain to delete it.

### Answers

1. `grep` exits with status 1 when nothing matches, which `set -e` treats as a failure. Write `count=$(grep -c ERROR app.log) || true`; the count is still printed (0), and `|| true` marks the failure as expected.
2. `head` exits after one line. If `producer` is still writing, it is killed by `SIGPIPE` and fails with status 141, which `pipefail` reports. Whether that happens depends on timing and output size.
3. Create first, trap at once:

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   tmp=$(mktemp)
   trap 'rm -f -- "$tmp"' EXIT
   ```

## Key takeaways

- `set -e` stops on unexpected failures, `-u` on unset variables, `pipefail` on failures inside pipelines.
- `set -e` is ignored in conditions, in `&&`/`||` lists and inside functions called from them; `local x=$(...)` and `((x++))` defeat it too.
- Handle expected failures with `|| die`, `if ! cmd` and `if ! var=$(cmd)`.
- `trap cleanup EXIT` runs on every exit; `trap ... ERR` with `set -E` reports where it failed.

## Further reading

- [Bash Reference Manual (Chet Ramey's copy): The Set Builtin](https://tiswww.case.edu/php/chet/bash/bashref.html#The-Set-Builtin)
- [Greg's Wiki: BashFAQ 105, why doesn't set -e do what I expected?](https://mywiki.wooledge.org/BashFAQ/105)
- [ShellCheck wiki: SC2155, declare and assign separately](https://www.shellcheck.net/wiki/SC2155)
