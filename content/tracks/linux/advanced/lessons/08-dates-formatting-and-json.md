---
title: Dates, Formatting and JSON
summary: Print and parse dates with GNU `date`, do date arithmetic without being caught by month ends and time zones, line output up in columns with `printf`, and read, filter and build JSON safely with `jq`.
minutes: 30
objectives:
  - Format a given date with `date -d` and `+FORMAT`, convert to and from epoch seconds, and validate a date
  - Add days to a date and count the days between two dates, and explain why `+1 month` and local time can surprise you
  - Produce aligned columns with `printf` field widths and precision
  - Extract and filter fields from JSON with `jq -r`, and build JSON from shell variables with `--arg` and `--argjson`
---

## Outline

1. Formatting dates
2. Date arithmetic
3. Aligned output with `printf`
4. Reading JSON with `jq`
5. Writing JSON with `jq`

## Formatting dates

GNU `date` prints the current time by default, but scripts mostly use it to turn a *given* date into another format. `-d STRING` (`--date`) says which moment to use, and an argument starting with `+` is the output format, built from `%` sequences:

| Sequence | Meaning | Sequence | Meaning |
| --- | --- | --- | --- |
| `%Y` `%m` `%d` | year, month, day | `%F` | `%Y-%m-%d` |
| `%H` `%M` `%S` | hour, minute, second | `%T` | `%H:%M:%S` |
| `%A` `%B` | weekday and month names | `%j` `%V` | day of year, ISO week |
| `%s` | seconds since the epoch | `%z` | offset from UTC |

The **epoch** is 1970-01-01 00:00:00 UTC; counting seconds from it turns a moment into one plain number that is easy to compare and subtract. `-d @SECONDS` converts back. A `-` after the `%` removes padding (`%-d` gives `3`, not `03`). `-u` uses UTC for both input and output; without it, `date` uses the local time zone (the `TZ` variable), so the same command can print different results on two servers.

```bash
when='2026-03-28 14:05:09'
date -u -d "$when" '+%F %T'
date -u -d "$when" '+%A %-d %B %Y, ISO week %V, day %j of the year'
date -u -d "$when" +%s
date -u -d @1774706709 --iso-8601=seconds
date -u -d "$when" '+%Y%m%d-%H%M%S'
```

```text
2026-03-28 14:05:09
Saturday 28 March 2026, ISO week 13, day 087 of the year
1774706709
2026-03-28T14:05:09+00:00
20260328-140509
```

The last format is the usual choice for file names: it sorts correctly as plain text and contains no spaces or colons. Notice that every example passes the date in. A script that calls `date` for "now" deep inside becomes impossible to test; read "now" once at the top, or accept it as an option, and pass it down.

## Date arithmetic

`date -d` understands relative items: `+ 30 days`, `- 2 weeks`, `next friday`. For a difference between two dates, convert both to epoch seconds and subtract. An invalid date makes `date` fail with status 1, which is a cheap way to validate input.

```bash
date -u -d '2026-10-14 + 30 days' +%F
date -u -d '2026-10-14 - 2 weeks' +%F
date -u -d '2026-01-31 + 1 month' +%F
start=$(date -u -d 2026-10-14 +%s)
end=$(date -u -d 2026-12-25 +%s)
echo "$(( (end - start) / 86400 )) days until 25 December"
date -u -d 2026-02-30 +%F; echo "status $?"
```

```text
2026-11-13
2026-09-30
2026-03-03
72 days until 25 December
date: invalid date ‘2026-02-30’
status 1
```

The third line is a classic surprise. GNU `date` moves the month on and keeps the day, and 31 February does not exist, so it rolls over into March. If you need "the last day of next month", ask for the first day of the month after and subtract one day. Dividing by 86400 is safe here only because of `-u`: in a local zone with daylight saving time, one day a year has 23 hours and one has 25, and the division can come out one short. Do date arithmetic in UTC.

## Aligned output with `printf`

You met `printf FORMAT ARGS...` for plain output. Its conversions also take a **width** and a **precision**, which is how scripts print tables without `column`. `%-8s` is a string left-aligned in 8 characters; `%5d` an integer right-aligned in 5; `%7.1f` a number in 7 characters with one decimal. `%%` is a literal percent sign. If there are more arguments than conversions, the format is **reused** until they run out, so one format line can print a whole table.

```bash
printf '%-8s %5s %8s\n' HOST CPU MEMORY
printf '%-8s %4d%% %7.1fG\n' web01 7 1.5 db01 63 12.34 cache01 100 0.76
printf '%05d|%x|%o|%.3e\n' 42 255 8 1234.5
printf -v stamp '%(%Y-%m-%d %H:%M)T' 1774706709
echo "stamp: $stamp"
printf '%d\n' 3.5
```

Run with `TZ=UTC bash table.sh; echo "status $?"`:

```text
HOST       CPU   MEMORY
web01       7%     1.5G
db01       63%    12.3G
cache01   100%     0.8G
00042|ff|10|1.234e+03
stamp: 2026-03-28 14:05
table.sh: line 6: printf: 3.5: invalid number
3
status 1
```

Bash's builtin `printf` has two extras. `-v var` stores the result in a variable instead of printing it, and `%(FORMAT)T` formats epoch seconds like `date` does without starting a process (it uses the local zone, hence `TZ=UTC`). The last line is a common error: `%d` wants an integer, so Bash complains, prints what it could and returns 1. Bash arithmetic has no decimals; use `%f` or `bc` for fractions.

## Reading JSON with `jq`

**JSON** (JavaScript Object Notation) is the text format of most web APIs and many tools: **objects** in `{ }` map keys to values, **arrays** in `[ ]` hold ordered values, and values are strings, numbers, `true`, `false` or `null`. Parsing it with `grep` and `sed` breaks as soon as the layout changes. `jq` is a small language for it: you give it a **filter**, and it applies the filter to its input. The sandbox has `jq` 1.6.

- `.` is the whole input; `.name` a key; `.[0]` an array element; `.[]` every element in turn.
- `|` passes each result into the next filter, as in the shell.
- `select(cond)` keeps only results for which `cond` is true.
- `-r` prints strings raw, without JSON quotes, which is what shell variables want.
- `"\(.name)"` builds a string; `@tsv` turns an array into a tab-separated line.
- `a // b` gives `b` when `a` is `null` or `false`.

```bash
jq '.[0].name' servers.json
jq -r '.[].name' servers.json
jq -r '.[] | select(.cpu > 50) | "\(.name) is at \(.cpu)%"' servers.json
jq -r '.[] | [.name, .role, (.tags | length)] | @tsv' servers.json
jq '[.[] | .cpu] | add / length' servers.json
jq -r '.[0].owner // "nobody"' servers.json
```

With `servers.json` holding three objects such as `{"name": "web01", "role": "web", "cpu": 7, "tags": ["prod", "eu"]}`:

```text
"web01"
web01
db01
test01
db01 is at 63%
test01 is at 91%
web01	web	2
db01	db	1
test01	web	0
53.666666666666664
nobody
```

To loop over records in Bash, combine `@tsv` with `read`: `while IFS=$'\t' read -r name cpu; do ...; done < <(jq -r '.[] | [.name, .cpu] | @tsv' servers.json)`. A missing key gives `null`, not an error. If a script must notice that, use `-e`: `jq` then exits 1 when the last result is `null` or `false`, and 4 when there was no result at all.

## Writing JSON with `jq`

Building JSON by pasting variables into a string, as in `echo "{\"note\": \"$note\"}"`, breaks the moment a value contains a quote or a backslash, and can let input inject extra fields. Let `jq` do the quoting: `--arg name value` binds `$name` to a *string*, `--argjson name value` binds it to parsed JSON (a number, `true`, an object), and `-n` starts from no input.

```bash
host=web01
note='said "hello" at 09:00'
jq -n --arg host "$host" --argjson cpu 42 --arg note "$note" \
  '{host: $host, cpu: $cpu, note: $note, checked: true}'
jq -c --arg n db01 'map(if .name == $n then .role = "primary" else . end) | .[1]' servers.json
```

```text
{
  "host": "web01",
  "cpu": 42,
  "note": "said \"hello\" at 09:00",
  "checked": true
}
{"name":"db01","role":"primary","cpu":63,"tags":["prod"]}
```

`-c` prints compact one-line JSON. `jq` never edits a file in place: write to a temporary file and move it over the original (lesson 9), because `jq ... f > f` empties `f` before `jq` reads it.

## Common mistakes

- **Formatting dates in the local zone** and getting different results on different servers. Use `-u`.
- **Trusting `+1 month`** at the end of a month.
- **Forgetting `-r`**, so values keep their JSON quotes.
- **Building JSON with `echo`** and string pasting.
- **`%d` with a decimal**, which fails.

## Practice

1. Print yesterday's date for a given day `d=2026-03-01` as `YYYY-MM-DD`.
2. Print the names of the `web` servers in `servers.json`, one per line.
3. Produce `{"user":"ana","groups":["ops","dev"]}` from `user=ana` and the array `groups=(ops dev)`.

### Answers

1. `date -u -d "$d - 1 day" +%F` prints `2026-02-28`.
2. `jq -r '.[] | select(.role == "web") | .name' servers.json` prints `web01` and `test01`.
3. Pass the array as positional arguments with `--args`, which `jq` exposes as `$ARGS.positional`:

   ```bash
   jq -nc --arg user "$user" '{user: $user, groups: $ARGS.positional}' --args "${groups[@]}"
   ```

## Key takeaways

- `date -u -d DATE +FORMAT` formats a given moment; `%s` and `@N` convert to and from epoch seconds.
- Do date arithmetic in UTC with epoch seconds; month arithmetic rolls over.
- `printf` widths (`%-8s`, `%5d`, `%7.1f`) align columns, and the format repeats for extra arguments.
- `jq -r` extracts, `select` filters, `@tsv` feeds `read`; `--arg` and `--argjson` build JSON safely.

## Further reading

- [Linux manual page: date(1)](https://man7.org/linux/man-pages/man1/date.1.html)
- [Linux manual page: printf(1)](https://man7.org/linux/man-pages/man1/printf.1.html)
- [jq 1.6 manual](https://jqlang.org/manual/v1.6/)
