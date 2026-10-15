---
title: "Reshaping: Pivot, Melt, Stack"
summary: Move data between long and wide shapes. Spread a column into columns with `pivot` and `pivot_table`, gather columns back into rows with `melt`, move index levels with `stack` and `unstack`, count combinations with `crosstab`, and give each item of a list its own row with `explode`.
minutes: 40
objectives:
  - Tell long data from wide data and say which shape a task needs
  - Use `pivot` for unique pairs and `pivot_table` with `aggfunc`, `fill_value` and `margins` when pairs repeat
  - Turn a wide table back into long form with `melt`
  - Move a level between the index and the columns with `stack` and `unstack`
  - Count combinations with `crosstab` and expand list values with `explode`
---

## Outline

1. Long and wide data
2. `pivot`: long to wide
3. `pivot_table`: when pairs repeat
4. `melt`: wide to long
5. `stack` and `unstack`
6. `crosstab` and `explode`

## Long and wide data

The same facts can be laid out in two shapes. In **long** (or "tidy") data each row is one observation and each column one variable: a café's till writes one row per day, drink and till. In **wide** data one variable is spread across the columns: one row per day, one column per drink, the way a person would lay out a report.

Long data is what `groupby`, `merge` and filters work best on, and what files and databases usually hold. Wide data is easier to read and compare, and some calculations, such as a difference between two columns, need it. Reshaping moves between them without retyping anything. The examples use the café's long sales table:

```python
import pandas as pd

sales = pd.DataFrame({
    "day": ["Mon", "Mon", "Mon", "Tue", "Tue", "Wed", "Wed", "Wed"],
    "drink": ["latte", "tea", "mocha", "latte", "tea", "latte", "tea", "tea"],
    "cups": [40, 25, 12, 38, 30, 45, 20, 8],
})
```

Wednesday's tea appears twice: the café has two tills.

## `pivot`: long to wide

`pivot(index=..., columns=..., values=...)` makes the unique values of `index` the rows, the unique values of `columns` the columns, and fills the cells from `values`. It only moves data, so every (index, column) pair must occur once:

```python
first_till = sales.drop(index=7)
print(first_till.pivot(index="day", columns="drink", values="cups"))
try:
    sales.pivot(index="day", columns="drink", values="cups")
except ValueError as error:
    print(error)
```

```text
drink  latte  mocha   tea
day                      
Mon     40.0   12.0  25.0
Tue     38.0    NaN  30.0
Wed     45.0    NaN  20.0
Index contains duplicate entries, cannot reshape
```

Without the second till's row, each pair is unique and the pivot works. No mocha was sold on Tuesday or Wednesday, so those cells are `NaN`, which makes the column float. With both tills, Wednesday's tea has two values and `pivot` refuses to choose.

## `pivot_table`: when pairs repeat

`pivot_table` groups by the index and column values and **aggregates** each cell, like a `groupby` laid out as a grid. Its `aggfunc` defaults to `"mean"`, which is rarely right for counts, so always name it. `fill_value` replaces empty cells, and `margins=True` adds totals labelled `All`:

```python
wide = sales.pivot_table(index="day", columns="drink", values="cups",
                         aggfunc="sum", fill_value=0, margins=True)
print(wide)
```

```text
drink  latte  mocha  tea  All
day                          
Mon       40     12   25   77
Tue       38      0   30   68
Wed       45      0   28   73
All      123     12   83  218
```

Wednesday's tea is now 20 + 8 = 28, and the integer type survived because no cell was left empty. Rows and columns are sorted (`sort=True`), here alphabetically. Several `aggfunc` values or several `values` columns give a two-level column header, a MultiIndex (lesson 7). As with `groupby`, pandas 3 shows only categories that occur (`observed=True`).

## `melt`: wide to long

`melt` is the reverse. Columns named in `id_vars` stay as they are; every other column is folded into two: one holding the old column name (`var_name`) and one holding the value (`value_name`). A spreadsheet typed by the manager arrives wide:

```python
wide = pd.DataFrame({
    "day": ["Mon", "Tue", "Wed"],
    "latte": [40, 38, 45],
    "mocha": [12, 0, 0],
    "tea": [25, 30, 28],
})
long = wide.melt(id_vars="day", var_name="drink", value_name="cups")
print(long)
```

```text
   day  drink  cups
0  Mon  latte    40
1  Tue  latte    38
2  Wed  latte    45
3  Mon  mocha    12
4  Tue  mocha     0
5  Wed  mocha     0
6  Mon    tea    25
7  Tue    tea    30
8  Wed    tea    28
```

Three rows times three drink columns gives nine rows. `value_vars=["latte", "tea"]` would melt only those columns. Without `var_name` and `value_name`, the new columns are called `variable` and `value`, which tells a later reader nothing.

## `stack` and `unstack`

A `groupby` on two keys returns a Series with a two-level index. `unstack` moves the **last** index level into the columns, and `stack` moves the columns back into the innermost index level:

```python
totals = sales.groupby(["day", "drink"])["cups"].sum()
table = totals.unstack(fill_value=0)
print(table)
print(table.stack().head(4))
```

```text
drink  latte  mocha  tea
day                     
Mon       40     12   25
Tue       38      0   30
Wed       45      0   28
day  drink
Mon  latte    40
     mocha    12
     tea      25
Tue  latte    38
dtype: int64
```

`totals.unstack()` is the same table `pivot_table` built, starting from a grouped result instead of a column. `unstack(level="day")` or `unstack(0)` would move the other level. In pandas 3, `stack` keeps missing values: stacking the table from the `pivot` example gives rows for Tuesday's and Wednesday's mocha with `NaN`, where pandas 2 dropped them. Follow it with `dropna()` if you want them gone. `table.stack().reset_index(name="cups")` turns the result back into an ordinary long table.

## `crosstab` and `explode`

`pd.crosstab` counts how often each combination of two columns occurs, a pivot table of counts without needing a value column:

```python
orders = pd.DataFrame({
    "drink": ["latte", "tea", "latte", "mocha", "latte", "tea"],
    "size": ["large", "small", "small", "large", "large", "large"],
})
print(pd.crosstab(orders["drink"], orders["size"], margins=True))
```

```text
size   large  small  All
drink                   
latte      2      1    3
mocha      1      0    1
tea        1      1    2
All        4      2    6
```

Lesson 10 adds `normalize=` to turn the counts into proportions.

Sometimes a cell holds a list: the extras of one order. `explode` gives every item its own row, repeating the other columns and the index label. An empty list becomes one row with `NaN`:

```python
orders = pd.DataFrame({
    "order": [1, 2, 3, 4],
    "extras": [["oat milk"], ["oat milk", "extra shot"], [], ["syrup"]],
})
print(orders.explode("extras"))
```

```text
   order      extras
0      1    oat milk
1      2    oat milk
1      2  extra shot
2      3         NaN
3      4       syrup
```

After exploding, `value_counts` counts each extra; `ignore_index=True` renumbers the rows. Lesson 4 shows how to split a text column such as `"oat milk, syrup"` into lists first.

## Common mistakes

- **`pivot` on repeated pairs.** `ValueError: Index contains duplicate entries, cannot reshape` means some (index, column) pair occurs twice. Use `pivot_table` with an explicit `aggfunc`, or remove the true duplicates.
- **Trusting the default `aggfunc`.** `pivot_table` averages by default, so Wednesday's tea would show 14.0 instead of 28. Write `aggfunc="sum"` (or `"size"` for counts).
- **Old `stack` arguments.** `table.stack(dropna=True)` from pandas 2 code raises `ValueError: dropna must be unspecified as the new implementation does not introduce rows of NA values. ...`. Call `.dropna()` on the result instead.
- **Melting without naming.** Leaving `var_name` and `value_name` out gives columns called `variable` and `value`.

## Practice

1. Build a table with drinks as rows and days as columns, holding how many sales rows each pair has, with 0 where there were none.
2. Melt this gradebook to long form with columns `student`, `subject`, `score`, then compute the mean score per subject:
   `scores = pd.DataFrame({"student": ["Ola", "Ben", "Mia"], "maths": [72, 58, 90], "physics": [65, 70, 88]})`.
3. Turn `table` from the `stack` section back into a long table with columns `day`, `drink`, `cups`.

### Answers

```python
print(sales.pivot_table(index="drink", columns="day", values="cups",
                        aggfunc="size", fill_value=0))

long = scores.melt(id_vars="student", var_name="subject", value_name="score")
print(long.groupby("subject")["score"].mean())

print(table.stack().reset_index(name="cups").head(2))
```

```text
day    Mon  Tue  Wed
drink               
latte    1    1    1
mocha    1    0    0
tea      1    1    2
subject
maths      73.333333
physics    74.333333
Name: score, dtype: float64
   day  drink  cups
0  Mon  latte    40
1  Mon  mocha    12
```

`aggfunc="size"` counts rows, so Wednesday's tea shows its two tills. Melting first makes the per-subject mean an ordinary `groupby`. `reset_index(name="cups")` turns the stacked Series' index levels into columns and names the values.

## Key takeaways

- Long data suits analysis; wide data suits reading. Reshape freely between them.
- `pivot` only rearranges and needs unique pairs; `pivot_table` aggregates, so name its `aggfunc`.
- `melt` folds columns into rows; name the new columns with `var_name` and `value_name`.
- `unstack` moves an index level into the columns and `stack` moves it back; pandas 3's `stack` keeps `NaN`.
- `crosstab` counts combinations; `explode` gives each list item a row.

## Further reading

- [pandas user guide: Reshaping and pivot tables](https://pandas.pydata.org/docs/user_guide/reshaping.html)
- [API reference: DataFrame.pivot_table](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.pivot_table.html)
- [API reference: DataFrame.melt](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.melt.html)
- [What's new in pandas 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
