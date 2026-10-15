---
title: Merging and Joining
summary: Combine tables that share a key with `merge` and `join`, choose the join type (including the anti joins new in pandas 3), see where every row came from, catch duplicate keys before they multiply rows, and stack tables with `concat`.
minutes: 40
objectives:
  - Merge two tables with inner, left, right and outer joins and explain which rows each keeps
  - Find unmatched rows with the `left_anti` and `right_anti` joins and with `indicator=True`
  - Merge on differently named keys and on the index, and resolve clashing column names with `suffixes`
  - Use `validate` to stop a merge whose duplicate keys would multiply rows
  - Stack tables with `concat`, using `ignore_index` and `keys`
---

## Outline

1. Two tables, one key
2. Join types and the `_merge` indicator
3. Anti joins: rows with no partner
4. Different key names and `suffixes`
5. Duplicate keys multiply rows: `validate`
6. Joining on the index
7. Stacking tables with `concat`

## Two tables, one key

Real data rarely arrives as one table. A climbing gym keeps its members in one table and every visit in another, and the column they share, `member_id`, is the **key** that links them:

```python
import pandas as pd

members = pd.DataFrame({
    "member_id": [101, 102, 103, 104],
    "name": ["Asha", "Bruno", "Chen", "Dara"],
    "plan": ["monthly", "student", "monthly", "day pass"],
})
visits = pd.DataFrame({
    "member_id": [101, 103, 101, 105, 103],
    "minutes": [90, 45, 60, 30, 75],
})
```

Each member appears once in `members`, but can appear many times in `visits`: a **one-to-many** relationship. Visitor 105 is not a member (perhaps a typing error), and Bruno and Dara never came. Those mismatches are what join types are about. The examples below use these two tables.

## Join types and the `_merge` indicator

`merge` matches rows whose keys are equal, the way a SQL join does. `how` decides what happens to rows without a match:

- `"inner"` (the default) keeps only keys found in both tables.
- `"left"` keeps every row of the left table; `"right"` every row of the right one.
- `"outer"` keeps every key from both, sorted.

Missing partners get `NaN`. `indicator=True` adds a `_merge` column saying where each row came from:

```python
print(members.merge(visits, on="member_id"))
print(members.merge(visits, on="member_id", how="outer", indicator=True))
```

```text
   member_id  name     plan  minutes
0        101  Asha  monthly       90
1        103  Chen  monthly       45
2        101  Asha  monthly       60
3        103  Chen  monthly       75
   member_id   name      plan  minutes      _merge
0        101   Asha   monthly     90.0        both
1        101   Asha   monthly     60.0        both
2        102  Bruno   student      NaN   left_only
3        103   Chen   monthly     45.0        both
4        103   Chen   monthly     75.0        both
5        104   Dara  day pass      NaN   left_only
6        105    NaN       NaN     30.0  right_only
```

The inner join has four rows: Bruno, Dara and visitor 105 are gone without a word. Do not rely on the row order of a merge; sort the result when order matters. The outer join keeps all seven, and `minutes` became float because it now holds `NaN`. A quick `value_counts()` of `_merge` is a good habit after any important merge.

## Anti joins: rows with no partner

Often the unmatched rows are the answer: members who never visited, or visits that belong to nobody. pandas 3 adds two **anti joins** for this. `"left_anti"` keeps left rows whose key is **not** in the right table, and `"right_anti"` the reverse:

```python
print(members.merge(visits, on="member_id", how="left_anti"))
print(members.merge(visits, on="member_id", how="right_anti"))
```

```text
   member_id   name      plan  minutes
2        102  Bruno   student      NaN
5        104   Dara  day pass      NaN
   member_id name plan  minutes
3        105  NaN  NaN       30
```

The result keeps the other table's columns, all empty. Do not rely on its index labels (2 and 5 here); call `reset_index(drop=True)` if you need clean ones. Before pandas 3 the same answer took an outer merge with `indicator=True` and a filter on `_merge == "left_only"`, which you will still see in older code.

## Different key names and `suffixes`

When the key has a different name in each table, give both with `left_on` and `right_on`. When both tables have a column of the same name that is not the key, pandas adds **suffixes** (`_x` and `_y` by default); choose clearer ones:

```python
staff = pd.DataFrame({"staff_id": ["S1", "S2"], "name": ["Mo", "Ines"]})
classes = pd.DataFrame({
    "name": ["Bouldering 101", "Ropes", "Yoga"],
    "instructor": ["S2", "S1", "S2"],
})
print(classes.merge(staff, left_on="instructor", right_on="staff_id",
                    suffixes=("_class", "_staff")))
```

```text
       name_class instructor staff_id name_staff
0  Bouldering 101         S2       S2       Ines
1           Ropes         S1       S1         Mo
2            Yoga         S2       S2       Ines
```

Both key columns are kept; drop one with `drop(columns="staff_id")` if you do not need it.

## Duplicate keys multiply rows: `validate`

If a key appears several times on **both** sides, every left row pairs with every matching right row. A price list that still holds last year's monthly price shows how quietly this goes wrong:

```python
prices = pd.DataFrame({
    "plan": ["monthly", "student", "day pass", "monthly"],
    "price": [45.0, 30.0, 12.0, 49.0],
})
joined = members.merge(prices, on="plan", how="left")
print(len(members), len(joined))
try:
    members.merge(prices, on="plan", how="left", validate="many_to_one")
except pd.errors.MergeError as error:
    print(error)
```

```text
4 6
Merge keys are not unique in right dataset; not a many-to-one merge

Duplicates in right:
    plan
monthly ...
```

Four members became six rows, and any total of `price` would be wrong. `validate` states the relationship you expect and raises `MergeError` before merging if the keys break it:

- `"one_to_one"` (`"1:1"`): keys unique on both sides.
- `"one_to_many"` (`"1:m"`): unique on the left.
- `"many_to_one"` (`"m:1"`): unique on the right, the usual case for a lookup table.

Comparing `len` before and after a left merge is the other cheap check: a left merge onto a lookup table must not add rows.

## Joining on the index

`DataFrame.join` matches on the **index** of the other table, and does a left join by default. It suits results of `groupby`, whose index is the key:

```python
minutes = visits.groupby("member_id")["minutes"].sum()
print(members.join(minutes, on="member_id"))
```

```text
   member_id   name      plan  minutes
0        101   Asha   monthly    150.0
1        102  Bruno   student      NaN
2        103   Chen   monthly    120.0
3        104   Dara  day pass      NaN
```

`on="member_id"` matches that column of `members` with the index of `minutes`. Without `on`, `join` matches index with index, as in `members.set_index("member_id").join(minutes)`. `merge` can do the same with `left_index=True` or `right_index=True`.

## Stacking tables with `concat`

`merge` puts tables side by side by key. `pd.concat` stacks tables that have the **same columns**, such as one file per month. `ignore_index=True` renumbers the rows, and `keys` labels where each part came from instead:

```python
september = pd.DataFrame({"member_id": [101, 103], "minutes": [90, 45]})
october = pd.DataFrame({"member_id": [101, 102, 104], "minutes": [60, 30, 120]})
print(pd.concat([september, october], ignore_index=True))
print(pd.concat([september, october], keys=["Sep", "Oct"]))
```

```text
   member_id  minutes
0        101       90
1        103       45
2        101       60
3        102       30
4        104      120
       member_id  minutes
Sep 0        101       90
    1        103       45
Oct 0        101       60
    1        102       30
    2        104      120
```

Without either, the index would hold 0, 1, 0, 1, 2. `keys` builds a two-level index, a **MultiIndex** (lesson 7). `axis=1` places tables side by side, aligned on the index. Collect the parts in a list and call `concat` once; concatenating inside a loop copies everything each time.

## Common mistakes

- **Many-to-many by accident.** A duplicate key in a lookup table multiplies rows silently. Pass `validate="many_to_one"` and compare lengths.
- **Keys of different types.** Merging an int `member_id` with one read as text raises `ValueError: You are trying to merge on int64 and str columns for key 'member_id'. If you wish to proceed you should use pd.concat`. Convert one side with `astype` first; `concat` is not the fix.
- **An inner join that drops rows.** The default `how="inner"` loses every unmatched key. Say `how="left"` when every left row must survive.
- **Concatenating tables with different column names.** `pd.concat([members, visits])` does not fail; it fills the missing columns with `NaN`. Check `columns` match first.

## Practice

1. List the members who visited at least once, each once, with only the members' columns.
2. Build a table of `name` and total `minutes`, with 0 for members who never came.
3. Count the visits made by unknown member ids, and find which plan in `prices` caused the extra rows.

### Answers

```python
print(members[members["member_id"].isin(visits["member_id"])])

report = members.join(minutes, on="member_id")
report["minutes"] = report["minutes"].fillna(0).astype(int)

print(len(members.merge(visits, on="member_id", how="right_anti")))
counts = prices["plan"].value_counts()
print(counts[counts > 1])
```

```text
   member_id  name     plan
0        101  Asha  monthly
2        103  Chen  monthly
1
plan
monthly    2
Name: count, dtype: int64
```

`isin` keeps each member once, which a merge would not: Asha would appear twice. The left join keeps all members, and `fillna(0)` turns the missing totals into zeros before `astype(int)` restores whole numbers.

## Key takeaways

- `how` decides which unmatched rows survive: inner, left, right, outer, and the new `left_anti` and `right_anti`.
- `indicator=True` labels each row `both`, `left_only` or `right_only`.
- Use `left_on`/`right_on` for different key names, and `suffixes` you can read.
- Duplicate keys on both sides multiply rows; `validate` and a length check catch it.
- `join` matches on the index; `concat` stacks tables with the same columns.

## Further reading

- [pandas user guide: Merge, join, concatenate and compare](https://pandas.pydata.org/docs/user_guide/merging.html)
- [API reference: pandas.merge](https://pandas.pydata.org/docs/reference/api/pandas.merge.html)
- [API reference: DataFrame.join](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.join.html)
- [What's new in pandas 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
