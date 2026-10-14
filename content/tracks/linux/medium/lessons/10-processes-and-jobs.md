---
title: Processes and Jobs
summary: See what is running with ps and top, stop or pause processes with signals, move jobs between the foreground and the background, keep a command running after logout, and change its priority.
minutes: 30
objectives:
  - Explain what a process, a PID and a parent process are, and list processes with `ps` and `top`
  - Send signals with `kill`, and choose between `TERM`, `KILL`, `STOP` and `CONT`
  - Start, suspend, resume and list jobs with `&`, Ctrl+Z, `jobs`, `bg` and `fg`
  - Keep a command running after logout with `nohup`, and lower its priority with `nice` and `renice`
---

## Outline

1. What a process is
2. Listing processes with `ps`
3. Watching the system with `top`
4. Signals and `kill`
5. Foreground and background jobs
6. Surviving logout with `nohup`
7. Priority with `nice` and `renice`

## What a process is

A program is a file on disk; a **process** is one running copy of it, with its own memory and its
own place in the queue for the processor. The kernel gives every process a number, its **process
ID** or **PID**. Every process is started by another one, its **parent**, whose PID is the
**PPID**: a command you type is a child of your shell. The shell in turn records the PID of the
last command it started in the background in `$!`.

## Listing processes with `ps`

Plain `ps` shows the processes of your current terminal. `-e` selects every process on the system
and `-f` gives a fuller listing; `ps aux` is the older BSD spelling of much the same, written
without a dash. `-o` chooses the columns, `-p PID` selects one process and `-u user` one user.
`pgrep pattern` prints the PIDs of processes whose names match, and `pgrep -a` adds the command
line.

```bash
sleep 300 &
ps -o pid,ppid,stat,ni,cmd
pgrep -a sleep
kill %1
```

```text
[1] 27
  PID  PPID STAT  NI CMD
   25    22 Ss     0 bash
   27    25 S      0 sleep 300
   29    25 R+     0 ps -o pid,ppid,stat,ni,cmd
27 sleep 300
```

`sleep` and `ps` are children of the shell, PID 25. The first letter of `STAT` is the **state**:
`R` running or ready to run, `S` sleeping until something happens (most processes, most of the
time), `D` waiting for a disk or device, `T` stopped and `Z` a **zombie**, a process that has
finished but whose parent has not yet collected its exit status. Extra letters add detail: `+`
means "in the foreground". `NI` is the niceness, explained below. `kill %1` ends the `sleep`.

## Watching the system with `top`

`top` is `ps` that refreshes every few seconds, sorted by processor use, with a summary of load
and memory at the top. Inside it, `P` sorts by processor, `M` by memory, `k` asks for a PID to
kill and `q` quits. `top -b -n 1` prints one screen as plain text, handy in scripts; `uptime` and
`free -h` print just the load averages and the memory summary.

## Signals and `kill`

A **signal** is a small message the kernel delivers to a process. Each has a name and a number,
and a program may react to most of them in its own way, but `KILL` and `STOP` can never be caught
or ignored. `kill` sends a signal to a PID or, with `%n`, to a job; with no option it sends
`TERM`.

| Signal | Number | Means |
| --- | --- | --- |
| `HUP` | 1 | the terminal closed |
| `INT` | 2 | interrupt: what Ctrl+C sends |
| `KILL` | 9 | end now; the process gets no chance to clean up |
| `TERM` | 15 | please finish: the polite default |
| `CONT` | 18 | continue after a stop |
| `STOP` | 19 | pause, unconditionally |
| `TSTP` | 20 | pause request: what Ctrl+Z sends |

Always try `TERM` first and give the program a moment to save its work; use `kill -9` only when it
will not stop. `pkill pattern` signals processes by name.

```bash
sleep 300 &
kill -STOP $!
ps -o pid,stat,cmd -p $!
kill -CONT $!
ps -o pid,stat,cmd -p $!
kill $!; wait $!; echo "exit status $?"
```

```text
[2] 34
[1]   Terminated              sleep 300
  PID STAT CMD
   34 T    sleep 300

[2]+  Stopped                 sleep 300
  PID STAT CMD
   34 S    sleep 300
[2]+  Terminated              sleep 300
exit status 143
```

The lines in square brackets are the shell's **job notices**: just before it shows the next
prompt, Bash reports any job that has ended or stopped, which is why the end of the first `sleep`
appears here. A process ended by a signal reports status 128 plus the signal's number: 143 for
`TERM`, 137 for `KILL`. `wait` waits for a background process and returns its status.

## Foreground and background jobs

Your shell runs one **foreground** job, which owns the keyboard, and any number of **background**
jobs. A **job** is a pipeline started from this shell; `jobs` lists them with a job number, and
`%n` refers to job `n`. End a command with `&` to start it in the background. Press Ctrl+Z to
suspend the foreground job, `bg` to let it continue in the background, and `fg` to bring a job
back to the foreground.

```bash
sleep 600 &
sleep 500
```

Pressing Ctrl+Z while the second `sleep` runs gives:

```text
[1] 14
^Z
[2]+  Stopped                 sleep 500
```

```bash
jobs
bg %2
jobs -l
kill %1
jobs
```

```text
[1]-  Running                 sleep 600 &
[2]+  Stopped                 sleep 500
[2]+ sleep 500 &
[1]-    14 Running                 sleep 600 &
[2]+    16 Running                 sleep 500 &
[1]-  Terminated              sleep 600
[2]+  Running                 sleep 500 &
```

`[1] 14` is the job number and PID that `&` reports. `+` marks the current job, which `fg` and
`bg` use when you give no number, and `-` the previous one. `jobs -l` adds the PIDs. A background
job still writes to your terminal, so redirect its output, and it is stopped if it tries to read
from the keyboard.

## Surviving logout with `nohup`

When you close a terminal or a remote session ends, the shell sends `HUP` to its jobs, and most
programs end. `nohup command &` starts a command that ignores `HUP`. If its output would have gone
to the terminal, it is appended to `nohup.out` instead:

```bash
nohup sh -c "echo hi" &
cat nohup.out
```

```text
[1] 48
nohup: ignoring input and appending output to 'nohup.out'
hi
[1]+  Done                    nohup sh -c "echo hi"
```

Better still, redirect the output yourself: `nohup ./backup.sh > backup.log 2>&1 &`. For work you
want to return to later, terminal multiplexers such as `tmux` and `screen` keep whole sessions
alive.

## Priority with `nice` and `renice`

Each process has a **niceness** from -20 to 19 that tells the scheduler how willing it is to give
way to others. Commands start at 0; a higher value means lower priority. `nice -n 10 command`
starts a command 10 points nicer (10 is also the default), and `renice -n N -p PID` changes a
running process. An ordinary user may only make a process nicer; lowering niceness needs root.

```bash
nice -n 10 sleep 300 &
ps -o pid,ni,cmd -p $!
renice -n 15 -p $!
renice -n 5 -p $!
```

```text
[1] 43
  PID  NI CMD
   43  10 sleep 300
43 (process ID) old priority 10, new priority 15
renice: failed to set priority for 43 (process ID): Permission denied
```

Run long, heavy jobs such as compressing a large backup with `nice` so that interactive work stays
responsive.

## Common mistakes

- **Reaching for `kill -9` first.** The program cannot clean up; files may be left half-written.
- **Confusing job numbers and PIDs.** `kill %1` is job 1; `kill 1` is PID 1.
- **Background jobs that read input or print freely.** Redirect both.
- **Expecting `nice -n -5` to work as a normal user.** It fails with `Permission denied`.

## Practice

1. Start `sleep 1000` in the background, then end it politely using `$!`.
2. A long `tar` is running in the foreground and you need your prompt back without stopping it.
   What do you type?
3. Show the PID, niceness and command of every `sleep` process.

### Answers

1. `sleep 1000 &` then `kill $!`. `kill` sends `TERM` by default.
2. Ctrl+Z to suspend it, then `bg` to let it continue in the background.
3. `ps -o pid,ni,cmd -p "$(pgrep -d, sleep)"`, or simply `ps -o pid,ni,cmd -C sleep`, where `-C`
   selects by command name.

## Key takeaways

- A process is a running program with a PID and a parent; `ps`, `pgrep` and `top` show them.
- Signals ask (`TERM`), force (`KILL`), pause (`STOP`, `TSTP`) and resume (`CONT`).
- `&`, Ctrl+Z, `jobs`, `bg` and `fg` move jobs between foreground and background.
- `nohup` survives a hangup; `nice` and `renice` lower priority.

## Further reading

- [Bash Reference Manual: Job Control Basics](https://www.gnu.org/software/bash/manual/html_node/Job-Control-Basics.html)
- [ps(1) manual page](https://man7.org/linux/man-pages/man1/ps.1.html)
- [signal(7) manual page](https://man7.org/linux/man-pages/man7/signal.7.html)
- [The Linux Command Line: Job Control](https://linuxcommand.org/lc3_lts0100.php)
