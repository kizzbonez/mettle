Complete `solution.sh`. It is run as `bash solution.sh REGISTER AS_OF`, where `AS_OF` is a date
such as `2026-10-16` and `REGISTER` is a CSV file with the header
`id,title,type,owner,approver,approved,review_months` (skip the header and empty lines). `type`
is `policy`, `standard`, `procedure`, `guideline` or `plan`, in any case; `approved` is the date
of the last approval.

The association's rules, checked for each document in file order and in this order:

1. Every document has an owner: print `NO-OWNER ID` when `owner` is empty.
2. Every document is approved: print `UNAPPROVED ID` when `approver` is empty.
3. A **policy** states management's intent, so its approver must be exactly `Board` or
   `Executive Committee`: otherwise (and when it has an approver) print
   `WRONG-APPROVER ID (APPROVER)`.
4. Documents are reviewed at least once a year, guidelines at least every two years: print
   `CYCLE ID (N months)` when `review_months` is more than 12, or more than 24 for a guideline.
5. The next review is due on `date -d "APPROVED +N months" +%F`, with `N` the document's
   `review_months`. Print `OVERDUE ID (due DATE)` when that date is **before** `AS_OF`. A review
   due on `AS_OF` itself is not overdue yet.

Exit with status 1 when anything was printed. Otherwise print `register in order` and exit with
status 0.

**Example.** `bash solution.sh data/documents.csv 2026-10-16` prints the following and exits
with status 1:

```text
OVERDUE POL-004 (due 2026-09-02)
WRONG-APPROVER POL-007 (CISO)
CYCLE STD-012 (36 months)
OVERDUE STD-012 (due 2026-06-01)
NO-OWNER PRO-031
OVERDUE GDL-002 (due 2026-10-15)
UNAPPROVED PLN-003
```

A password standard reviewed every three years may still demand the 90-day changes that NIST
SP 800-63B-4 no longer recommends. `POL-009` is written `Policy` and is due on 2026-10-16
itself, so it passes.

**Tips:** `while IFS=, read -r id title type owner approver approved months; do ... done`
reads a row; `${type,,}` is the type in lower case; `[[ $due < $as_of ]]` compares two dates
written `YYYY-MM-DD`.
