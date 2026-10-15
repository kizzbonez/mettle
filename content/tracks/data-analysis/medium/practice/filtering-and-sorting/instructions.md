Write the four functions of `solution.py`. `animals` is a DataFrame with the columns `name`,
`species` (`"dog"`, `"cat"` or `"rabbit"`), `age_years`, `weight_kg` (NaN when the animal has
not been weighed yet), `days_here`, `vaccinated` and `reserved` (both `bool`). Its index may hold
any labels. No function changes `animals`, and every result keeps all the columns unless stated.

1. `available(animals, species, min_age, max_age)` returns the animals a family could adopt: their
   species is one of the list `species`, they are vaccinated, they are **not** reserved, and their
   age is from `min_age` to `max_age`, **both included**. The rows keep their order and their
   index labels.
2. `by_weight(animals)` returns every animal sorted by `weight_kg`, lightest first, with the
   animals not yet weighed **first**. Animals with the same weight (or both not weighed) keep
   their order in the table. Index labels are kept.
3. `longest_waiting(animals, n)` returns the `n` animals with the most `days_here`, most first. When
   animals have waited equally long, the one earlier in the table comes first (and is the one kept
   at the cut-off). Index labels are kept.
4. `adoption_board(animals)` returns only the columns `name`, `species` and `days_here`, sorted by
   `species` A to Z and, within a species, by `days_here`, most first. Ties keep their order in the
   table. The rows are renumbered from 0.

Example:

```python
animals = pd.DataFrame(
    {
        "name": ["Bramble", "Pip", "Luna", "Biscuit", "Shadow", "Clover", "Ziggy", "Mabel"],
        "species": ["dog", "cat", "cat", "rabbit", "dog", "rabbit", "cat", "dog"],
        "age_years": [3.0, 1.5, 9.0, 0.5, 6.0, 2.0, 4.0, 11.0],
        "weight_kg": [24.5, 4.1, 4.1, None, 31.0, 1.9, None, 18.2],
        "days_here": [40, 12, 95, 7, 40, 21, 63, 120],
        "vaccinated": [True, True, True, False, True, True, True, True],
        "reserved": [False, False, False, False, True, False, False, False],
    }
)
available(animals, ["dog", "cat"], 1, 9)["name"].tolist()   # ['Bramble', 'Pip', 'Luna', 'Ziggy']
by_weight(animals).index.tolist()                            # [3, 6, 5, 1, 2, 7, 0, 4]
longest_waiting(animals, 4)["name"].tolist()                 # ['Mabel', 'Luna', 'Ziggy', 'Bramble']
print(adoption_board(animals))
```

```text
      name species  days_here
0     Luna     cat         95
1    Ziggy     cat         63
2      Pip     cat         12
3    Mabel     dog        120
4  Bramble     dog         40
5   Shadow     dog         40
6   Clover  rabbit         21
7  Biscuit  rabbit          7
```

Luna is 9, and `max_age` 9 includes her. Shadow is reserved and Mabel is too old. Bramble and
Shadow have both waited 40 days; Bramble comes first in the table, so she comes first.

**Tips.** Build one mask per condition and combine them with `&` and `~`, each comparison in
parentheses. `isin` and `between` save typing. `sort_values` has `na_position`, and its default
algorithm for one column does not keep ties in order: ask for `kind="stable"`. `nlargest` keeps the
first of tied rows.
