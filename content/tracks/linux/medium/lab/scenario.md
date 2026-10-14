Larkspur Studio is a design studio of twelve people. Everyone records their hours per project,
and at the end of each month the office manager drops all the exports into one shared folder,
sorted by month and by person. Finance bills clients from the totals, and until now someone has
added them up by hand in a spreadsheet, which took a day and was wrong twice last quarter.

The exports come from three different places, and it shows:

```text
date,employee,project,hours
2026-09-01, Ben Okafor , BOREALIS , 8
2026-09-03,Ben Okafor,apollo,7,5
# 2026-09-03 was a public holiday
```

The spreadsheet on the office PC saves Windows line endings. The phone app never ends its files
with a newline. People type project names in any case, add spaces, leave comments, and now and
then write `7,5` for seven and a half hours. Other files land in the folder too: notes, backups,
old exports.

Finance wants a short report they can trust: the hours per project, the grand total, and how many
lines were rejected, so that someone can go and fix them before the invoices go out.
