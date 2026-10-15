Write the three functions of `solution.py`. `jobs` has the columns `job_id` (unique), `bike`,
`part_code` and `qty` (`int64`); `parts` has the columns `code`, `part` and `price`. A job's
`part_code` may be missing from `parts`, and a part may be used by no job. Do not change either
table. The samples are `data/jobs.csv` and `data/parts.csv`.

1. `price_jobs(jobs, parts)` returns **every** job with its part's details: the columns of
   `jobs`, then `part`, `price` and `cost` (`qty` times `price`, rounded to 2 decimals), and no
   `code` column. A job whose code is not in `parts` keeps its row, with `part`, `price` and
   `cost` missing. `parts` must name each code once: merge with `validate` so that a duplicated
   `code` raises `pandas.errors.MergeError`. Sort the rows by `job_id` and number the index
   `0, 1, 2, ...`.
2. `unknown_parts(jobs, parts)` returns the jobs whose `part_code` is **not** in `parts`, with
   the columns of `jobs` only, sorted by `job_id`, index `0, 1, 2, ...`. When every code is
   known, the result has no rows.
3. `parts_used(jobs, parts)` returns `parts` (same rows, order and index labels) with one more
   column, `used`: the total `qty` of that part over all jobs, as `int64`, and `0` for a part no
   job used.

Example:

```python
jobs = pd.read_csv("data/jobs.csv")
parts = pd.read_csv("data/parts.csv")
print(price_jobs(jobs, parts))
print(unknown_parts(jobs, parts))
print(parts_used(jobs, parts))
```

```text
  job_id             bike part_code  qty                part  price   cost
0    J01  Dutch city bike   BRK-PAD    4   brake pads (pair)   6.50  26.00
1    J02        road bike   TUB-700    1     inner tube 700c   5.25   5.25
2    J03    mountain bike     GRP-X    2                 NaN    NaN    NaN
3    J04              BMX    CHN-1S    1  single-speed chain  12.00  12.00
4    J05     folding bike   BRK-PAD    2   brake pads (pair)   6.50  13.00
5    J06     child's bike    TUB-20    1                 NaN    NaN    NaN
6    J07   Raleigh tourer    TUB-26    2     inner tube 26in   4.75   9.50
  job_id           bike part_code  qty
0    J03  mountain bike     GRP-X    2
1    J06   child's bike    TUB-20    1
      code                part  price  used
0  BRK-PAD   brake pads (pair)   6.50     6
1   CHN-1S  single-speed chain  12.00     1
2  TUB-700     inner tube 700c   5.25     1
3   TUB-26     inner tube 26in   4.75     2
4  CBL-BRK         brake cable   3.20     0
```

**Tips.** The keys have different names: `left_on="part_code", right_on="code"`. A left merge
onto a lookup table is `validate="many_to_one"`. `how="left_anti"` keeps the rows without a
partner, but also brings the other table's (empty) columns along. Do not rely on a merge's row
order or index labels: sort and `reset_index(drop=True)`. A `groupby` result has the key as its
index, which is what `join(..., on="code")` matches.
