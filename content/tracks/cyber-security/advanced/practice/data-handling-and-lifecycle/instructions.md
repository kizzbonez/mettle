Complete `solution.sh`. It is run as `bash solution.sh SCHEDULE RECORDS HOLDS REVIEW_DATE` and
decides, for each record, whether the retention schedule says to dispose of it, keep it, or hold
it. All three files are CSV with a header line; skip the header and blank lines. Dates are
`YYYY-MM-DD`, and no field contains a comma.

1. **Schedule** (`category,retain,trigger,disposal`): `retain` is a number of days (`30d`) or
   years (`25y`); `trigger` is the record field the period starts from, `created` or `closed`;
   `disposal` is the sanitization method.
2. **Holds** (`hold_id,applies_to,issued,released`): `applies_to` is a record ID or
   `category:<name>`. A hold is **active** when `issued` is on or before `REVIEW_DATE` and
   `released` is empty or after `REVIEW_DATE`.
3. **Records** (`record_id,category,created,closed`; `closed` may be empty). For each record, in
   file order, print the first line that applies:
   1. `REVIEW <id> no-schedule` when its category is not in the schedule;
   2. `HOLD <id> <hold_id>` when an active hold applies to it (its ID, or its category), naming
      the first such hold in file order. A legal hold overrides the schedule whatever the dates;
   3. `KEEP <id> open` when the trigger field is empty (the matter is not closed yet);
   4. otherwise the record is due on the trigger date plus the period: `DISPOSE <id> due <date>
      <disposal>` when `REVIEW_DATE` is on or after that date, else `KEEP <id> until <date>`.
      Years land on the same month and day; 29 February becomes 1 March in a year without one,
      which is what GNU `date -d "2020-02-29 +6 years" +%F` gives.
4. Finally print `SUMMARY <d> dispose, <h> hold, <k> keep, <r> review` and exit with status 0.

**Example.** `bash solution.sh data/schedule.csv data/records.csv data/holds.csv 2026-11-16`
prints

```text
DISPOSE INV-2019-0310 due 2025-05-20 secure-delete
KEEP INV-2021-0088 until 2027-02-11
HOLD CCTV-1009 LH-2026-03
HOLD CCTV-1102 LH-2026-03
HOLD STF-2018-0007 LH-2025-11
DISPOSE STF-2020-0031 due 2026-03-01 secure-delete
KEEP STF-2023-0012 open
DISPOSE ADM-2025-0410 due 2026-11-16 secure-delete
KEEP ADM-2025-0533 until 2026-11-17
DISPOSE PUP-2001-0142 due 2026-09-04 shred
REVIEW LIB-2022-0001 no-schedule
KEEP SAF-2019-0003 until 2045-01-15
SUMMARY 4 dispose, 3 hold, 4 keep, 1 review
```

The hold on the 2019 invoice was released in June, so it is disposed of; every CCTV recording is
held by the category hold; the staff file closed on 29 February 2020 is due on 1 March 2026.

**Tips.** `while IFS=, read -r id category created closed` reads one record per line, and an
associative array per schedule column keeps the schedule. `date -d "$start +30 days" +%F` adds a
period, and ISO dates compare correctly as text: `[[ $a < $b ]]`.
