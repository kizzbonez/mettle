Complete `solution.sh`. It is run as

```bash
bash solution.sh JOURNAL PRIORITY [UNIT]
```

`JOURNAL` is a file written by `journalctl -o json`: one JSON object per line, every value a
string. The script does what `journalctl -p PRIORITY [-u UNIT]` would do on that export.

1. `PRIORITY` is a name (`emerg`, `alert`, `crit`, `err`, `warning`, `notice`, `info`, `debug`,
   which are 0 to 7) or a number from 0 to 7. Keep the entries whose `PRIORITY` is that level **or
   more serious** (a lower or equal number).
2. `UNIT` is optional. When it is given and has no `.` in it, add `.service`. Then keep only the
   entries whose `_SYSTEMD_UNIT` **or** `UNIT` field is exactly that name (systemd's own messages
   about a unit carry it in `UNIT`).
3. Print every kept entry, in file order, as `TIME IDENT[PID]: MESSAGE`:
   - `TIME` is `__REALTIME_TIMESTAMP` (microseconds since the epoch) in UTC as
     `YYYY-MM-DDTHH:MM:SSZ`, which is what jq's `todate` gives for the whole seconds;
   - `IDENT` is `SYSLOG_IDENTIFIER` and `PID` is `_PID`. An entry without `_PID` (the kernel's)
     is printed as `TIME IDENT: MESSAGE`.
4. If no entry is kept, print `-- No entries --`, as `journalctl` does.

Example: `bash solution.sh data/journal.json warning orders-api` prints

```text
2026-10-14T08:03:40Z orders-api[2210]: slow query: 2.8 s for GET /orders?status=open
2026-10-14T08:04:05Z systemd[1]: orders-api.service: Failed with result 'oom-kill'.
2026-10-14T08:06:31Z orders-api[2287]: payment gateway returned 502 for order 88131
```

The `notice` line from systemd about the same crash is less serious than `warning`, and the error
from `orders-api-worker.service` belongs to another unit.

**Tips:** pass values into jq with `--arg name value` (a string) and `--argjson name value` (a
number). `.PRIORITY | tonumber` turns the priority into a number; `if ._PID then ... else ... end`
tests whether a field is there.
