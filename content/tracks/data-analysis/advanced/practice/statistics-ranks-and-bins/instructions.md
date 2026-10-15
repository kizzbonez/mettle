Write the three functions of `solution.py`. None of them may change its input. The sample is
`data/entries.csv`: one row per entry in the show's giant vegetable class, with the columns
`grower`, `vegetable` and `kg`.

1. `places(entries)` returns the entries with one more column, `place` (`int64`): the entry's
   place **within its vegetable**, `1` for the heaviest. Entries of equal weight share a place,
   and the next weight takes the next place, with no gap: weights 9, 7, 7, 4 get places 1, 2,
   2, 3. Sort the rows by `vegetable`, then `place`, then `grower`, and number the index
   `0, 1, 2, ...`. Every entry has a weight.
2. `band_shares(entries)` puts each weight in a band: `small` under 5 kg, `medium` from 5 up
   to (not including) 20, `large` from 20 up to 100, and `giant` from 100. A band includes its
   **lower** edge, so 5.0 is `medium`; weights are never negative. Return a DataFrame with one
   row per vegetable (sorted, index named `vegetable`) and the columns `small`, `medium`,
   `large`, `giant` in that order, **every band even when no entry falls in it**. Each value is
   the share of that vegetable's entries in that band, rounded to 3, so a row sums to about 1.
3. `outlier_report(kg)` takes a Series of weights and returns a DataFrame with the same index
   and two columns:
   - `z`: the z-score `(kg - mean) / std`, with pandas' `mean` and `std`, rounded to 2;
   - `iqr_outlier`: `True` for a weight **below** `Q1 - 1.5 * IQR` or **above**
     `Q3 + 1.5 * IQR`, where `Q1` and `Q3` are pandas' 0.25 and 0.75 quantiles and
     `IQR = Q3 - Q1`. A weight exactly on a fence is not an outlier.

   A missing weight is left out of the statistics, has a missing `z` and is not an outlier.

Example:

```python
entries = pd.read_csv("data/entries.csv")
print(places(entries).head(4))
print(band_shares(entries))
pumpkins = entries.loc[entries["vegetable"] == "pumpkin", "kg"]
print(outlier_report(pumpkins))
```

```text
    grower vegetable    kg  place
0  Elspeth    marrow  52.0      1
1    Cerys    marrow  48.2      2
2   Hamish    marrow  48.2      2
3      Kit    marrow  19.5      3
kg         small  medium  large  giant
vegetable                             
marrow     0.000   0.250   0.75    0.0
onion      0.667   0.333   0.00    0.0
pumpkin    0.000   0.000   0.20    0.8
       z  iqr_outlier
0  -0.40        False
1  -0.43        False
5  -0.40        False
8  -0.55         True
11  1.79         True
```

Lowri's 1850 kg pumpkin is surely a typing slip for 185.0, yet its z-score is only 1.79: the
slip itself inflates the mean and standard deviation. The IQR rule flags it, and Isla's 96 kg
too, which the judges will simply check.

**Tips.** `groupby(...)["kg"].rank(...)` ranks within each group; pick the tie `method` that
leaves no gaps. `pd.cut` takes `right=False` to include the lower edges and `np.inf` as the
last edge, and its result is a categorical. `crosstab(..., normalize="index")` makes each row
sum to 1 but leaves out a band that did not occur; grouping by the vegetable and the bands with
`observed=False` keeps every band, and `transform("sum")` gives each count its vegetable's
total.
