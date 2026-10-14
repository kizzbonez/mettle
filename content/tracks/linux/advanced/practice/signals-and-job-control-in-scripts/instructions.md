Complete `solution.sh`. The tests run it as `bash solution.sh DIR`, where DIR holds check
scripts named `*.sh`. A check passes when it exits with status 0.

1. Before any check starts, install `on_term` as the trap for `TERM`.
2. Start **every** `DIR/*.sh` at once, in the order the glob gives, each with `bash FILE &`.
   Record each process id (`$!`) in `pids` and each check's **name**, its file name without the
   directory and without `.sh`, in `names`. Checks may wait for each other, so none may wait for
   another to finish before starting.
3. Then wait for each check in the same order with `wait PID`, and print one line per check:
   - status 0: `NAME ok`
   - status 1 to 128: `NAME failed (status N)`
   - status above 128 (ended by a signal): `NAME killed by SIG`, where SIG is what
     `kill -l STATUS` prints, such as `TERM` or `KILL`.
4. Finally print `P of N checks passed` and exit with status 0 when every check passed, 1
   otherwise. A DIR without checks prints `0 of 0 checks passed` and exits 0.
5. `on_term`: when the script itself receives `TERM`, send `TERM` to every check that is still
   running, print `preflight: interrupted` on standard error and exit with status 143. The test
   starts the script in the background, waits until a slow check has started, sends `TERM` and
   then checks that the slow check has stopped too. Because the script is in `wait`, not in a
   foreground command, the trap runs at once.

Example, with the four checks in `data/` copied into `rig/`:

```text
$ bash solution.sh rig
check-dimmers ok
check-fog failed (status 3)
check-hoist killed by TERM
check-sound ok
2 of 4 checks passed
$ echo $?
1
```

`check-hoist.sh` ends itself with `kill -s TERM "$$"`. Bash may also print a notice such as
`Terminated` on standard error; the tests only read standard output there.
