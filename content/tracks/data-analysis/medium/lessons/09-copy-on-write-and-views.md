---
title: Copy-on-Write and Views
summary: Understand Copy-on-Write, the rule pandas 3 always follows. Anything derived from a DataFrame behaves as a copy, so chained assignment never works, `loc` is the way to change values, `inplace` brings nothing, and pandas selections differ from NumPy views.
minutes: 30
objectives:
  - State the Copy-on-Write rule and predict whether a change reaches the original frame
  - Recognise chained assignment, read its warning, and rewrite it with one `loc` call
  - Explain why copies are cheap under Copy-on-Write (they are made lazily, on the first write)
  - Choose reassignment over `inplace=True`, and know what `inplace` returns in pandas 3
  - Contrast pandas selections with NumPy views and read-only arrays from `to_numpy`
---

## Outline

1. The rule
2. Selections behave as copies
3. Copies are made lazily
4. Chained assignment never works
5. `inplace` and reassignment
6. pandas is not NumPy here
7. Before pandas 3

## The rule

pandas 3 always works in **Copy-on-Write** (CoW) mode. The user guide states the rule in one
sentence: any DataFrame or Series derived from another in any way always behaves as a copy. From
it follows a second rule: you can change an object's values only by changing **that object**,
with one indexing operation on it.

This lesson shows what the rule means in practice, why it makes code predictable, and why
lessons 6 and 7 insisted on `df.loc[mask, "col"] = value`.

## Selections behave as copies

A hospital ward keeps a small rota:

```python
import numpy as np
import pandas as pd

shifts = pd.DataFrame(
    {
        "nurse": ["Ali", "Bea", "Cy", "Dee"],
        "ward": ["A", "B", "A", "C"],
        "hours": [8, 12, 8, 10],
    }
)
hours = shifts["hours"]
hours.iloc[0] = 99
print(hours.tolist(), shifts["hours"].tolist())
ward_a = shifts[shifts["ward"] == "A"]
ward_a.loc[:, "hours"] = 0
print(ward_a["hours"].tolist(), shifts["hours"].tolist())
shifts.loc[1, "hours"] = 11
print(hours.tolist(), shifts["hours"].tolist())
```

```text
[99, 12, 8, 10] [8, 12, 8, 10]
[0, 0] [8, 12, 8, 10]
[99, 12, 8, 10] [8, 11, 8, 10]
```

- `hours` is a column taken from `shifts`. Changing it changed `hours` only.
- `ward_a` is a filtered frame. Changing it changed `ward_a` only, without any warning: it is a
  frame of its own, and you are free to modify it.
- It works the other way too: changing `shifts` afterwards did not reach `hours`.

So no statement updates two objects at once. To change `shifts`, write to `shifts`.

## Copies are made lazily

If every selection really copied its data, selecting a column of a large frame would be slow.
CoW avoids that: a selection **shares** the data until one of the two objects is written to, and
only then is the data copied. NumPy's `np.shares_memory`, from NumPy Foundations, shows it:

```python
hours = shifts["hours"]
print(np.shares_memory(hours.to_numpy(), shifts["hours"].to_numpy()))
hours.iloc[0] = 99
print(np.shares_memory(hours.to_numpy(), shifts["hours"].to_numpy()))
```

```text
True
False
```

Before the write, `hours` and `shifts` used the same memory. The write to `hours` made it copy its
data first, then change its copy. Methods such as `rename`, `drop(columns=...)` and
`reset_index` use the same trick. So the rule costs nothing until you write, and you get a copy
only when you need one.

## Chained assignment never works

**Chained assignment** is an assignment through two indexing steps in a row. The first step
creates a new object; the second writes to that object. Under CoW the new object behaves as a
copy, so the original is never changed. pandas detects the pattern and warns:

```python
import pandas as pd

shifts = pd.DataFrame(
    {
        "nurse": ["Ali", "Bea", "Cy", "Dee"],
        "ward": ["A", "B", "A", "C"],
        "hours": [8, 12, 8, 10],
    }
)
shifts["hours"][shifts["ward"] == "A"] = 6
print(shifts["hours"].tolist())
shifts.loc[shifts["ward"] == "A", "hours"] = 6
print(shifts["hours"].tolist())
```

```text
/tmp/work/rota.py:10: ChainedAssignmentError: A value is being set on a copy of a DataFrame or Series through chained assignment.
Such chained assignment never works to update the original DataFrame or Series, because the intermediate object on which we are setting values always behaves as a copy (due to Copy-on-Write).

Try using '.loc[row_indexer, col_indexer] = value' instead, to perform the assignment in a single step.

See the documentation for a more detailed explanation: https://pandas.pydata.org/pandas-docs/stable/user_guide/copy_on_write.html#chained-assignment
  shifts["hours"][shifts["ward"] == "A"] = 6
[8, 12, 8, 10]
[6, 12, 6, 10]
```

Despite its name, `ChainedAssignmentError` is a **warning**: the program carries on, with the rota
unchanged. Every one of these is chained assignment, and every one does nothing to `shifts`:

- `shifts["hours"][mask] = 6`: column first, then rows.
- `shifts[mask]["hours"] = 6`: rows first, then column.
- `shifts.loc[mask]["hours"] = 6`: `loc` does not help if a second bracket follows it.

The fix is always the same: put rows and column in **one** `loc` (or `iloc`) call on the frame
itself, `shifts.loc[mask, "hours"] = 6`. To replace a whole column, assign it in one step:
`shifts["hours"] = shifts["hours"] * 2`.

## `inplace` and reassignment

Many methods take `inplace=True`, which modifies the object instead of returning a new one. In
pandas 3, `replace`, `fillna`, `ffill`, `bfill`, `interpolate`, `where`, `mask` and `clip` then
return the object itself; other methods such as `sort_values` still return `None`:

```python
result = shifts.replace({"ward": {"C": "A"}}, inplace=True)
print(result is shifts, shifts["ward"].tolist())
print(shifts.sort_values("hours", inplace=True))
```

```text
True ['A', 'B', 'A', 'A']
None
```

Prefer plain reassignment, `shifts = shifts.sort_values("hours")`:

- It reads the same for every method and can be chained.
- For `sort_values`, `sort_index`, `dropna`, `drop_duplicates` and `query`, `inplace=True` is only
  shorthand for reassignment: they always build a new result, and the pandas team plans to remove
  the keyword from them (PDEP-8). Only the value-changing methods listed above can work in place,
  and even they copy silently when the data is shared with another object.
- `inplace` on a selected column is chained assignment in disguise:
  `shifts["hours"].fillna(0, inplace=True)` changes a temporary Series and warns (lesson 7).
  Write `shifts["hours"] = shifts["hours"].fillna(0)`.

## pandas is not NumPy here

In NumPy a basic slice is a **view**: writing to it writes to the original array. NumPy
Foundations relied on that. pandas never behaves like that now:

```python
levels = np.array([8, 12, 8, 10])
first_two = levels[:2]
first_two[0] = 99
print(levels)
frame = pd.DataFrame({"hours": levels})
levels[1] = 0
print(frame["hours"].tolist())
arr = frame["hours"].to_numpy()
try:
    arr[0] = 1
except ValueError as error:
    print("ValueError:", error)
```

```text
[99 12  8 10]
[99, 12, 8, 10]
ValueError: assignment destination is read-only
```

- The NumPy view `first_two` changed `levels`, as expected.
- The DataFrame constructor **copied** the array, so changing `levels` later did not reach `frame`.
- `to_numpy()` may share the column's memory, so pandas hands it out **read-only**. If you need
  to write to the array, take a copy: `frame["hours"].to_numpy().copy()`.

## Before pandas 3

Code written for pandas 2 and earlier behaves differently, and you will meet it online:

- Chained assignment sometimes changed the original and sometimes did not, depending on whether
  an intermediate result was a view. pandas warned with **`SettingWithCopyWarning`**, which no
  longer exists.
- People added `.copy()` after every filter, `ward_a = shifts[mask].copy()`, to silence that
  warning. Under CoW it is unnecessary: `ward_a` already behaves as a copy.
- Modifying a column you selected, `hours = df["hours"]; hours[0] = 99`, could change `df`.

## Common mistakes

- **Two brackets on the left of `=`.** Any `df[...][...] = value` does nothing to `df`. Use
  `df.loc[rows, "col"] = value`.
- **Ignoring the warning.** `ChainedAssignmentError` is printed and the program continues, and a
  loop shows it only for the first pass. A value that "did not change" after an assignment is
  almost always this.
- **`inplace=True` on a column.** Reassign the column instead.
- **Writing to `to_numpy()`.** It may be read-only. Copy it first.
- **`.copy()` everywhere.** Under CoW it only costs memory. Copy when you need a NumPy array you
  can write to, not to change pandas behaviour.

## Practice

Start from the four-row rota as first built.

1. Fix `shifts[shifts["nurse"] == "Bea"]["ward"] = "C"` so that it changes `shifts`.
2. After `night = shifts[shifts["hours"] >= 10]` and `night["hours"] = 12`, how many hours does
   `shifts` show for Bea and Dee, and why?
3. Rewrite `shifts.sort_values("nurse", inplace=True)` without `inplace`.

### Answers

```python
shifts.loc[shifts["nurse"] == "Bea", "ward"] = "C"
night = shifts[shifts["hours"] >= 10]
night["hours"] = 12
print(shifts)
shifts = shifts.sort_values("nurse")
```

```text
  nurse ward  hours
0   Ali    A      8
1   Bea    C     12
2    Cy    A      8
3   Dee    C     10
```

The ward change is one `loc` call on `shifts`, so it reaches the frame. `night` is a frame of its
own: setting its `hours` column changes `night` only, so Dee still shows 10 in `shifts`. The
sort becomes an ordinary reassignment.

## Key takeaways

- Copy-on-Write: anything derived from a DataFrame behaves as a copy; change an object only
  through that object.
- Chained assignment (`df[a][b] = v`) never updates `df` and warns with `ChainedAssignmentError`;
  use one `df.loc[rows, col] = v`.
- Copies are lazy: data is shared until the first write, so selections stay cheap.
- Prefer `df = df.method(...)` to `inplace=True`; never use `inplace` on a selected column.
- Unlike NumPy views, pandas selections never write back; `to_numpy()` can be read-only.

## Further reading

- [pandas user guide: Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html)
- [What's new in 3.0.0: Copy-on-Write](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
- [NumPy: Copies and views](https://numpy.org/doc/stable/user/basics.copies.html)
- [PDEP-8: In-place methods in pandas](https://pandas.pydata.org/pdeps/0008-inplace-methods-in-pandas.html)
