Write the four functions of `solution.py`. `pupils` has one row per pupil and the columns `name`
(`str`, every name different), `class` (`str`), `books` and `minutes` (`int64`) and `last_read`
(`datetime64[us]`, with the time of day). Read the sample with
`pd.read_csv("data/pupils.csv", parse_dates=["last_read"])`. No function may change `pupils`, and
none may depend on anything but its arguments.

1. `prize_draw(pupils, n, seed)` draws `n` pupils at random among those with **at least 10**
   books and returns their names as a list, in the order drawn. Create the generator inside the
   function with `np.random.default_rng(seed)`, and call `sample(n=n, random_state=...)` with it
   on the eligible rows, kept in the order of `pupils`. The same arguments give the same names on
   every call, whatever other code has drawn in between. `n` is never more than the number of
   eligible pupils.
2. `leaderboard(pupils)` returns every pupil, ranked so that no two pupils tie: most `books`
   first, then most `minutes`, then `name` in alphabetical order. The result does not depend on
   the order of the rows of `pupils`. Its columns are `rank` (1 to n, `int64`), `name`, `class`,
   `books`, `hours` (`minutes / 60`, not rounded) and `last_read`, with the index 0 to n-1.
3. `versions()` returns the dict `{"python": ..., "numpy": ..., "pandas": ..., "pyarrow": ...}`
   with the versions in use: `platform.python_version()` and each library's `__version__`.
4. `write_results(pupils, folder)` creates `folder` (and any missing parents) and writes two
   files into it, replacing any earlier ones, so that every run on the same pupils, in any row
   order, writes the same bytes:
   - `leaderboard.csv`: the leaderboard, without the index, `hours` with exactly 2 decimals,
     `last_read` as the date only (`YYYY-MM-DD`) and `\n` line endings;
   - `versions.json`: `json.dumps(versions())` followed by a newline.

Example:

```python
pupils = pd.read_csv("data/pupils.csv", parse_dates=["last_read"])
print(prize_draw(pupils, 3, seed=2026))
write_results(pupils, "results")
print(open("results/leaderboard.csv").read())
```

```text
['Amara', 'Hamza', 'Chloe']
rank,name,class,books,hours,last_read
1,Chloe,4B,21,20.83,2026-06-28
2,Finn,4C,21,16.33,2026-06-28
3,Isla,4C,17,13.33,2026-06-27
4,Hamza,4B,14,12.42,2026-06-28
5,Amara,4B,14,10.17,2026-06-27
6,Dev,4A,14,10.17,2026-06-26
7,Lily,4C,14,10.17,2026-06-28
8,Grace,4A,11,11.67,2026-06-25
9,Jonah,4A,10,6.50,2026-06-24
10,Ben,4A,9,7.58,2026-06-28
11,Kofi,4B,6,4.00,2026-06-22
12,Ella,4C,3,1.58,2026-06-20
```

Amara, Dev and Lily read 14 books in 610 minutes each, so their names decide their order.

**Tips.** `sort_values` takes a list of columns and a matching list for `ascending`. `to_csv`
takes `index`, `float_format`, `date_format` and `lineterminator`. Writing a whole file
replaces it; appending would not.
