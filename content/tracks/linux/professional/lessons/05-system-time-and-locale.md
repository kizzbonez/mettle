---
title: System Time and Locale
summary: Keep the clock right with NTP, set time zones without breaking logs and schedules, and control the language, number and sorting rules that the locale applies to every command.
minutes: 25
objectives:
  - Explain the system clock, the hardware clock and UTC, and show a time in any zone with `date` and `TZ`
  - Set the time zone and enable network time with `timedatectl`, and check synchronisation with `chronyc`
  - Explain how `LANG`, `LC_*` and `LC_ALL` combine, and why scripts set `LC_ALL=C`
  - Convert text between character encodings with `iconv`
---

## Outline

1. Why time matters to an administrator
2. Two clocks and UTC
3. Time zones
4. Network time
5. Locales
6. Character encodings

## Why time matters to an administrator

A wrong clock breaks more than the time on the screen. TLS certificates are rejected as "not yet
valid", Kerberos and many one-time-password logins refuse clocks that differ by more than a few
minutes, cron jobs run at the wrong hour, and when you put the logs of three servers side by
side the events appear in the wrong order. Keeping time correct and consistent is part of
running a server.

## Two clocks and UTC

A PC has two clocks. The **hardware clock** (also called the **RTC**, real-time clock) is a
battery-powered chip that keeps running while the machine is off. The **system clock** is kept
by the kernel while it runs, counted in seconds since 1 January 1970 UTC (the **Unix epoch**).
At boot the kernel reads the hardware clock once; after that the system clock is the one that
matters. `hwclock --show` reads the RTC and `sudo hwclock --systohc` copies the system time into
it.

**UTC**, Coordinated Universal Time, has no daylight saving time and no time zone. Linux keeps
the system clock in UTC and converts to local time only for display, and the hardware clock
should also be kept in UTC. The `timedatectl` manual is blunt about the alternative: keeping the
RTC in local time is not fully supported and causes trouble at every daylight-saving change.
Only dual-boot machines with Windows sometimes need it.

Because the kernel counts in UTC, the same moment has one number, displayed differently:

```bash
date -u -d '@1792130400'
TZ=Asia/Manila date -d '@1792130400'
TZ=America/New_York date -d '@1792130400' '+%F %T %Z (%z)'
date -u -d '2026-10-14 09:00' +%s
```

```text
Fri Oct 16 06:00:00 UTC 2026
Fri Oct 16 14:00:00 PST 2026
2026-10-16 02:00:00 EDT (-0400)
1791968400
```

`@` gives `date` an epoch time, `-d` parses a date, `+%s` prints one, and the `TZ` variable
changes the zone for one command only. Many servers are run in UTC on purpose, so that logs
from every region line up without conversion.

## Time zones

A **time zone** is a rule set, maintained in the IANA time zone database and installed under
`/usr/share/zoneinfo/`, that says how far a region is from UTC and when its daylight saving time
starts and ends. The system zone is the file `/etc/localtime`, a symbolic link into that
directory; Debian also writes the name into `/etc/timezone`. Daylight saving is why a naive
"add one hour" is wrong. In London, the night of 29 March 2026 skips an hour:

```bash
TZ=Europe/London date -d '2026-03-29 00:30 UTC' '+%F %T %Z'
TZ=Europe/London date -d '2026-03-29 01:30 UTC' '+%F %T %Z'
```

```text
2026-03-29 00:30:00 GMT
2026-03-29 02:30:00 BST
```

There is no 01:30 London time that night, and in autumn 01:30 happens twice. Debian's cron
compensates (a job in the skipped hour runs just after the change, and a job in the repeated
hour is not run again), but your own scripts that compute "one hour ago" may not. Keep critical
jobs out of the changeover hours, or run the server in UTC.

`timedatectl` (systemd) shows and changes all of this. Its output on a typical server:

```bash
timedatectl
timedatectl list-timezones | grep Manila
sudo timedatectl set-timezone Asia/Manila
```

```text
               Local time: Wed 2026-10-14 10:21:07 UTC
           Universal time: Wed 2026-10-14 10:21:07 UTC
                 RTC time: Wed 2026-10-14 10:21:07
                Time zone: Etc/UTC (UTC, +0000)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
Asia/Manila
```

`set-timezone` replaces the `/etc/localtime` link. Without systemd, or for a choice made by
answering questions, `tzselect` prints the name of a zone, which you can then use in `TZ` or a
link. Running programs read the zone at start-up, so restart long-running services (cron among
them) after a change.

## Network time

Clocks drift by seconds a day. The **Network Time Protocol (NTP)** corrects them by asking
time servers over UDP port 123. Servers are arranged in **strata**: a stratum 1 server is
connected to a reference clock such as GPS, a stratum 2 server asks stratum 1 servers, and so
on. The **NTP Pool** (`pool.ntp.org`) is a volunteer project that hands out nearby public servers.

Three clients are common. **chrony** (`chronyd`) is the default on Red Hat family systems and
widely used elsewhere. **systemd-timesyncd** is a small client-only service, enough for most
machines and used by default on Ubuntu and many other systemd-based installations;
`timedatectl timesync-status` shows its state.
The classic **ntpd**, with `ntpq -p` to show peers, is still found on older systems, and
`ntpdate` was its one-shot "set the clock now" tool. `sudo timedatectl set-ntp true` enables
whichever of these the system has.

A minimal `/etc/chrony/chrony.conf` (`/etc/chrony.conf` on Red Hat):

```text
pool pool.ntp.org iburst
makestep 1.0 3
driftfile /var/lib/chrony/drift
rtcsync
```

`iburst` sends a quick burst of requests at start-up so the first correction comes sooner.
`makestep 1.0 3` lets chrony **step** (jump) the clock if it is more than one second off, but
only during its first three updates; after that it **slews** the clock, running it slightly
fast or slow until it is right, because programs can misbehave when time jumps, especially
backwards. `rtcsync` keeps the hardware clock updated. `chronyc tracking` shows how far off the
clock is and `chronyc sources` lists the servers; the `*` marks the one in use and a `Reach` of
`377` means the last eight requests were all answered.

## Locales

A **locale** is the set of cultural rules a program applies: the language of messages, the
character set, how numbers, dates and money are written, and how text sorts. Its name has the
form `language_COUNTRY.encoding`, such as `en_US.UTF-8` or `de_DE.UTF-8`. Each aspect is a
**category** with its own variable: `LC_CTYPE` (characters), `LC_NUMERIC`, `LC_TIME`,
`LC_COLLATE` (sorting), `LC_MESSAGES`, `LC_MONETARY` and more.

The rule for which value wins is simple: `LC_ALL` overrides everything; otherwise an `LC_*`
variable sets its own category; `LANG` fills in every category not set. `locale` shows the
result and `locale -a` the locales installed (this sandbox has only the basic ones):

```bash
locale | head -n 3
locale -a
```

```text
LANG=C.UTF-8
LANGUAGE=
LC_CTYPE="C.UTF-8"
C
C.utf8
POSIX
```

The **C** (or POSIX) locale is plain and predictable: English messages, `.` as the decimal
point, and sorting by byte value. In `de_DE.UTF-8`, by contrast, `printf '%.2f' 3.5` expects
`3,5`, and `sort` orders letters as a dictionary would. That is why scripts that parse command
output or depend on sort order set `LC_ALL=C` at the top: the output then looks the same on
every machine. The system default is set in `/etc/default/locale` on Debian or
`/etc/locale.conf` elsewhere, and `localectl set-locale LANG=en_GB.UTF-8` changes it.

## Character encodings

An **encoding** maps characters to bytes. **ASCII** covers 128 characters in one byte each.
**ISO-8859-1** (Latin-1) uses one byte for Western European letters. **Unicode** is the single
catalogue of all characters, and **UTF-8**, its usual encoding, uses one byte for ASCII and two
to four for everything else. `iconv` converts between them:

```bash
echo 'café' | od -An -tx1
echo 'café' | iconv -f UTF-8 -t ISO-8859-1 | od -An -tx1
echo 'café' | iconv -f UTF-8 -t ASCII//TRANSLIT
```

```text
 63 61 66 c3 a9 0a
 63 61 66 e9 0a
cafe
```

The `é` is two bytes in UTF-8 and one in Latin-1. A file in the wrong encoding shows up as
`Ã©` where `é` should be; `file` reports the encoding it guesses, and `iconv` repairs it.

## Common mistakes

- Keeping the hardware clock in local time on a Linux-only server.
- Changing the time zone and not restarting cron and long-running services.
- Scheduling important jobs between 01:00 and 03:00 local time in a zone with daylight saving.
- Correcting a drifting clock by hand with `date -s` instead of fixing NTP.
- Scripts that parse output or sort without `LC_ALL=C`, and so behave differently per user.

## Practice

1. Print the current time in Tokyo without changing the system zone.
2. A user has `LANG=de_DE.UTF-8` and `LC_NUMERIC=C`, and runs a command with `LC_ALL=fr_FR.UTF-8`. Which locale applies to numbers?
3. `chronyc sources` shows `^?` in front of every server. What does it suggest?

### Answers

1. `TZ=Asia/Tokyo date`. `TZ` affects only that one command.
2. French. `LC_ALL` overrides both `LC_NUMERIC` and `LANG`.
3. `?` means a source is not selectable, for example unreachable, so the clock is not being
   synchronised. Check that UDP port 123 is allowed out through the firewall and that the
   names resolve, then watch `chronyc tracking`.

## Key takeaways

- The kernel counts UTC seconds since 1970; zones only change how time is displayed.
- `/etc/localtime` links to the zone file; `timedatectl set-timezone` changes it.
- Run NTP (chrony or systemd-timesyncd) on every machine; it slews rather than jumps.
- `LC_ALL` beats `LC_*`, which beats `LANG`. Scripts use `LC_ALL=C`.
- UTF-8 is the default encoding today; `iconv` converts the rest.

## Further reading

- [timedatectl(1) manual page](https://man7.org/linux/man-pages/man1/timedatectl.1.html)
- [chrony: chrony.conf documentation](https://chrony-project.org/doc/4.5/chrony.conf.html)
- [chrony: chronyc documentation](https://chrony-project.org/doc/4.5/chronyc.html)
- [locale(7) manual page](https://man7.org/linux/man-pages/man7/locale.7.html)
