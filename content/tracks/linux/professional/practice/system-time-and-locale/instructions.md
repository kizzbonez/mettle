Complete `solution.sh`. It is run as `bash solution.sh EVENTS` and prints one timeline in UTC.

Each line of `EVENTS` is `DATE TIME ZONE HOST MESSAGE`, separated by single spaces: a local date
and time (`2026-10-14 17:02:11`), the time zone of the server that logged it (an IANA name such
as `Asia/Manila`), the host name, and the message, which is the rest of the line.

1. Skip empty lines and lines starting with `#`.
2. Convert each local time to UTC **with the rules of its zone**, including daylight saving time
   and half-hour offsets: let `date` do it (`TZ=ZONE date -d "DATE TIME" +%s` gives the epoch
   seconds), never a fixed number of hours.
3. Print each event as `YYYY-MM-DDTHH:MM:SSZ HOST MESSAGE`, with the message exactly as written.
4. Sort the lines by UTC time, earliest first. Events at the same second keep their order in the
   file.

Example: `bash solution.sh data/events.txt` prints

```text
2026-10-14T09:00:02Z pay-nyc chronyd: Selected source 192.0.2.123 (pool.ntp.org)
2026-10-14T09:01:40Z pay-nyc gateway: certificate verify failed (not yet valid)
2026-10-14T09:01:58Z db-lon postgres: replication slot "pay_ro" lag 41 s
2026-10-14T09:02:11Z web-mnl checkout: 502 from payment gateway
2026-10-14T09:02:11Z web-mnl checkout: retry 1 for order 88131
2026-10-14T09:02:11Z db-lon postgres: connection from 10.20.0.15 refused
```

In October London is on summer time (UTC+1) and New York on daylight time (UTC-4); Manila is
always UTC+8.

**Tips:** `date -u -d "@SECONDS" '+%Y-%m-%dT%H:%M:%SZ'` prints epoch seconds in UTC. These
timestamps sort correctly as text; `LC_ALL=C sort -s -k1,1` sorts by the first field only, in
byte order, and `-s` keeps the file order of equal keys.
