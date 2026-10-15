---
title: Cleaning and Validation Pipelines
summary: Check data before you trust it. Find duplicates with `duplicated` and `drop_duplicates`, write a dataset's rules down as a schema and check them with plain pandas, set bad rows aside in a quarantine frame with the reason each one failed, and report what was kept.
minutes: 35
objectives:
  - Find and remove duplicate rows with `duplicated` and `drop_duplicates`, choosing `subset` and `keep`
  - Write a dataset's rules down as a schema and check required columns and dtypes against it
  - Turn row rules (missing values, ranges, allowed values, unique keys) into a reason for every bad row
  - Quarantine bad rows instead of dropping them, and report how many were kept and why the rest were not
---

## Outline

1. Why validate before you analyse
2. Duplicates: `duplicated` and `drop_duplicates`
3. Writing the rules down as a schema
4. Row rules and a reason for every bad row
5. Quarantine and the drop report

## Why validate before you analyse

Data that arrives from forms, sensors and other people's exports is never quite what you were
promised. A booking form submitted twice becomes two bookings; a price typed as `9,00` turns a
whole column into text; a class nobody offers appears because someone typed `boxing` in a free
text box. pandas will happily compute a mean over any of it, and the number will be wrong without
any error.

**Validation** means checking data against rules you wrote down before you use it. There are two
kinds of failure, and they deserve different treatment:

- **Structural problems**: a required column is missing, or a column has the wrong dtype. Nothing
  sensible can follow, so the pipeline should stop with a clear error. This is **failing loudly**.
- **Row problems**: one booking has a negative price, another an unknown class. The rest of the
  file is fine, so the bad rows are set aside in a separate frame, the **quarantine**, with the
  reason each failed, and the good rows go on.

## Duplicates: `duplicated` and `drop_duplicates`

`DataFrame.duplicated` returns a boolean Series that is `True` for each row that repeats an
earlier one. `drop_duplicates` removes those rows. Both take `subset`, the columns that decide
whether two rows are the same (all columns by default), and `keep`: `"first"` (the default) marks
every occurrence except the first, `"last"` every occurrence except the last, and `False` marks
them all.

```python
import io

import pandas as pd

csv = """booking_id,member,class,price
B101,Ana,spin,8.50
B102,Ben,yoga,9.00
B102,Ben,yoga,9.00
B103,Chloe,spin,8.50
B103,Chloe,pilates,9.50
"""
bookings = pd.read_csv(io.StringIO(csv))
print(bookings.duplicated().tolist())
print(bookings.duplicated(subset="booking_id").tolist())
print(bookings.duplicated(subset="booking_id", keep=False).tolist())
print(bookings.drop_duplicates(subset="booking_id", keep="last"))
```

```text
[False, False, True, False, False]
[False, False, True, False, True]
[False, True, True, True, True]
  booking_id member    class  price
0       B101    Ana     spin    8.5
2       B102    Ben     yoga    9.0
4       B103  Chloe  pilates    9.5
```

Row 2 is an **exact duplicate** of row 1, a form sent twice. Rows 3 and 4 differ in class but
share the **key** `B103`, the column that should identify a booking. Comparing whole rows misses
that conflict; `subset="booking_id"` finds it. `keep=False` marks every row involved, which is
what you want when you need to look at all of them rather than pick a winner. `keep="last"` keeps
the latest version, sensible when later rows are corrections. The index labels show which rows
survived; `ignore_index=True` would renumber them.

Duplicates hide behind small differences in text, so normalise before you compare. Missing
values count as equal to each other:

```python
members = pd.Series(["Ben", "ben ", " BEN", "Ana"])
print(members.duplicated().tolist())
print(members.str.strip().str.lower().duplicated().tolist())
print(pd.Series([None, None, "Ana"]).duplicated().tolist())
```

```text
[False, False, False, False]
[False, True, True, False]
[False, True, False]
```

## Writing the rules down as a schema

A **schema** is the description of what a dataset must look like: which columns exist, their
dtypes, and the rules each value must obey. You do not need a library to have one. A dictionary
from column name to dtype, checked by a short function, already catches the structural problems:

```python
SCHEMA = {"booking_id": "str", "member": "str", "class": "str", "date": "datetime64[us]", "price": "float64"}


def schema_problems(df, schema):
    """Return a list of the ways DF's columns do not match SCHEMA."""
    problems = [f"missing column: {name}" for name in schema if name not in df.columns]
    for name, dtype in schema.items():
        if name in df.columns and str(df[name].dtype) != dtype:
            problems.append(f"{name}: expected {dtype}, got {df[name].dtype}")
    return problems


csv = "booking_id,member,class,price\nB101,Ana,spin,8.50\nB102,Ben,yoga,\"9,00\"\n"
bookings = pd.read_csv(io.StringIO(csv))
print(schema_problems(bookings, SCHEMA))
```

```text
['missing column: date', 'price: expected float64, got str']
```

One `9,00` was enough to make `price` a `str` column: `read_csv` gives a column the type that
fits every value. The function collects every problem instead of stopping at the first, so one
run tells the sender everything to fix. A pipeline calls it first and raises
`ValueError("; ".join(problems))` when the list is not empty. Comparing `str(dtype)` with the
names pandas prints (`"str"`, `"int64"`, `"datetime64[us]"`) keeps the schema readable.

## Row rules and a reason for every bad row

Each row rule is a boolean Series that is `True` where a row breaks it, built with the tools you
already know: `isna`, `isin` for **allowed values**, `between` for **ranges**,
`pd.to_datetime(..., errors="coerce")` for dates, and `duplicated` for a **unique key**. Keep them
in a dictionary from reason to mask, in the order you want them checked. `np.select` then picks,
for each row, the reason of the **first** rule that is true:

```python
import numpy as np

CLASSES = {"spin", "yoga", "pilates"}
csv = """booking_id,member,class,date,price
B101,Ana,spin,2026-05-04,8.50
B102,Ben,yoga,2026-05-04,9.00
B103,,yoga,2026-05-05,9.00
B104,Dev,boxing,2026-05-05,8.50
B105,Eli,spin,2026-13-01,8.50
B106,Fay,pilates,2026-05-06,-9.50
B102,Ben,yoga,2026-05-04,9.00
"""
bookings = pd.read_csv(io.StringIO(csv))
dates = pd.to_datetime(bookings["date"], format="%Y-%m-%d", errors="coerce")
rules = {
    "missing member": bookings["member"].isna(),
    "unknown class": ~bookings["class"].isin(CLASSES),
    "bad date": dates.isna(),
    "price out of range": ~bookings["price"].between(0, 50),
    "duplicate id": bookings.duplicated(subset="booking_id"),
}
reason = pd.Series(np.select(list(rules.values()), list(rules), default=""), index=bookings.index)
print(bookings.assign(reason=reason))
```

```text
  booking_id member    class        date  price              reason
0       B101    Ana     spin  2026-05-04    8.5                    
1       B102    Ben     yoga  2026-05-04    9.0                    
2       B103    NaN     yoga  2026-05-05    9.0      missing member
3       B104    Dev   boxing  2026-05-05    8.5       unknown class
4       B105    Eli     spin  2026-13-01    8.5            bad date
5       B106    Fay  pilates  2026-05-06   -9.5  price out of range
6       B102    Ben     yoga  2026-05-04    9.0        duplicate id
```

Every check runs on the whole column at once, so this stays fast on millions of rows. Month 13
does not exist, so `to_datetime` gave `NaT` and the row became `bad date`. Order matters: a row
that breaks two rules gets the first reason, so put the most basic checks first. Here duplicates
are checked over all rows; a stricter pipeline looks for them only among rows that passed the
other rules, so that a broken copy cannot push out a good booking.

## Quarantine and the drop report

With the reasons in hand, splitting the data is two boolean selections. The bad rows keep their
original values, so whoever fixes the source can see exactly what arrived:

```python
bad = reason != ""
clean = bookings[~bad].assign(date=dates[~bad])
quarantine = bookings[bad].assign(reason=reason[bad])
quarantine.to_csv("quarantine.csv", index=False)
print(f"kept {len(clean)} of {len(bookings)} rows ({len(clean) / len(bookings):.0%})")
print(quarantine["reason"].value_counts().sort_index().to_string())
```

```text
kept 2 of 7 rows (29%)
reason
bad date              1
duplicate id          1
missing member        1
price out of range    1
unknown class         1
```

The clean frame gets the parsed dates; the quarantine keeps the text. The **drop report**, how
many rows were kept and how many fell to each reason, is what makes a pipeline trustworthy: a
sudden jump in `unknown class` tells you the booking system changed before anyone asks why the
numbers moved.

## Common mistakes

- **Dropping duplicates on whole rows when the data has a key.** `drop_duplicates()` keeps both
  `B103` rows because their classes differ. Decide what identifies a row and pass it as `subset`.
- **Comparing before normalising.** `"Ben"` and `"ben "` are different strings. Strip and lower
  text columns first.
- **Silently filtering.** `bookings[bookings["price"] > 0]` throws the evidence away. Quarantine
  with a reason, then decide.
- **Forgetting parentheses.** `bookings["price"] > 0 & bookings["price"] < 50` evaluates
  `0 & bookings["price"]` first and fails with `TypeError: Cannot perform 'rand_' with a dtyped
  [float64] array and scalar of type [bool]`. Write `(bookings["price"] > 0) & (bookings["price"] < 50)`,
  or `between`.
- **Checking text columns against `object`.** In pandas 3, `bookings["member"].dtype == object` is
  `False`: text columns are `str`. Compare with `"str"`.

## Practice

1. Mark every row of a member who booked the same class twice on the same date, keeping all of
   them for a human to look at.
2. In the rules above, why must `"missing member"` come before a rule that checks members against
   a list of known members?
3. Print the share of rows that fell to each reason, as percentages of all rows.

### Answers

```python
twice = bookings.duplicated(subset=["member", "class", "date"], keep=False)
print(bookings[twice])
print((quarantine["reason"].value_counts() / len(bookings) * 100).round(1))
```

1. `keep=False` marks every member of each duplicate group, not just the repeats.
2. A missing member is also "not in the list", so the later rule would report the less precise
   reason. The first true rule wins in `np.select`.
3. Divide the counts by the number of rows read, not by the number quarantined.

## Key takeaways

- `duplicated` marks repeats and `drop_duplicates` removes them; choose `subset` (the key) and
  `keep` (`"first"`, `"last"` or `False`) deliberately, after normalising text.
- Write a schema down; stop with a clear error when columns or dtypes are wrong.
- Express each row rule as a boolean Series and let `np.select` give each row its first reason.
- Quarantine bad rows with their original values and a reason instead of dropping them.
- Report rows read, kept and quarantined by reason every time the pipeline runs.

## Further reading

- [pandas: DataFrame.duplicated](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.duplicated.html)
- [pandas: DataFrame.drop_duplicates](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.drop_duplicates.html)
- [pandas: Series.between](https://pandas.pydata.org/docs/reference/api/pandas.Series.between.html)
- [NumPy: numpy.select](https://numpy.org/doc/stable/reference/generated/numpy.select.html)
