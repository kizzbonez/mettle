Write the three functions of `solution.py`. The volunteers' file is `data/donations.csv`, with
the columns `Donor Name`, `Item Type`, `Weight (g)` (missing when nobody weighed the bag) and
`Date`. Never use `inplace`, and do not change the frames you are given.

1. `tidy_names(df)` returns the frame with every column name tidied: remove the spaces around
   it, make it lower case, delete the characters `(` and `)`, and replace each remaining space
   by `_`. So `Weight (g)` becomes `weight_g`. The values, rows and index stay as they are.
2. `drop_small(df, min_kg)` returns the rows whose `kg` column is **at least** `min_kg`, in
   their order and with their index labels. A missing `kg` is not at least anything.
3. `report(path, min_kg)` reads the CSV file at `path` and returns one row per item type, with
   the index named `item_type` and the columns `donations` (the number of donations counted,
   `int64`) and `total_kg` (their total weight in kg, rounded to 2). In this order:
   - tidy the column names with `tidy_names`;
   - drop the donations without a weight;
   - add `kg`, the weight in kilograms (`weight_g` divided by 1000);
   - keep the donations of at least `min_kg` kg with `drop_small`;
   - group by item type, count and total, and round;
   - sort by `total_kg`, largest first, keeping item types with equal totals in alphabetical
     order.

   **The rule of this lab:** the body of `report` is a **single `return` statement** (a
   docstring above it is allowed) holding one method chain, one step per line, which calls
   `tidy_names` and `drop_small` with `pipe`. A hidden test reads your file to check this.

Example:

```python
raw = pd.read_csv("data/donations.csv")
tidy_names(raw).columns.tolist()   # ['donor_name', 'item_type', 'weight_g', 'date']
print(report("data/donations.csv", 1.0))
```

```text
           donations  total_kg
item_type                     
rice               2      7.00
tins               2      6.80
pasta              1      1.50
cereal             1      1.25
```

The Corner Shop's tins were never weighed, and Lena's 500 g of pasta and the anonymous 750 g
of cereal are under 1 kg, so they are left out.

**Tips.** `rename(columns=func)` calls `func` on every column name. `df.pipe(func, a)` means
`func(df, a)`. Inside a chain, refer to the frame of the moment with `pd.col("name")` or a
lambda, never with an outer variable. `loc[pd.col("kg") >= min_kg]` and
`query("kg >= @min_kg")` both filter. `sort_values(..., kind="stable")` keeps the order that
ties already have, and `groupby` sorts the item types.
