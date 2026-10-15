Complete `solution.sh`. It is run as `bash solution.sh LOG THRESHOLD MINUTES CANARIES`.

`LOG` holds RFC 5424 syslog lines in time order, such as

```text
<86>1 2026-10-14T02:04:41.020Z bastion-01 sshd 4133 - - Failed password for invalid user admin from 203.0.113.45 port 41040 ssh2
```

The fields are separated by single spaces: `<PRI>1`, the timestamp (always UTC, ending in `Z`),
the host, the app name, the process id, two `-`, then the message. `CANARIES` lists one canary
account per line; skip empty lines and lines starting with `#`.

1. **Which lines count.** Only lines whose app name is exactly `sshd` and whose facility
   (`PRI / 8`, rounded down) is 4 or 10 (security and authorization). The training lab replays
   sample attacks under other facilities, and other programs log similar text: ignore them.
   Of those, two messages are events, and every other line is ignored:
   - a **failure**: `Failed password for USER from IP port ...` or
     `Failed password for invalid user USER from IP port ...`;
   - a **success**: `Accepted METHOD for USER from IP port ...` (`password`, `publickey`, ...).
2. **Canary accounts.** For every event (failure or success) whose `USER` is a canary account,
   print `CANARY USER from IP at TIMESTAMP`.
3. **Password spraying.** For every failure, count the **different** accounts that the same
   `IP` failed on at this failure and at its failures in the `MINUTES` minutes before it. An
   earlier failure counts when it is at most `MINUTES × 60` seconds earlier; ignore the
   fractions of seconds. When the count reaches `THRESHOLD`, print
   `SPRAY IP at TIMESTAMP` (this failure's timestamp), only the first time for each `IP`.
4. **Output.** Print the lines in log order; when one event gives both, print `CANARY` first.
   Exit with status 1 if anything was printed. Otherwise print `no alerts` and exit with
   status 0.

**Example.** `bash solution.sh data/auth.log 4 10 data/canaries.txt` prints the following and
exits with status 1:

```text
CANARY svc-backup-old from 203.0.113.45 at 2026-10-14T02:09:02.448Z
SPRAY 203.0.113.45 at 2026-10-14T02:09:02.448Z
CANARY admin-legacy from 10.44.3.9 at 2026-10-14T03:02:09.117Z
```

At 02:09:02, `203.0.113.45` has failed on `lift-ops`, `admin`, `ticketing` and `svc-backup-old`
within ten minutes: four different accounts. `m.ferraro` mistyped a password twice, which is
not spraying, and the `<190>` line (facility 23, `local7`) comes from the training lab.

**Tips:** in gawk, `match($0, /Failed password for (invalid user )?([^ ]+) from ([^ ]+) port/, m)`
fills `m[2]` and `m[3]`, and
`mktime(gensub(/[-T:]/, " ", "g", substr(ts, 1, 19)), 1)` turns a timestamp into seconds (UTC).
Keep each source's failures in arrays such as `when[ip, n]` and `who[ip, n]`.
