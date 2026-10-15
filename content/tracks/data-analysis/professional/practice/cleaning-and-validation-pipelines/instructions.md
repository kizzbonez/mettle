Write the three functions of `solution.py`. The export is `data/visits.csv`. Read it with
`pd.read_csv("data/visits.csv", dtype=TEXT)`, where `TEXT` (in the starter) makes `visit_id`,
`pet`, `species` and `date` text (`str`, a missing value is NaN) and `weight_kg` a `float64`;
the tests build their frames the same way. No function may change the frame it is given.

1. `find_reasons(visits)` returns a `str` Series named `reason`, with the same index as
   `visits`. For each row it holds the **first** of these rules the row breaks, in this order, or
   `""` when it breaks none:
   - `missing pet`: `pet` is missing, or empty once the spaces around it are removed;
   - `unknown species`: `species`, with the spaces around it removed and in lower case, is not
     `cat`, `dog` or `rabbit` (a missing species is unknown);
   - `bad date`: `date` is not a real date written `YYYY-MM-DD`, as
     `pd.to_datetime(visits["date"], format="%Y-%m-%d", errors="coerce")` reads it;
   - `bad weight`: `weight_kg` is missing or not between 0.1 and 90 inclusive;
   - `replaced`: a **later** row has the same `visit_id`. The desk re-sends a visit when it
     corrects it, so only the last row of a visit may be kept.
2. `split_visits(visits)` returns the tuple `(clean, quarantine)`. Both keep the rows in the order
   of `visits` and have the index 0 to n-1.
   - `clean` holds the rows whose reason is `""`, with the columns `visit_id`, `pet` (spaces
     around it removed), `species` (spaces removed, lower case), `date` (`datetime64[us]`) and
     `weight_kg`.
   - `quarantine` holds the other rows exactly as they are in `visits`, plus the column `reason`.
3. `reason_counts(quarantine)` returns how many rows of a quarantine fell to each reason: an
   `int64` Series indexed by the reasons that occur, in **alphabetical** order, with the index
   named `reason` and the Series named `count` (the names `value_counts` gives).

Example:

```python
visits = pd.read_csv("data/visits.csv", dtype=TEXT)
print(find_reasons(visits).tolist())
clean, quarantine = split_visits(visits)
print(clean.tail(2))
print(quarantine)
print(reason_counts(quarantine))
```

```text
['', '', '', 'missing pet', '', 'unknown species', 'replaced', 'bad date', 'bad weight', '', '', 'bad weight', '']
  visit_id    pet species       date  weight_kg
5    V2007   Luna     cat 2026-03-04        3.8
6    V2012  Maple     dog 2026-03-05        9.7
  visit_id      pet species        date  weight_kg           reason
0    V2004      NaN     dog  2026-03-03       22.5      missing pet
1    V2006   Goldie    fish  2026-03-03        0.2  unknown species
2    V2007     Luna     cat  2026-03-04       38.0         replaced
3    V2008   Pepper     cat  2026-02-30        4.4         bad date
4    V2009  Bramble     dog  2026-03-04      -12.0       bad weight
5    V2011   Shadow     cat  2026-03-05        NaN       bad weight
reason
bad date           1
bad weight         2
missing pet        1
replaced           1
unknown species    1
Name: count, dtype: int64
```

Luna's first weigh-in said 38 kg; the desk corrected it to 3.8 and sent the visit again, so the
first row is `replaced` and the second is kept. Rex's species ` Dog ` is fine once cleaned.

**Tips.** `duplicated(subset=..., keep=...)` decides which copies count as repeats.
`np.select(conditions, reasons, default="")` takes the first condition that is true. Missing
values are never `isin` a list.
