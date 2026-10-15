Write the three functions of `solution.py`. None of them may change its input. The samples
are `data/sheet.csv` and `data/runs.csv`.

1. `sheet_to_long(sheet)` takes the coach's **wide** sheet: a column `runner`, then one column
   per week (named like `W01`) holding the km that runner reported, missing when they reported
   nothing. Return it in **long** form with exactly the columns `runner`, `week` (the week
   column's name) and `km`: one row per reported distance (a reported `0.0` is a distance; a
   gap is not), sorted by `runner`, then `week`, with the index `0, 1, 2, ...`. A sheet with no
   week columns gives a frame with those three columns and no rows.
2. `weekly_totals(runs)` takes a long log with the columns `runner`, `week` and `km` (float),
   where a runner may log **several runs in the same week**. Return a wide table: one row per
   runner (index named `runner`) and one column per week (columns named `week`), both sorted,
   holding that runner's total km in that week, `0.0` where they ran none. Add a row and a
   column labelled `All` (last) holding the totals. Round every value to 1 decimal.
3. `kit_table(orders)` takes the club's kit orders, with the columns `member`, `size` and `kit`,
   a **list** of item names (possibly empty, possibly naming an item twice). Return how many of
   each item were ordered in each size: one row per item (index named `kit`), one column per
   size (columns named `size`), both sorted, with `int64` counts and `0` where none. An item
   listed twice in an order counts twice; an empty order adds nothing, so a size whose orders
   are all empty has no column. At least one order holds an item.

Example:

```python
sheet = pd.read_csv("data/sheet.csv")
print(sheet_to_long(sheet))
runs = pd.read_csv("data/runs.csv")
print(weekly_totals(runs))
orders = pd.DataFrame({
    "member": ["Ade", "Bea", "Cal", "Dee"],
    "size": ["M", "S", "L", "M"],
    "kit": [["vest", "socks"], ["vest"], [], ["socks", "socks", "cap"]],
})
print(kit_table(orders))
```

```text
  runner week     km
0    Ade  W01  12.50
1    Ade  W03   8.00
2    Bea  W01   5.00
3    Bea  W02   6.50
4    Bea  W03   7.00
5    Dee  W01  21.00
6    Dee  W02  18.25
week     W01   W02  W03   All
runner                       
Ade     16.5   0.0  8.0  24.5
Bea      5.0   6.5  0.0  11.5
Dee      0.0  10.0  0.0  10.0
All     21.5  16.5  8.0  46.0
size   M  S
kit        
cap    1  0
socks  3  0
vest   1  1
```

Cal reported nothing, so he has no rows in long form. In `runs.csv`, Ade ran twice in `W01`
(12.5 and 4.0 km) and Bea twice in `W02`.

**Tips.** Name the new columns of `melt` with `var_name` and `value_name`. `pivot_table`
averages unless you pass `aggfunc`; `fill_value` and `margins=True` do the rest. `explode`
repeats the index label of a row for each of its items, and `crosstab` lines its two columns up
by index label, so explode with `ignore_index=True` first.
