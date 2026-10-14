---
title: Performance Triage
summary: When a server is slow, decide within minutes whether CPU, memory or disk is the bottleneck, and which process causes it, using the load average, top, free, vmstat, iostat and /proc.
minutes: 30
objectives:
  - Interpret the load average against the number of CPUs, and explain why waiting for disk raises it
  - Read `free` and explain why "free" memory being low is usually not a problem
  - Use `vmstat` to tell a CPU-bound, memory-starved and I/O-bound system apart
  - Find the process responsible with `top`, `ps` and `/proc`, and act on it safely
---

## Outline

1. A method before tools
2. Load average
3. Who is using the CPU?
4. Memory
5. vmstat: the whole picture in one line
6. Disks and /proc
7. Acting on what you find

## A method before tools

"The server is slow" is a symptom, not a diagnosis. A useful method is to check each
**resource** (CPU, memory, disk, network) for three things: **utilisation** (how busy it is),
**saturation** (how much work is queued waiting for it) and **errors**. Work from the
whole system down to one process, write down what you see with the time, and change nothing
until you know which resource is the bottleneck. Restarting a service first destroys the
evidence.

## Load average

```bash
uptime
cat /proc/loadavg
nproc
```

```text
 11:17:59 up  8:22,  0 user,  load average: 0.67, 0.47, 0.44
0.67 0.47 0.44 1/1033 72
12
```

The **load average** is the average number of tasks that were either running or ready to run
(state `R`) or in **uninterruptible sleep** (state `D`, almost always waiting for disk or
network storage), over the last 1, 5 and 15 minutes. `/proc/loadavg` adds the number of runnable
tasks against all tasks, and the most recently used PID. The three numbers show the trend: `8.1,
3.2, 0.9` is a problem that started a few minutes ago; `0.9, 3.2, 8.1` one that is going away.

The number only means something relative to the CPU count from `nproc`. On this 12-CPU sandbox
a load of 0.67 is idle; a load of 12 would keep every CPU busy, and 30 means tasks queue for
CPUs. Because `D` state counts too, a high load with idle CPUs points at slow storage, not at
computation.

## Who is using the CPU?

`top` shows the summary and the busiest processes, refreshed every few seconds; `P` sorts by
CPU, `M` by memory, `1` shows each CPU, `k` sends a signal, `q` quits. `top -b -n 1` prints one
screen for a script or a ticket. The `%Cpu(s)` line splits CPU time into `us` (user programs),
`sy` (kernel), `ni` (niced programs), `id` (idle), `wa` (waiting for I/O), `hi` and `si`
(interrupts) and `st` (**steal**: time the hypervisor gave to other virtual machines, a sign of
an overloaded host). A process can show more than 100% in `top` when its threads use several
CPUs at once.

`ps` gives a snapshot you can sort and keep. Here a script in the sandbox, `/src/run.sh`, first
started two busy loops in the background:

```bash
ps -eo pid,user,stat,%cpu,%mem,etime,comm --sort=-%cpu | head -n 4
```

```text
  PID USER     STAT %CPU %MEM     ELAPSED COMMAND
   80 sandbox  R     100  0.0       00:02 bash
   81 sandbox  R     100  0.0       00:02 bash
    1 sandbox  Ss    1.7  0.0       00:04 bash
```

Note that `ps` computes `%CPU` over the whole life of the process, while `top` measures the last
interval, so a process that was busy an hour ago and is idle now looks busy only in `ps`. Many
processes in state `D` mean storage trouble; many in state `Z` (**zombies**, finished but not
yet collected by their parent) point at a buggy parent process, not at load.

## Memory

```bash
free -h
```

```text
               total        used        free      shared  buff/cache   available
Mem:            15Gi       3.0Gi       2.9Gi        74Mi       9.6Gi        12Gi
Swap:          4.0Gi          0B       4.0Gi
```

Linux uses otherwise idle RAM as **page cache**, keeping recently read file data in memory, and
gives it back the moment programs need it. That is why `free` is low on any healthy server that
has been up a while. The column to read is **available**, the kernel's estimate of memory that
can be given to new programs without swapping. `used` is total minus available. Trouble looks
like: `available` near zero, **swap** in use and growing, and the system swapping pages in and
out continuously (**thrashing**), which makes everything slow. When memory is exhausted the kernel's
**OOM killer** (out of memory) kills the process it judges worst and logs it; find it with
`journalctl -k -g 'out of memory'`. The raw numbers come from `/proc/meminfo`, and the memory of
one process from `/proc/<pid>/status` (`VmRSS` is the resident memory it uses now).

## vmstat: the whole picture in one line

```bash
vmstat 1 3
```

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  0      0 3084168 1512492 8600368    0    0    10    33  564  964  3  3 95  0  0
 1  0      0 3084168 1512492 8600368    0    0     0     4 1349 2338  1  0 99  0  0
 1  0      0 3084168 1512492 8600368    0    0     0     0 3320 5638  1  1 98  0  0
```

`vmstat 1 3` prints three reports one second apart. **Ignore the first line**: it is the
average since boot. Then read the columns as answers. `r` is the number of runnable tasks; much
more than the CPU count means CPU saturation. `b` counts tasks blocked on I/O. `si` and `so` are
memory swapped in and out per second; anything steadily above zero means memory pressure. `bi`
and `bo` are blocks read from and written to disk. `us`, `sy`, `id`, `wa` and `st` are the same
CPU split as in `top`. This sandbox is idle: `id` near 100, nothing blocked, no swapping.

Three patterns cover most incidents: **CPU-bound** (high `r`, `us` or `sy` high, `id` near 0);
**memory-starved** (`si`/`so` non-zero, `free` and cache shrinking, often high `wa`); and
**I/O-bound** (high `b` and `wa`, CPUs mostly idle, load average high anyway).

## Disks and /proc

For disk detail, `iostat -xz 1` from the **sysstat** package reports each device: reads and
writes per second, `r_await` and `w_await` (average milliseconds per request, including queueing)
and `%util`, the share of time the device was busy. A device near 100% `%util` with rising await
times is saturated; the next questions are which processes write (`iotop`, or `pidstat -d 1` from
sysstat) and whether the disk is simply full (`df -h`).

Every tool here reads **/proc**, a filesystem the kernel generates on the fly. Each process has
a directory: `/proc/<pid>/status` (state, memory, threads), `cmdline` (the full command, with
NUL bytes between arguments), `cwd` (a link to its working directory), `fd/` (its open files) and
`limits`. When a tool is missing, the answer is often one `cat` away:

```bash
grep -E '^(Name|State|VmRSS|Threads)' /proc/81/status
tr '\0' ' ' < /proc/81/cmdline; echo
```

```text
Name:	bash
State:	R (running)
VmRSS:	    1336 kB
Threads:	1
bash /src/run.sh
```

## Acting on what you find

Once you know the process, prefer the gentlest fix that works. Lower its priority with
`renice +10 -p <pid>` so others get the CPU first. Ask it to stop cleanly with `kill <pid>`
(SIGTERM) or, for a service, `systemctl restart`, which systemd can track. Use `kill -9` only
when a process ignores SIGTERM, because it cannot clean up. A process stuck in `D` state cannot
be killed at all until its I/O finishes, so fix the storage. Afterwards, find the cause (a
runaway job, a memory leak, a missing index, an undersized machine) and record it; the same alert
next week should take one minute, not one hour.

## Common mistakes

- Reading the load average without comparing it to the number of CPUs.
- Treating low `free` memory as a leak, when `available` is what matters.
- Reading the first line of `vmstat` as current activity.
- Restarting services before collecting `top`, `vmstat` and log output.
- Using `kill -9` first, or expecting it to work on a process in `D` state.
- Trusting `ps %CPU` for current usage.

## Practice

1. A 4-CPU server shows load `14.2, 13.8, 12.9`, but `top` shows CPUs 90% idle and `wa` at 60%. What is the bottleneck?
2. `free -h` shows `free 210Mi` and `available 11Gi` on a 16 GiB server. Is memory a problem?
3. In `vmstat 5`, `si` and `so` show hundreds every interval and `wa` is high. What is happening and what do you look at next?

### Answers

1. Storage. The tasks raising the load are in `D` state waiting for I/O, not using CPU. Check
   `iostat -xz 1` for a saturated device and `ps` for processes in state `D`.
2. No. Most memory is page cache that can be reclaimed; 11 GiB is available for programs.
3. The system is short of memory and swapping heavily, and the swap traffic keeps the disk busy.
   Sort `top` by memory (`M`) to find the process using it, and check the journal for OOM kills.

## Key takeaways

- Check utilisation, saturation and errors for each resource before changing anything.
- Load counts running and disk-waiting tasks; compare it with `nproc`.
- `available` is the memory figure that matters; page cache is not waste.
- In `vmstat`, skip the first line, then read `r`, `b`, `si`/`so` and `wa`.
- `/proc` holds the raw data behind every tool; act with the gentlest effective fix.

## Further reading

- [vmstat(8) manual page](https://man7.org/linux/man-pages/man8/vmstat.8.html)
- [free(1) manual page](https://man7.org/linux/man-pages/man1/free.1.html)
- [top(1) manual page](https://man7.org/linux/man-pages/man1/top.1.html)
- [proc_loadavg(5) manual page](https://man7.org/linux/man-pages/man5/proc_loadavg.5.html)
