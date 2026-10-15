---
title: Reports and Data Quality Checks
summary: Finish a pipeline with a report people can read and a check that the data still looks like last time. Build summary tables with totals using `pivot_table(margins=True)`, format money and percentages for plain text with `to_string`, compare a new batch with the previous one (row counts, missing values, ranges, new categories), and write the report to a file.
minutes: 35
objectives:
  - Build a summary table with row and column totals using `pivot_table(margins=True)`, and know how margins are computed
  - Format numbers and percentages for a text report with `to_string(formatters=...)`
  - Compare a new batch of data with the previous one and turn the differences into warnings
  - Assemble and write a plain-text report file
---

## Outline

1. What a report is for
2. Summary tables with totals
3. Formatting for text
4. Checking a new batch against the last
5. Writing the report file

## What a report is for

A pipeline's last step usually produces something for people: a weekly summary for a manager, a
file for a dashboard, an email. Two things make it trustworthy. The numbers must be easy to read
and add up, with totals that match. And the report must say when the data itself looks wrong,
because a summary of broken data is confidently wrong. A **data quality check** compares each new
**batch** (this week's file) with what normal looked like (last week's) and warns about the
differences before anyone acts on the numbers.

A small chain of cafés is the example: three cafés, takings by category of sale.

## Summary tables with totals

`pivot_table` (from the advanced level) groups by rows and columns and aggregates.
`margins=True` adds a row and a column of totals, named by `margins_name` (`"All"` by default):

```python
import numpy as np
import pandas as pd

sales = pd.DataFrame({
    "cafe": ["Harbour", "Harbour", "Harbour", "Station", "Station", "Park", "Park", "Park", "Harbour"],
    "category": ["coffee", "cake", "lunch", "coffee", "lunch", "coffee", "cake", "coffee", "coffee"],
    "revenue": [412.50, 96.00, 305.25, 388.00, 512.40, 140.75, 61.50, 133.25, 398.00],
})
table = sales.pivot_table(index="cafe", columns="category", values="revenue",
                          aggfunc="sum", fill_value=0, margins=True, margins_name="Total")
print(table)
```

```text
category   cake  coffee   lunch    Total
cafe                                    
Harbour    96.0   810.5  305.25  1211.75
Park       61.5   274.0    0.00   335.50
Station     0.0   388.0  512.40   900.40
Total     157.5  1472.5  817.65  2447.65
```

`fill_value=0` writes 0 where a café sold nothing in a category (Park serves no lunch) instead of
NaN. The margins are computed by applying `aggfunc` to the **underlying rows** of each row,
column and the whole table, not by adding the cells. For a sum that makes no difference. For a
mean it does:

```python
means = sales.pivot_table(index="cafe", values="revenue", aggfunc="mean", margins=True)
print(means)
print(sales.groupby("cafe")["revenue"].mean().mean())
```

```text
            revenue
cafe               
Harbour  302.937500
Park     111.833333
Station  450.200000
All      271.961111
288.3236111111111
```

The `All` row is the mean of all nine sales, 271.96, not the mean of the three café means, 288.32,
because Harbour had more sales than Station. Both are legitimate numbers, but they answer
different questions, so label the total row for what it is.

## Formatting for text

`print(table)` uses pandas' display settings, which suit exploring rather than reporting. For a
report you choose the format of each column. `DataFrame.to_string` returns the table as a string
and takes `formatters`, a dict from column name to a function that turns one value into text.
`"{:,.2f}".format` gives two decimals with thousands separators, and `"{:.1%}".format`
multiplies by 100 and adds a percent sign:

```python
report = table.assign(share=table["Total"] / table.loc["Total", "Total"])
money = "{:,.2f}".format
text = report.to_string(
    formatters={"cake": money, "coffee": money, "lunch": money, "Total": money, "share": "{:.1%}".format}
)
print(text)
```

```text
category   cake   coffee  lunch    Total  share
cafe                                           
Harbour   96.00   810.50 305.25 1,211.75  49.5%
Park      61.50   274.00   0.00   335.50  13.7%
Station    0.00   388.00 512.40   900.40  36.8%
Total    157.50 1,472.50 817.65 2,447.65 100.0%
```

Every amount now has two decimals and lines up; the share column reads as percentages, and the
shares of the three cafés add up to the 100.0% of the total row. Other useful parameters are
`float_format` (one function for every float column), `na_rep` (the text for missing values,
`"NaN"` by default) and `index=False`. Format only at the very end: a formatted column is text
and can no longer be summed.

`DataFrame.style` produces HTML for notebooks and web pages, not text, and needs the `jinja2`
package; `to_markdown` needs `tabulate`. Neither is installed in this course's sandbox, and
`to_string` needs nothing.

## Checking a new batch against the last

A batch can be wrong in ways no single row reveals: half the rows missing because one café's till
did not upload, a column suddenly full of gaps, values far outside anything seen before, or a
category nobody has heard of. Each is a simple comparison with the previous batch:

```python
last_week = pd.DataFrame({
    "day": pd.to_datetime(["2026-06-01"] * 3 + ["2026-06-02"] * 3),
    "cafe": ["Harbour", "Station", "Park"] * 2,
    "revenue": [810.0, 905.5, 270.0, 799.5, 880.0, 301.25],
})
this_week = pd.DataFrame({
    "day": pd.to_datetime(["2026-06-08"] * 4 + ["2026-06-09"] * 3),
    "cafe": ["Harbour", "Station", "Park", "Pier"] + ["Harbour", "Station", "Park"],
    "revenue": [826.0, np.nan, 295.0, 120.0, -45.0, np.nan, 288.5],
})


def batch_checks(previous, current, max_change=0.25, max_null_rise=0.05):
    """Compare a new batch with the previous one; return a list of warnings."""
    warnings = []
    change = len(current) / len(previous) - 1
    if abs(change) > max_change:
        warnings.append(f"row count {len(previous)} -> {len(current)} ({change:+.0%})")
    null_rise = current.isna().mean() - previous.isna().mean()
    for column, rise in null_rise[null_rise > max_null_rise].items():
        warnings.append(f"{column}: missing values up {rise:.0%}")
    low, high = previous["revenue"].min(), previous["revenue"].max()
    outside = current[~current["revenue"].between(low * 0.5, high * 1.5) & current["revenue"].notna()]
    if len(outside):
        warnings.append(f"revenue: {len(outside)} value(s) outside {low * 0.5:.2f} to {high * 1.5:.2f}")
    new = sorted(set(current["cafe"]) - set(previous["cafe"]))
    if new:
        warnings.append(f"cafe: new value(s) {', '.join(new)}")
    return warnings


for line in batch_checks(last_week, this_week):
    print("WARNING", line)
```

```text
WARNING revenue: missing values up 29%
WARNING revenue: 2 value(s) outside 135.00 to 1358.25
WARNING cafe: new value(s) Pier
```

- **Row count**: 6 rows to 7 is +17%, inside the 25% allowed, so no warning.
- **Null rate**: `isna().mean()` is the share of missing values per column, because `True`
  counts as 1. Two of seven revenues are missing (Station's till), up from none: 29 points.
- **Range**: values far outside last week's range, here a negative refund total and the new
  café's small number. The missing values are excluded, since they were already reported.
- **New categories**: a set difference finds `Pier`, a café that opened this week. Not an error,
  but someone should map it before it appears in reports.

The thresholds are judgement calls written as parameters, not buried constants. A check warns;
whether a warning stops the pipeline (failing loudly, lesson 8) or only appears in the report is
a decision about how bad that problem is.

## Writing the report file

The report is the formatted table plus the checks, assembled as lines and written in one go with
an explicit encoding:

```python
from pathlib import Path

lines = [
    "Weekly cafe report, 2026-06-08 to 2026-06-09",
    "",
    text,
    "",
    "Data checks:",
    *[f"  - {warning}" for warning in batch_checks(last_week, this_week)],
]
Path("report.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(Path("report.txt").read_text(encoding="utf-8"), end="")
```

```text
Weekly cafe report, 2026-06-08 to 2026-06-09

category   cake   coffee  lunch    Total  share
cafe                                           
Harbour   96.00   810.50 305.25 1,211.75  49.5%
Park      61.50   274.00   0.00   335.50  13.7%
Station    0.00   388.00 512.40   900.40  36.8%
Total    157.50 1,472.50 817.65 2,447.65 100.0%

Data checks:
  - revenue: missing values up 29%
  - revenue: 2 value(s) outside 135.00 to 1358.25
  - cafe: new value(s) Pier
```

Writing the whole file at once overwrites last run's report, so the step is idempotent (lesson 7).
The checks travel with the numbers, so a reader sees at once that Station's figures are
incomplete this week.

## Common mistakes

- **Totals of means.** A margin computed by `aggfunc="mean"` is the mean of all rows, not of the
  cells. Say which one the table shows.
- **Formatting too early.** After `map("{:.2f}".format)` a column is text: sums fail and sorting is
  alphabetical. Format in `to_string`, at the end.
- **Percentages twice.** `"{:.1%}"` multiplies by 100 itself; pass 0.495, not 49.5.
- **Comparing null counts across batches of different sizes.** Compare rates (`isna().mean()`).
- **Checks that only print.** Put the warnings in the report or the log, where the reader looks.

## Practice

1. Make the pivot table show the number of sales instead of revenue, with totals.
2. Add a check to `batch_checks` that warns when a café present last week is missing this week.
3. Format `report` with every float to one decimal, using a single parameter.

### Answers

```python
counts = sales.pivot_table(index="cafe", columns="category", values="revenue",
                           aggfunc="count", fill_value=0, margins=True)
gone = sorted(set(last_week["cafe"]) - set(this_week["cafe"]))
print(counts.loc["All", "All"], gone)
print(report.to_string(float_format="{:.1f}".format).splitlines()[2])
```

```text
9 []
Harbour   96.0   810.5  305.2 1211.8    0.5
```

1. `aggfunc="count"` counts the non-missing values; the corner cell counts all nine sales.
2. The reverse set difference; this week no café is missing, so the list is empty. Append a
   warning when it is not.
3. `float_format` applies one function to every float column, the share included, which loses
   its percent sign. 305.25 shows as 305.2: an exact half rounds to even (lesson 6).

## Key takeaways

- `pivot_table(margins=True, margins_name=...)` adds totals computed from the underlying rows.
- Format at the end with `to_string(formatters=...)`, `"{:,.2f}"` for money and `"{:.1%}"` for shares.
- Check each batch against the last: row counts, null rates, ranges and new categories.
- Write the report, warnings included, to a file in one go with an explicit encoding.

## Further reading

- [pandas: DataFrame.pivot_table](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.pivot_table.html)
- [pandas: DataFrame.to_string](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_string.html)
- [Python: Format specification mini-language](https://docs.python.org/3/library/string.html#format-specification-mini-language)
