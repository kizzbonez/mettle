Complete `solution.sh`. It is run as

```bash
bash solution.sh CRONTAB "YYYY-MM-DD HH:MM"
```

and prints the command of every job in `CRONTAB` that cron would start at that minute, in file
order. It prints nothing when no job runs. The starter already turns the time into five numbers.

1. **Job lines.** Only lines whose first non-blank character is a digit or `*` are jobs. Skip
   everything else: empty lines, comments, variable settings such as `MAILTO=...`, and `@reboot`.
   A job line has five time fields separated by spaces or tabs (minute, hour, day of month,
   month, day of week), then the command: the rest of the line, with the blanks before it removed.
2. **Fields.** A field is a comma-separated list of items. An item is `*` (every value), `N` (that
   value), `A-B` (A to B, both included) or `*/S` (every S-th value starting from the lowest
   value of the field: 0 for minute, hour and day of week, 1 for day of month and month).
3. **Sunday** is both 0 and 7 in the day-of-week field.
4. **The two day fields.** When neither the day-of-month field nor the day-of-week field starts
   with `*`, the job runs on a day that matches **either** of them. Otherwise the day must match
   **both**.

Example: Friday 16 October 2026 at 07:30, `bash solution.sh data/crontab "2026-10-16 07:30"`,
prints

```text
playout --traffic-report
playout --show morning-news
```

**Tips:** `date` prints the parts with leading zeros (`08`), which Bash arithmetic reads as octal
and rejects, while `awk` reads `"08" + 0` as 8. In `awk`, `split(field, items, ",")` splits a list,
and `sub(/^[ \t]*([^ \t]+[ \t]+){5}/, "", line)` removes the five time fields from a copy of the line.
