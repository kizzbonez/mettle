Write the three functions of `solution.py` with NumPy's file functions. The sample file is
`data/gauges.csv`:

```text
# Millbrook Canoe Club: river depth in cm at each gauge post, first Saturday of each month
post,apr,may,jun,jul
3,131.5,118.0,104.5,92.0
7,88.0,80.5,76.0,71.5
...
```

A gauge file always starts with one comment line and one header line. Every other line is one
gauge post: its number, then one depth in centimetres per month, separated by commas, with no
gaps. Other files may have any number of posts (one or more) and of months (one or more).

1. `load_gauges(path)` returns a tuple `(posts, depths)`: `posts` is an `int64` array of the
   post numbers in file order, and `depths` a two-dimensional `float64` array with one row per
   post and one column per month, **without** the post number. A file with a single post
   still gives a two-dimensional `depths` of shape `(1, months)`.
2. `write_changes(path, posts, depths)` writes a CSV text file at `path`: the header line
   `post,change_cm`, then one line per post with its number as a whole number and its change
   (the last month's depth minus the first month's) with exactly one decimal. Nothing else: no
   `#` before the header and no other lines.
3. `save_season(path, posts, depths)` saves both arrays in one `.npz` file at `path`, under
   the names `posts` and `depths`, so that they load back with the same dtypes, shapes and
   values.

Example:

```python
posts, depths = load_gauges("data/gauges.csv")
posts           # array([ 3,  7,  8, 12, 15])
depths.shape    # (5, 4)
depths[0]       # array([131.5, 118. , 104.5,  92. ])
write_changes("changes.csv", posts, depths)
save_season("season.npz", posts, depths)
```

`changes.csv` then reads:

```text
post,change_cm
3,-39.5
7,-16.5
8,-27.5
12,2.0
15,-12.5
```

**Tips.** `np.loadtxt` takes `delimiter`, `skiprows` (which counts comment lines too),
`usecols`, `dtype` and `ndmin`. `np.savetxt` takes a `fmt` per column, `header` and
`comments=""`; `np.stack(..., axis=1)` puts two one-dimensional arrays side by side as
columns. `np.savez` names each array after its keyword.
