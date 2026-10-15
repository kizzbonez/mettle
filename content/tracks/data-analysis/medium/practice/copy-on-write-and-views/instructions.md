Write the four functions of `solution.py`. `plots` is the society's register, a DataFrame with the
columns `plot`, `holder`, `size_m2`, `rent` (`float64`) and `paid` (`bool`), and any index.
Read carefully which functions **change `plots`** and which must **leave it alone**: the tests
check both.

1. `mark_paid(plots, holder)` **changes `plots` itself**: every plot held by `holder` gets
   `paid` set to `True`. Nothing else in `plots` changes, and the function returns `None`. A holder
   with no plots changes nothing.
2. `raise_rent(plots, percent)` **changes `plots` itself**: every `rent` is multiplied by
   `1 + percent / 100` and rounded to 2 decimals (`percent` may be negative, for a cut). Nothing
   else changes, and the function returns `None`.
3. `late_list(plots, fee)` returns a **new** frame of the plots that are not paid, with every
   column, their index labels and order, and `fee` added to their `rent`. **`plots` must not
   change.**
4. `rent_array(plots)` returns the rents as a NumPy array (`float64`) that the caller can write
   to. Writing to it must not change `plots`. **`plots` must not change.**

Example:

```python
plots = pd.DataFrame(
    {
        "plot": ["P01", "P02", "P03", "P04", "P05"],
        "holder": ["Okafor", "Lund", "Okafor", "Patel", "Reyes"],
        "size_m2": [125, 250, 125, 60, 250],
        "rent": [32.5, 60.0, 32.5, 18.0, 60.0],
        "paid": [False, True, False, False, True],
    }
)
mark_paid(plots, "Okafor")
plots["paid"].tolist()                 # [True, True, True, False, True]
raise_rent(plots, 4)
plots["rent"].tolist()                 # [33.8, 62.4, 33.8, 18.72, 62.4]
print(late_list(plots, 5.0))
plots["rent"].tolist()                 # [33.8, 62.4, 33.8, 18.72, 62.4]  (unchanged)
rents = rent_array(plots)
rents[0] = 0.0                         # allowed, and plots still says 33.8
```

```text
  plot holder  size_m2   rent   paid
3  P04  Patel       60  23.72  False
```

**Tips.** To change a frame you were given, write to **that** frame in one step:
`frame.loc[rows, "col"] = value`, or `frame["col"] = ...` for a whole column. Two brackets on the
left of `=` (chained assignment) change a temporary copy and leave `plots` as it was, and so does
writing to a column you took out of it first. A filtered frame is a frame of its own, safe to
change. `to_numpy()` may hand out a read-only view of the column.
