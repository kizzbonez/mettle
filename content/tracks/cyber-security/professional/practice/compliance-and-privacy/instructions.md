Write two functions in `solution.py`. The starter gives `read_rows(path)` for CSV files (blank
lines are skipped). Dates are written `YYYY-MM-DD`.

1. `due_date(received)` returns the date one month after `received` (GDPR Art. 12(3)): the same
   day of the next month, or that month's last day when the day does not exist in it
   (`"2026-01-31"` gives `"2026-02-28"`).
2. `apply_requests(members_path, invoices_path, holds_path, requests_path, as_of)` returns a
   tuple `(members, outcomes)`:
   - `members_path` is a JSON list of member records (`id`, `name`, `email`, `marketing`,
     `restricted`); the returned `members` is a dictionary from `id` to its record, after the
     requests.
   - `invoices_path` is a CSV file `invoice,member,date`. Tax law keeps an invoice for 7 years:
     it is **retained** while its date is on or after the same day 7 years before `as_of`.
   - `holds_path` is a JSON list of legal holds; a hold whose `released` is `null` is active
     and covers the member ids in its `members` list.
   - `requests_path` is a CSV file `request,received,member,type,field,value`. Apply the
     requests in order of `received`, then `request` id, and give each an outcome:

   | `type` | Outcome and effect |
   | --- | --- |
   | any | `not-found` when the member is not (or no longer) in `members` |
   | `erasure` | `held` when the member is under an active hold: nothing changes. Otherwise `restricted` when the member has a retained invoice: keep the record but set `email` to `""`, `marketing` to `False` and `restricted` to `True`. Otherwise `erased`: remove the record |
   | `opt-out`, `objection` | `done`: set `marketing` to `False` (a hold does not stop this) |
   | `restriction` | `done`: set `restricted` to `True` (a hold does not stop this) |
   | `correction` | `held` under an active hold (a hold forbids altering data); `rejected` when `field` is not `name` or `email`; otherwise `done`: set that field to `value` |
   | anything else | `rejected` |

   `outcomes` is the list of `"REQUEST OUTCOME"` strings in the order applied.

**Example.** With the files in `data/` and `as_of="2026-10-16"`:

```python
due_date("2026-09-14")                      # '2026-10-14'
members, outcomes = apply_requests("data/members.json", "data/invoices.csv",
                                   "data/holds.json", "data/requests.csv", "2026-10-16")
outcomes
# ['DSR-0398 erased', 'DSR-0405 restricted', 'DSR-0409 held', 'DSR-0410 done',
#  'DSR-0411 done', 'DSR-0412 done', 'DSR-0415 not-found', 'DSR-0416 rejected']
members["M-1002"]
# {'id': 'M-1002', 'name': 'Jonas Berg', 'email': '', 'marketing': False, 'restricted': True}
sorted(members)                             # ['M-1002', 'M-1003', 'M-1004', 'M-1005']
```

Ana's only invoice (2018) is past retention, so her record is erased. Jonas's invoice of
2019-10-16 is exactly 7 years old and still retained, so his record is kept for the tax
authority and nothing else. Lea is under the injury claim's hold. Tomas's hold was released, so
his objection applies, but `date_of_birth` cannot be corrected through this job.

**Tips:** `date.fromisoformat` reads a date and `calendar.monthrange(year, month)[1]` gives the
number of days in a month. Sort the request rows with `key=lambda r: (r["received"], r["request"])`.
