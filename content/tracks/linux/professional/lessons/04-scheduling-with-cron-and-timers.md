---
title: Scheduling with cron and Timers
summary: Schedule recurring jobs with crontab and with systemd timers, avoid the classic cron pitfalls of environment, PATH and lost output, and run one-off jobs with at.
minutes: 30
objectives:
  - Write and read the five time fields of a crontab line, including steps, ranges and lists
  - Explain why a command that works in a terminal fails under cron, and fix it
  - Write a systemd timer with its service, test its calendar expression, and list when it runs next
  - Choose between cron, a systemd timer and `at` for a given job
---

## Outline

1. Three schedulers
2. The crontab format
3. Why jobs fail under cron
4. System crontabs and access
5. systemd timers
6. One-off jobs with at

## Three schedulers

Servers do a lot of work while nobody is watching: backups, log rotation, certificate renewal,
reports. Linux offers three ways to start such work. **cron** is the classic daemon that runs
commands on a recurring schedule. **systemd timers** do the same with systemd units, and add
logging, dependencies and catch-up after downtime. **at** runs a command once, at a given time.

## The crontab format

Each user has a **crontab** (cron table), edited with `crontab -e`, shown with `crontab -l`,
and removed with `crontab -r`. Beware that `r` is next to `e` on the keyboard, and `-r` deletes
the whole table without asking unless you add `-i`; keep a copy with `crontab -l > crontab.bak`.
Never edit the files under `/var/spool/cron/` directly.

A line has five time fields and a command:

```text
# minute  hour  day-of-month  month  day-of-week   command
  30      2     *             *      *             /usr/local/bin/backup-db
  */15    *     *             *      *             /usr/local/bin/check-queue
  0       9-17  *             *      1-5           /usr/local/bin/office-report
  0       0     1,15          *      *             /usr/local/bin/billing-run
  @reboot                                          /usr/local/bin/warm-cache
```

Minutes are 0 to 59, hours 0 to 23, days of the month 1 to 31, months 1 to 12, and days of the
week 0 to 7, where both 0 and 7 are Sunday. `*` means every value, `a-b` a range, `a,b` a list,
and `*/15` every fifteenth value starting from the first (minutes 0, 15, 30 and 45). Read the
lines above as: 02:30 every day; every 15 minutes; on the hour from 09:00 to 17:00 Monday to
Friday; midnight on the 1st and the 15th; once at boot. `@daily`, `@weekly` and `@hourly` are
shortcuts for common schedules.

Two traps sit in the fields themselves. A step does not carry across the hour: `*/35` in the
minute field runs at :00 and :35, not every 35 minutes. And when **both** day fields are
restricted, cron runs when **either** matches, so `0 0 13 * 5` runs on every 13th *and* every
Friday, not only on Friday the 13th. cron uses the system time zone and checks each crontab
every minute, so a saved change takes effect without restarting anything.

## Why jobs fail under cron

"It works when I run it" is the most common cron complaint. cron does not start a login shell,
so none of your profile is read. It runs the command with `/bin/sh` and a minimal environment.
On Debian the `PATH` is only `/usr/bin:/bin`. This reproduces that environment in the sandbox:

```bash
env -i PATH=/usr/bin:/bin SHELL=/bin/sh HOME=/tmp \
  bash -c 'echo "PATH=$PATH"; command -v useradd || echo "useradd: not found"; command -v tar'
command -v useradd
```

```text
PATH=/usr/bin:/bin
useradd: not found
/usr/bin/tar
/usr/sbin/useradd
```

Anything in `/usr/sbin` or `/usr/local/bin` is "not found" under cron. Use absolute paths in the
command, or set `PATH=` on its own line at the top of the crontab (values there are not
expanded, so `PATH=$HOME/bin:$PATH` does not work).

The other pitfalls:

- **`%` is special.** In the command field an unescaped `%` becomes a newline, so
  `date +%F` breaks. Write `date +\%F`, or move the command into a script.
- **Output goes to mail.** Anything the job prints is mailed to the crontab owner, or to the
  address in `MAILTO=`. With no mail system installed it is simply lost, along with your error
  messages. Redirect explicitly:
  `30 2 * * * /usr/local/bin/backup-db >> /var/log/backup-db.log 2>&1`, or send it to the
  system log with `| logger -t backup-db`.
- **Overlapping runs.** If a job sometimes takes longer than its interval, two copies run at
  once. `flock -n /run/lock/check-queue.lock /usr/local/bin/check-queue` skips a run while the
  previous one still holds the lock.
- **The last line.** cron requires every entry to end with a newline; an editor that leaves the
  final line unterminated can make cron ignore it.

## System crontabs and access

The administrator's schedules live outside the per-user tables. `/etc/crontab` and the files in
`/etc/cron.d/` have a **sixth field, the user** to run as, between the time and the command:

```text
# /etc/cron.d/reportd
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=ops@example.com
15 3 * * *  reportd  /usr/local/bin/reportd-cleanup --days 30
```

Packages drop scripts into `/etc/cron.hourly/`, `cron.daily/`, `cron.weekly/` and `cron.monthly/`,
which `run-parts` executes. On Debian, files in these directories and in `/etc/cron.d/` are
ignored if their names contain a dot, so `cleanup.sh` never runs; name it `cleanup`. Access to
`crontab` is controlled by `/etc/cron.allow` (if it exists, only the users listed may use it) and
`/etc/cron.deny` (users listed may not). On a standard Debian system with neither file, every
user may.

## systemd timers

A **timer** is a unit that starts another unit, normally a service with the same name, on a
schedule. The work goes in a `oneshot` service:

```ini
# /etc/systemd/system/backup-db.service
[Unit]
Description=Nightly database dump

[Service]
Type=oneshot
User=postgres
ExecStart=/usr/local/bin/backup-db
```

```ini
# /etc/systemd/system/backup-db.timer
[Unit]
Description=Run backup-db every night

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=10min

[Install]
WantedBy=timers.target
```

Enable and start the **timer**, not the service: `sudo systemctl daemon-reload` and then
`sudo systemctl enable --now backup-db.timer`. `OnCalendar=` takes calendar expressions:
`daily`, `weekly` (Monday 00:00), `Mon..Fri 09:00`, `*-*-01 04:00` (the 1st of each month).
`Persistent=true` runs a missed job at the next boot if the machine was off at 02:30, which
cron cannot do. `RandomizedDelaySec=` spreads jobs so that a hundred servers do not hit the
backup store at the same second. Monotonic timers count from an event instead:
`OnBootSec=15min` or `OnUnitActiveSec=1h`.

Check an expression before you rely on it, and see what is scheduled (a typical system):

```bash
systemd-analyze calendar 'Mon..Fri 09:00'
systemctl list-timers --all
```

```text
  Original form: Mon..Fri 09:00
Normalized form: Mon..Fri *-*-* 09:00:00
    Next elapse: Thu 2026-10-15 09:00:00 UTC
       From now: 23h left

NEXT                        LEFT     LAST                        PASSED  UNIT              ACTIVATES
Thu 2026-10-15 02:37:12 UTC 16h left Wed 2026-10-14 02:31:40 UTC 7h ago  backup-db.timer   backup-db.service
Thu 2026-10-15 00:00:00 UTC 14h left Wed 2026-10-14 00:00:00 UTC 10h ago logrotate.timer   logrotate.service
```

Timers cost two files instead of one line, but their output goes to the journal
(`journalctl -u backup-db.service`), a failure shows in `systemctl --failed`, and the service can
use every unit setting, such as `User=`, resource limits and sandboxing. For a quick test,
`systemd-run --on-active=5min /usr/local/bin/backup-db` creates a temporary timer.

## One-off jobs with at

`at` reads commands from standard input and runs them once: `echo "systemctl restart reportd" |
sudo at 03:00` or `at now + 2 hours`. `atq` lists pending jobs and `atrm 7` removes job 7. It needs
the `atd` daemon, and `/etc/at.allow` and `/etc/at.deny` control who may use it, in the same way
as for cron.

## Common mistakes

- Relying on `PATH`, aliases or variables from your interactive shell inside cron.
- An unescaped `%` in a crontab command.
- No redirection, so every error vanishes into undelivered mail.
- `*/35` expecting "every 35 minutes", or both day fields set expecting "and".
- Enabling the `.service` of a timer instead of the `.timer`.
- Script names with dots in `/etc/cron.d/` or `/etc/cron.daily/`.

## Practice

1. Write a crontab line that runs `/opt/tools/sync` at 06:45 on weekdays and appends all output to `/var/log/sync.log`.
2. A root cron job on Debian runs `nft list ruleset > /tmp/rules.txt` and the file is always empty. Why?
3. Convert the line from exercise 1 into an `OnCalendar=` expression. What else does the timer need to run it?

### Answers

1. `45 6 * * 1-5 /opt/tools/sync >> /var/log/sync.log 2>&1`.
2. `nft` lives in `/usr/sbin`, which is not on cron's `PATH`. The shell prints "not found" to
   standard error, which is not redirected, so it is mailed or lost, while the redirection has
   already created the empty file. Use `/usr/sbin/nft`, or set `PATH` at the top of the crontab.
3. `OnCalendar=Mon..Fri 06:45`. The timer needs a matching `sync.service` (or `Unit=`), an
   `[Install]` section with `WantedBy=timers.target`, and `systemctl enable --now sync.timer`.

## Key takeaways

- Five fields: minute, hour, day of month, month, day of week; then the command.
- cron runs `/bin/sh` with a tiny `PATH`: use absolute paths and redirect output.
- System crontabs have a user field; per-user tables are edited with `crontab -e`.
- Timers give logs, failure tracking and catch-up (`Persistent=true`) for the price of two files.
- `at` is for a single future run.

## Further reading

- [crontab(5) manual page (Debian)](https://manpages.debian.org/bookworm/cron/crontab.5.en.html)
- [cron(8) manual page (Debian)](https://manpages.debian.org/bookworm/cron/cron.8.en.html)
- [systemd.timer(5) manual page](https://man7.org/linux/man-pages/man5/systemd.timer.5.html)
- [systemd.time(7) manual page](https://man7.org/linux/man-pages/man7/systemd.time.7.html)
