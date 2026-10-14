---
title: Logs and journald
summary: Find the log lines that matter with journalctl filters, know what lives in /var/log and how rsyslog fits in, keep the journal from filling the disk, and rotate classic log files with logrotate.
minutes: 30
objectives:
  - Filter the journal by unit, priority, time, boot and text, and follow it live
  - Explain where journald stores logs, when they survive a reboot, and how to limit their size
  - Read a rsyslog selector and name the usual files under `/var/log`
  - Write a logrotate rule for an application log and test it without changing anything
---

## Outline

1. Two logging systems
2. Asking the journal questions
3. Storage, size and rescue
4. /var/log and rsyslog
5. Rotating files with logrotate

## Two logging systems

A modern Linux server usually has two logging systems side by side. **systemd-journald**
collects everything: kernel messages, the output of every service, and messages programs send
with the `syslog()` call. It stores them in a binary, indexed **journal** with extra fields
attached to each entry, such as the unit name, the PID and the boot it belongs to. The older
**syslog** model, today usually the daemon **rsyslog**, writes plain text files under
`/var/log`. Where both run, rsyslog is fed from journald, either through a syslog socket that
journald forwards to (`ForwardToSyslog=` in `journald.conf`) or by reading the journal itself, so
the same line can be found in both places.

Every message has a **priority** (also called severity) from 0 to 7: `emerg` (0), `alert`,
`crit`, `err`, `warning`, `notice`, `info` and `debug` (7). Lower numbers are more serious.
You can write your own entries from scripts with `logger -t backup "dump finished"` or
`echo done | systemd-cat -t backup`, which beats writing to a private file nobody reads.

## Asking the journal questions

`journalctl` with no arguments prints the whole journal, oldest first, in a pager. That is
never what you want; filters are the skill. Root, and members of the groups `systemd-journal`
and `adm`, can read all of it. The course sandbox has no journal, so this output is from a
typical server:

```bash
journalctl -u nginx.service --since "2026-10-14 08:00" --until "2026-10-14 09:00"
journalctl -p err -b                 # priority err and worse, this boot only
journalctl -u backup-db -n 20 -e     # last 20 lines of one unit, jump to the end
journalctl -f -u reportd             # follow live, like tail -f; Ctrl+C to stop
journalctl -k -b -1                  # kernel messages from the previous boot
journalctl -u ssh -g 'Failed password' --since today
```

```text
Oct 14 02:00:05 db02 backup-db[4120]: pg_dump: error: connection to server failed
Oct 14 02:00:07 db02 systemd[1]: backup-db.service: Main process exited, code=exited, status=1/FAILURE
Oct 14 02:00:07 db02 systemd[1]: backup-db.service: Failed with result 'exit-code'.
```

- `-u` selects a unit, and also includes systemd's own messages about it (the start and failure
  lines above).
- `-p err` means `err` **and everything more serious**; give a range such as `-p warning..err`
  for exactly those levels.
- `--since` and `--until` accept full dates, a time alone (today), or words such as `yesterday`,
  `today` and `now`, and relative times such as `-1h`.
- `-b` is the current boot, `-b -1` the one before; `--list-boots` lists them. The previous boot
  is where you look after an unexplained reboot.
- `-g` matches a regular expression against the message. `-r` shows newest first, `-n` limits
  the count, `--no-pager` is for scripts.

Filters on different fields are combined with AND. Any journal field can be matched directly,
for example `journalctl _PID=4120` or `journalctl _UID=1000`.

For scripts, ask for structured output instead of parsing the text. `-o json` prints one JSON
object per entry, and `jq`, which you met earlier in the course, does the rest. Here, on a
saved export:

```bash
jq -r 'select((.PRIORITY | tonumber) <= 3) | [._SYSTEMD_UNIT, .MESSAGE] | @tsv' journal.json
jq -r 'select((.PRIORITY | tonumber) <= 3) | ._SYSTEMD_UNIT' journal.json | sort | uniq -c | sort -rn
```

```text
backup-db.service	pg_dump: error: connection to server failed
backup-db.service	backup-db.service: Main process exited, code=exited, status=1/FAILURE
kernel	Out of memory: Killed process 2211 (java)
      2 backup-db.service
      1 kernel
```

The priority comes out of the journal as a string, which is why the filter converts it with
`tonumber` before comparing.

## Storage, size and rescue

`Storage=` in `/etc/systemd/journald.conf` decides where the journal lives. With `persistent`
it is written to `/var/log/journal/`; with `volatile` it is kept only in memory in
`/run/log/journal/` and **lost at every reboot**; with `auto` it is persistent only if
`/var/log/journal/` exists. If `journalctl --list-boots` shows a single boot on a server that has
rebooted many times, the journal is volatile, and creating that directory (then restarting
`systemd-journald`) fixes it.

By default the persistent journal may use up to 10% of its filesystem, capped at 4 GiB.
`journalctl --disk-usage` shows the current size. To change the limit, put
`SystemMaxUse=500M` in a drop-in such as `/etc/systemd/journald.conf.d/60-size.conf`; to free
space now, `sudo journalctl --vacuum-size=200M` or `--vacuum-time=2weeks` removes the oldest
archived files. When a server will not boot, you can still read its journal from a rescue
system: mount its disk and point `journalctl -D /mnt/var/log/journal` at the directory.

## /var/log and rsyslog

Text logs remain common and are what many tools expect. Typical files on Debian and Ubuntu:
`/var/log/syslog` (almost everything), `/var/log/auth.log` (logins, sudo, SSH),
`/var/log/kern.log` (the kernel) and `/var/log/dpkg.log` (package changes). Red Hat family
systems use `/var/log/messages` and `/var/log/secure` instead. Applications often keep their own
directory, such as `/var/log/nginx/`.

rsyslog decides where each message goes with rules in `/etc/rsyslog.conf` and
`/etc/rsyslog.d/*.conf`. A rule is a **selector**, `facility.priority`, and an action. The
**facility** says what kind of program sent the message (`auth`, `authpriv`, `cron`, `daemon`,
`kern`, `mail`, `user`, `local0` to `local7`). `authpriv.* /var/log/auth.log` sends every
priority of that facility to one file; `*.err` matches `err` and worse from every facility;
`mail.=info` matches exactly `info`; `mail.none` excludes a facility. Restart rsyslog after
changing its rules.

## Rotating files with logrotate

A text log grows until the disk is full. **logrotate** renames it on a schedule (`app.log`
becomes `app.log.1`), starts a fresh file, compresses old copies and deletes the oldest. It runs
once a day from `logrotate.timer` or cron, reads `/etc/logrotate.conf`, and takes per-application
rules from `/etc/logrotate.d/`:

```text
# /etc/logrotate.d/reportd
/var/log/reportd/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 reportd adm
    sharedscripts
    postrotate
        systemctl reload reportd > /dev/null 2>&1 || true
    endscript
}
```

This keeps fourteen days of logs, compresses all but the newest old copy (`delaycompress`, in
case the program is still writing to it), does not complain if the file is missing, skips empty
files, creates the new file with safe permissions, and tells the program to reopen its log once
after rotating. Without that reload, many programs keep writing to the renamed file. For a program
that cannot reopen its log, `copytruncate` copies the file and empties the original instead, at
the cost of possibly losing a few lines in between. Test a rule with `sudo logrotate -d
/etc/logrotate.d/reportd`, which changes nothing and explains what it would do; `-f` forces a
rotation now.

## Common mistakes

- Running `journalctl` with no filter and scrolling. Filter by unit, priority and time first.
- Reading `-p warning` as "only warnings": it includes `err`, `crit`, `alert` and `emerg` too.
- A volatile journal on a server, so the logs of the crash disappear with the reboot.
- Deleting a log file that a program has open: the space is not freed until the program
  closes it. Truncate it (`: > file`) or rotate it instead.
- A logrotate rule without `postrotate` or `copytruncate` for a program that never reopens its log.

## Practice

1. Show only errors (and worse) from `postgresql.service` since yesterday.
2. `journalctl --list-boots` lists one boot, but the server rebooted last night. Why, and what is the fix?
3. Which rsyslog selector matches every message of the `cron` facility, and which one matches `warning` and worse from all facilities?

### Answers

1. `journalctl -u postgresql.service -p err --since yesterday`.
2. The journal is volatile, kept in `/run`, which is emptied at every boot. Create
   `/var/log/journal` (or set `Storage=persistent` in a journald drop-in) and restart
   `systemd-journald`. The logs of last night's boot are already gone.
3. `cron.*` and `*.warning`. A priority in a selector includes all more serious priorities.

## Key takeaways

- journald collects everything; filter it with `-u`, `-p`, `--since`, `-b`, `-g` and `-f`.
- A priority filter includes every more serious level.
- Make the journal persistent on servers, cap its size, and vacuum it when needed.
- rsyslog routes `facility.priority` selectors to text files under `/var/log`.
- logrotate keeps text logs bounded; test rules with `logrotate -d`.

## Further reading

- [journalctl(1) manual page](https://man7.org/linux/man-pages/man1/journalctl.1.html)
- [journald.conf(5) manual page](https://man7.org/linux/man-pages/man5/journald.conf.5.html)
- [rsyslog: filter conditions](https://docs.rsyslog.com/doc/configuration/filters.html)
- [logrotate(8) manual page](https://man7.org/linux/man-pages/man8/logrotate.8.html)
