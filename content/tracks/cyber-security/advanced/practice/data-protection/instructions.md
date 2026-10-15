Write two functions in `solution.py`. The rows are the dicts `csv.DictReader` gives for
`data/customers.csv` (all values are strings). Use `REFERENCE_DATE` from the starter.

1. `protect(rows, key)` returns a new list with one dict per row that may be shared, in the same
   order. `key` is the secret pseudonymization key (`bytes`), kept in the key vault, never in the
   export.
   - **Filter rows:** keep only rows whose `research_consent`, without surrounding spaces and in
     lower case, is `yes`.
   - **Filter columns:** the result has exactly these keys, in this order:
     `pid`, `area`, `age_band`, `card`, `plan`, `monthly_spend`. Names, emails, phones and the
     free-text `notes` are not copied.
   - `pid` (pseudonym): the first 12 characters of the hex HMAC-SHA256 of `customer_id` (without
     surrounding spaces, UTF-8) with `key`. The same customer always gets the same `pid`, and
     nobody without the key can recompute it.
   - `area` (generalize): the postcode with every space removed, in upper case, without its last
     three characters (the outward code: `"bs6  2pl"` is `BS6`).
   - `age_band` (generalize): the age in whole years on `REFERENCE_DATE` (a birthday on that day
     counts), as a band of ten: `"30-39"`, `"0-9"`, and `"90+"` for 90 and over.
   - `card` (mask): the digits of `card_number` (spaces and hyphens removed), all but the last
     four replaced with `*`; `""` when there is no card number.
   - `plan` and `monthly_spend`: copied unchanged.
2. `small_groups(records, k)` takes `protect`'s result and returns the combinations of the
   quasi-identifiers `area` and `age_band` shared by **fewer than** `k` records, as a list of
   tuples `(area, age_band, count)` sorted by area, then age band (as text).

**Example.** With `key = b"lumen-research-key-2026"` and the rows of `data/customers.csv`
(`REFERENCE_DATE` is 2026-12-01):

```python
protected = protect(rows, b"lumen-research-key-2026")
len(protected)   # 7: Chloe said no, Hana left the field empty
protected[0]
# {'pid': 'c82a4959360a', 'area': 'BS1', 'age_band': '30-39', 'card': '************1111',
#  'plan': 'fibre-500', 'monthly_spend': '42.00'}
protected[2]
# {'pid': '719b05370c4b', 'area': 'BS1', 'age_band': '90+', 'card': '***********0005',
#  'plan': 'landline', 'monthly_spend': '12.00'}
small_groups(protected, 2)
# [('BS1', '90+', 1), ('BS3', '10-19', 1), ('BS6', '40-49', 1)]
```

Ben was born on 1974-12-01, so he is 52 on the reference date; Ivan, born on 1966-12-02, is
still 59. The 15-digit card number keeps 11 stars.

**Tips.** `hmac.new(key, text.encode(), hashlib.sha256).hexdigest()` gives the hex digest.
Subtract one from `REFERENCE_DATE.year - born.year` when `(month, day)` of the reference date
comes before the birthday's. `collections.Counter` counts tuples.
