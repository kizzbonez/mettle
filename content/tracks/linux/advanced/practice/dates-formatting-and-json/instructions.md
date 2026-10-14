Complete `solution.sh`. The tests run it as `bash solution.sh LOANS DATE`. LOANS is a JSON array
of loans such as `{"title": "Dune", "member": "li wei", "due": "2026-10-20", "returned": false}`;
`returned` may be missing, which means `false`. DATE is the day of the report: the script never
asks the clock for "today".

1. Write `day_number DATE`: the date as whole days since 1970-01-01, from `date -u -d DATE +%s`
   divided by 86400. Work in **UTC** (`-u`): the tests also run the script with `TZ` set to a
   zone that changes to summer time.
2. DATE must be written `YYYY-MM-DD` and be a real calendar date. Otherwise print
   `loans: invalid date: DATE` on standard error and exit with status 2. When LOANS is not a
   readable file, print `loans: cannot read LOANS` and exit with status 1. Both checks come
   before anything is printed or written.
3. With `jq -r` and `@tsv`, read the member, due date and title of every loan whose `returned`
   is not `true`, in file order, in a `while IFS=$'\t' read -r ...` loop. Member names may
   contain spaces.
4. A loan is **overdue** when DATE minus its due date is at least one day. For each overdue
   loan, print a row in the same columns as the header the starter prints:
   `printf '%-10s %-11s %4d  %s\n' MEMBER DUE DAYS TITLE`, with DUE shown as
   `date -u -d DUE '+%d %b %Y'` (`01 Oct 2026`). After the rows, print `N overdue`.
5. Also write `overdue.jsonl` in the current directory: one compact JSON object per overdue loan,
   in the same order, with the keys `member` and `title` (strings) and `days` (a **number**).
   Build each one with `jq -nc --arg ... --argjson ...`, never by pasting text together: titles
   can contain double quotes. The file is rewritten on every run, and is empty when nothing is
   overdue.

Example, with `data/loans.json`:

```text
$ bash solution.sh data/loans.json 2026-10-14
MEMBER     DUE         DAYS  TITLE
ana        01 Oct 2026   13  The Left Hand of Darkness
joe        13 Oct 2026    1  Piranesi
2 overdue
$ cat overdue.jsonl
{"member":"ana","title":"The Left Hand of Darkness","days":13}
{"member":"joe","title":"Piranesi","days":1}
```

Kindred was returned, Dune is not due yet, and Station Eleven is due on the day itself.
