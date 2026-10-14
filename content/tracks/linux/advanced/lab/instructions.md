Complete `solution.sh`. The starter gives you the usage text, the functions to write and the
order of the work; keep `set -euo pipefail` and the `EXIT` trap. The tests run it as

```text
bash solution.sh [-n] [-k KEEP] [-d DAYS] [-r REPORT] -t YYYY-MM-DD DIR
```

**Options and arguments** (parse them with `getopts`; options come before `DIR`, and `--` ends them)

| Option | Meaning |
| --- | --- |
| `-k KEEP` | keep the newest KEEP backups of each database. A whole number, at least 1. Default 3. |
| `-d DAYS` | also keep every backup younger than DAYS days. A whole number, 0 or more. Default 7. |
| `-t DATE` | **required.** The date ages are measured from, written `YYYY-MM-DD` and a real calendar date. (Cron passes `$(date +%F)`; the tests pass fixed dates.) |
| `-r REPORT` | also write everything printed on standard output to the file REPORT (see step 5). |
| `-n` | dry run: print the plan exactly as usual, but delete nothing. |
| `-h` | print the usage text on standard output and exit 0. |
| `DIR` | exactly one operand: the backup directory. |

1. **Incorrect usage** exits with status **2** and prints nothing on standard output. On standard
   error print one line `rotate-backups: <reason>` and then the usage text. This covers an unknown
   option, an option without its value, a missing `-t`, a KEEP, DAYS or DATE that breaks the rules
   above, and anything other than exactly one `DIR`. The first line of the usage text must be
   `Usage: rotate-backups [-n] [-k KEEP] [-d DAYS] [-r REPORT] -t YYYY-MM-DD DIR` (the starter's
   `usage` already prints it).
2. If `DIR` is not a directory, print `rotate-backups: not a directory: DIR` on standard error and
   exit with status **1**.
3. **Which files are backups.** Look only at regular files directly inside `DIR` whose names do not
   start with a dot. A backup's name is `<database>-<YYYY-MM-DD>.sql.gz`, where the database name
   is everything before the last `-YYYY-MM-DD` and may contain spaces and hyphens
   (`crm-eu-2026-10-14.sql.gz` belongs to `crm-eu`). A name whose date is not a real calendar date,
   and every other file or directory, is not a backup: never list it and never delete it.
4. **What to keep.** Within each database, rank the backups newest first. A backup is **kept** if
   it is one of the newest KEEP of its database, **or** if its age is less than DAYS days, where the
   age is DATE minus the backup's date in whole days (so a backup exactly DAYS days old is not
   protected by `-d`, and a backup dated after DATE always is). Every other backup is **deleted**.
5. **Output.** Print one line per backup: databases in byte order (what `LC_ALL=C sort` gives,
   so `sales` comes before `sales team`), and within a database newest first. Each line is
   `printf '%-6s %s\n' ACTION FILENAME`, with ACTION `keep` or `delete`. Print each line and then,
   unless `-n` was given, delete the file of a `delete` line before moving on. Finally print
   `total: K kept, D deleted`, followed by ` (dry run)` with `-n`. A directory with no backups
   prints only `total: 0 kept, 0 deleted`. Exit with status 0.
6. **Failure while deleting.** If a backup cannot be deleted, stop at once: print
   `rotate-backups: cannot delete FILENAME` on standard error and exit with status 1.
7. **The report.** With `-r REPORT`, the report must appear all at once and only when the run
   succeeds. Create a temporary file with `mktemp` **in the same directory as REPORT**, write
   every output line to it as well, and at the very end move it over REPORT with `mv` (make it
   readable with `chmod 644` first). If the run fails at any point, REPORT keeps its old content
   and no temporary file is left behind: the `EXIT` trap's `cleanup` removes it. Any other
   temporary file you create must be removed too.
8. **ShellCheck.** The last test runs `shellcheck solution.sh` and passes only when it reports
   nothing at all.

Example, for the sample directory built from `data/sample-backups.txt`:

```text
$ bash solution.sh -n -k 2 -d 7 -t 2026-10-14 sample
keep   billing-2026-10-14.sql.gz
keep   billing-2026-10-13.sql.gz
keep   billing-2026-10-10.sql.gz
delete billing-2026-10-01.sql.gz
delete billing-2026-09-14.sql.gz
keep   crm-2026-10-12.sql.gz
keep   crm-2026-09-30.sql.gz
delete crm-2026-09-15.sql.gz
keep   crm-eu-2026-10-08.sql.gz
keep   crm-eu-2026-10-07.sql.gz
total: 7 kept, 3 deleted (dry run)
```

`billing-2026-10-10` is the third newest billing backup, beyond `-k 2`, but only four days old.
`README.txt` and `billing-latest.sql.gz` are not backups.

**Tips**

- `date -u -d 2026-10-14 +%s` gives epoch seconds and fails for an impossible date; divide by
  86400 for a day number. Working in UTC (`-u`) keeps every day 86400 seconds long.
- `[[ $name =~ ^(.+)-([0-9]{4}-[0-9]{2}-[0-9]{2})\.sql\.gz$ ]]` splits a name into
  `BASH_REMATCH[1]` and `BASH_REMATCH[2]`. Copy them into variables at once: the next `=~` test
  anywhere, including inside a function you call, replaces `BASH_REMATCH`.
- An associative array keyed by database name is a natural place to count how many backups of
  each database you have already ranked.
- With `set -e`, `(( count++ ))` and `local var=$(cmd)` behave in ways lesson 3 warns about.
- Run `bash -n solution.sh` and `shellcheck solution.sh` before you submit.
