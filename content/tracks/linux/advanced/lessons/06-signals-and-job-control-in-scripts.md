---
title: Signals and Job Control in Scripts
summary: Send signals with `kill`, read the exit status of a process that a signal ended, trap `INT` and `TERM` so a script stops cleanly, and run work in the background with `&` and `wait` while still reacting to signals at once.
minutes: 25
objectives:
  - Name the common signals and what each is for, and send one with `kill`
  - Decode an exit status above 128 into the signal that ended a process
  - Trap `INT` and `TERM` to clean up and exit with the conventional status, and explain why a trap waits for a foreground command
  - Run several jobs in the background, wait for each with `wait PID`, and collect their exit statuses
---

## Outline

1. What a signal is
2. Sending signals with `kill`
3. Exit codes after a signal
4. Trapping `INT` and `TERM`
5. When a trap runs
6. Background jobs and `wait`

## What a signal is

A **signal** is a small asynchronous notification that the kernel delivers to a process: "stop", "the terminal went away", "you tried to divide by zero". Each has a name and a number. A process can **catch** most signals (run its own handler), **ignore** them, or accept the **default action**, which for the signals below is to terminate. The Professional level manages processes from the outside; here we look at signals from inside a script.

| Signal | Number | Usual meaning |
| --- | --- | --- |
| `HUP` | 1 | the controlling terminal closed; daemons use it as "reload your configuration" |
| `INT` | 2 | interrupt: what Ctrl+C sends |
| `QUIT` | 3 | Ctrl+\\, terminate with a core dump |
| `KILL` | 9 | terminate at once; cannot be caught or ignored |
| `TERM` | 15 | polite request to terminate; the default of `kill` |

`kill -l` lists all of them. `EXIT` from lesson 3 is not a real signal but a shell pseudo-signal for "the shell is exiting".

## Sending signals with `kill`

`kill PID` sends `TERM` to process `PID`. Choose another signal with `kill -s INT PID` (or `kill -INT PID`). In Bash, `kill` is a builtin, so it can also take a job like `%1`. In a script, the process id of the most recent background job is in `$!`, and the script's own process id is in `$$`.

Always try `TERM` first: a program that receives it can delete temporary files and finish writing. `KILL` gives it no chance, and can leave half-written files behind. It is the last resort for a process that ignores `TERM`.

## Exit codes after a signal

When a process is ended by signal number N, the shell reports its exit status as **128 + N**. So 130 means "interrupted by `INT`", 143 means "terminated by `TERM`" and 137 means "killed by `KILL`". Bash's `kill -l` translates such a status back into a name.

```bash
sleep 30 &
pid=$!
kill "$pid"
wait "$pid"
status=$?
echo "sleep ended with status $status: signal $((status - 128)), $(kill -l "$status")"

sleep 30 &
kill -s KILL $!
wait $!
echo "after KILL: $?"

timeout 1 sleep 30
echo "timeout gives: $?"
```

```text
sleep ended with status 143: signal 15, TERM
status.sh: line 10:    64 Killed                  sleep 30
after KILL: 137
timeout gives: 124
```

Bash printed a `Killed` notice for the job ended by `KILL` (the number in it is the process id, which differs on every run). `timeout` from coreutils runs a command with a time limit, sends it `TERM` when the limit passes, and then exits with 124 to say "timed out" rather than passing on 143.

## Trapping `INT` and `TERM`

A script that creates temporary files or starts helpers should trap the signals that usually end it. In Bash the `EXIT` trap from lesson 3 already runs when `TERM` ends a script; trapping the signals themselves lets you report what happened, stop helpers and choose the exit status. Exit with 128 plus the signal number, so callers see the conventional status: `trap '...; exit 130' INT` and `trap '...; exit 143' TERM`.

Greg's Wiki points out a subtlety for `INT`: Bash decides whether Ctrl+C should stop a *calling* script by checking whether the child really died from `INT`. An exit with status 130 is not the same thing, so the most correct handler removes itself and sends the signal again: `trap 'cleanup; trap - INT; kill -s INT "$$"' INT`. `trap - SIGNAL` restores the default action.

## When a trap runs

Bash does not run a trap while it is waiting for a **foreground** command (one it runs and waits for, such as `sleep 20` on a line by itself). The trap runs only after that command finishes, so a script stuck in a long command seems to ignore `TERM`. The builtin `wait`, by contrast, *is* interrupted by a trapped signal. The fix is therefore to start long commands in the background and `wait` for them:

```bash
#!/usr/bin/env bash
child=
cleanup() {
  echo "worker: caught $1, stopping the child and cleaning up"
  [[ -n $child ]] && kill "$child" 2>/dev/null
}
trap 'cleanup TERM; exit 143' TERM
trap 'cleanup INT; exit 130' INT

echo "worker: started"
sleep 20 &
child=$!
wait "$child"
echo "worker: finished normally"
```

A second script starts it, waits one second and sends `TERM`:

```bash
bash worker.sh &
pid=$!
sleep 1
kill -s TERM "$pid"
wait "$pid"
echo "driver: worker exited with status $?"
```

```text
worker: started
worker: caught TERM, stopping the child and cleaning up
driver: worker exited with status 143
```

It finished after about one second instead of twenty. With a plain foreground `sleep 20` the same trap would have run only after the twenty seconds. The handler also kills the child: a background job is not stopped just because its parent exits, so a script that starts helpers must stop them itself.

A trap for `INT` has a catch of its own. When job control is off, as in any script, commands started with `&` **ignore** `INT` and `QUIT`, and a shell cannot trap a signal that was ignored when it started. So `kill -s INT` aimed at a script that was itself started with `&` from another script does nothing. Use `TERM` to stop background work; Ctrl+C in a terminal reaches foreground scripts normally.

## Background jobs and `wait`

`command &` starts a **background job**: the script carries on at once while the job runs. `$!` holds its process id. `wait PID` blocks until that job ends and returns *its* exit status, which is how a script learns whether parallel work succeeded. `wait` with no arguments waits for every background job but returns 0, so it tells you nothing about failures. `wait -n` waits for whichever job finishes next.

```bash
check_host() {
  sleep 1
  [[ $1 != db02 ]]
}

declare -A pid_of=()
hosts=(web01 db02 cache01)
for host in "${hosts[@]}"; do
  check_host "$host" &
  pid_of[$host]=$!
done

failed=0
for host in "${hosts[@]}"; do
  if wait "${pid_of[$host]}"; then
    echo "$host ok"
  else
    echo "$host FAILED (status $?)"
    failed=$((failed + 1))
  fi
done
echo "$failed of ${#hosts[@]} checks failed"
exit $(( failed > 0 ))
```

```text
web01 ok
db02 FAILED (status 1)
cache01 ok
1 of 3 checks failed
```

The three one-second checks ran at the same time, so the script took about one second, not three. The results print in a fixed order because the script waits for each job in turn, whatever order they actually finish in. `$(( failed > 0 ))` is 1 when any check failed and 0 otherwise.

## Common mistakes

- **Reaching for `kill -9` first.** Send `TERM` and give the process time to clean up.
- **Long foreground commands in a script that traps signals.** Run them with `&` and `wait`.
- **Bare `wait` when you need the results.** Wait for each process id.
- **Leaving background children running** when the script exits. Kill them in the trap.
- **Exiting 0 or 1 from a signal handler.** Use 128 plus the signal number.

## Practice

1. A job's status is 130. What happened to it?
2. Change `worker.sh` so that its `EXIT` trap, not the signal traps, kills the child.
3. Start `gzip` on three large files in parallel and exit non-zero if any of them fails.

### Answers

1. It was ended by signal 2, `INT`: someone pressed Ctrl+C or sent `kill -s INT`.
2. Move the kill into an `EXIT` trap and keep the signal traps only for the status, since the exit they trigger runs the `EXIT` trap:

   ```bash
   trap '[[ -n $child ]] && kill "$child" 2>/dev/null' EXIT
   trap 'exit 143' TERM
   trap 'exit 130' INT
   ```

3. Record each process id, then wait for each:

   ```bash
   pids=()
   for f in a.log b.log c.log; do
     gzip -- "$f" & pids+=("$!")
   done
   status=0
   for pid in "${pids[@]}"; do wait "$pid" || status=1; done
   exit "$status"
   ```

## Key takeaways

- Signals are notifications; `TERM` asks politely, `KILL` cannot be refused, `INT` is Ctrl+C.
- An exit status of 128 + N means "ended by signal N": 130, 137, 143.
- Trap `INT` and `TERM`, clean up, and exit with 128 + N.
- Traps wait for foreground commands; `cmd & wait $!` lets them run at once.
- `wait PID` returns that job's status; collect it for every background job.

## Further reading

- [Bash Reference Manual (Chet Ramey's copy): Signals](https://tiswww.case.edu/php/chet/bash/bashref.html#Signals)
- [Linux manual page: kill(1)](https://man7.org/linux/man-pages/man1/kill.1.html)
- [Greg's Wiki: Sending and trapping signals](https://mywiki.wooledge.org/SignalTrap)
