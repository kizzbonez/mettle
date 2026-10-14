Write the four functions of `solution.py`. Each one receives `logs`, a dict from a pupil's name
to a list of whole numbers: the pages read on day 1, day 2, and so on. A pupil may have an empty
list. Do not change `logs`.

**The rule of this lab:** the body of each of the four functions is a **single `return`
statement** (a docstring above it is allowed), and what it returns is built with a
comprehension or a generator expression. No `for` or `while` statements, no `append`. A hidden
test reads your file to check this.

1. `totals(logs)` returns a dict from each pupil to the total pages they read, in the order of
   `logs`. A pupil with no days has a total of `0`.
2. `missed_a_day(logs)` returns the **set** of pupils with at least one day of `0` pages.
3. `entries(logs)` returns a list of `(name, day, pages)` tuples, one for every day on which a
   pupil read at least one page, with days numbered from 1. The order is the order of `logs`,
   and for each pupil the order of the days.
4. `busiest_day(logs)` returns the largest number of pages anyone read on a single day, or `0`
   when no day was logged at all.

Example:

```python
logs = {"Amara": [12, 0, 30], "Ben": [5, 5], "Chen": []}
totals(logs)         # {'Amara': 42, 'Ben': 10, 'Chen': 0}
missed_a_day(logs)   # {'Amara'}
entries(logs)        # [('Amara', 1, 12), ('Amara', 3, 30), ('Ben', 1, 5), ('Ben', 2, 5)]
busiest_day(logs)    # 30
```

**Tips.** Iterate over `logs.items()` and unpack each pair. `any`, `sum` and `max` accept a
generator expression; `max` needs `default=` for an empty input. Two `for` clauses run like
nested loops, outer first, and `enumerate(pages, start=1)` numbers the days.
