---
title: Statistics, Ranks and Bins
summary: Describe a dataset with summary statistics, quantiles and proportions, measure how two columns move together with `corr` and `cov`, rank values with the right tie rule, group numbers into bins with `cut` and `qcut`, and spot unusual values with z-scores and the IQR rule.
minutes: 40
objectives:
  - Summarise a column with `describe` and `quantile`, and categories with `value_counts(normalize=True)` and `crosstab(normalize=...)`
  - Compute and interpret Pearson and Spearman correlations and a covariance
  - Rank values with `rank`, choosing among the `average`, `min`, `dense` and `first` tie methods
  - Bin values into fixed ranges with `cut` and into equal-sized groups with `qcut`
  - Flag outliers with z-scores and the 1.5 × IQR rule, and explain why the rules disagree
---

## Outline

1. Summaries and quantiles
2. Proportions
3. Correlation and covariance
4. Ranks and ties
5. Bins with `cut` and `qcut`
6. z-scores and outliers

## Summaries and quantiles

A class of ten sat a test, and each student reported how many hours they revised:

```python
import pandas as pd

exam = pd.DataFrame({
    "student": ["Ana", "Bo", "Cy", "Dee", "Eko", "Fin", "Gia", "Hal", "Ira", "Jo"],
    "group": ["A", "A", "A", "A", "A", "B", "B", "B", "B", "B"],
    "hours": [2, 5, 1, 8, 4, 6, 3, 7, 0, 30],
    "score": [58, 74, 49, 91, 74, 80, 62, 85, 35, 74],
})
print(exam["score"].describe())
print(exam["score"].quantile([0.1, 0.9]))
```

```text
count    10.000000
mean     68.200000
std      17.177505
min      35.000000
25%      59.000000
50%      74.000000
75%      78.500000
max      91.000000
Name: score, dtype: float64
0.1    47.6
0.9    85.6
Name: score, dtype: float64
```

A **quantile** is the value below which a given fraction of the data lies: the 0.9 quantile, or 90th **percentile**, is 85.6, so about 90% of scores are lower. The 50% line is the **median**, and 25% and 75% are the **quartiles**. pandas interpolates between neighbouring values, which is why 85.6 is not anyone's score. The median (74) above the mean (68.2) says a few low scores pull the mean down. `std` is the **standard deviation**, the typical distance from the mean; pandas divides by `n - 1`, the sample version.

## Proportions

Counts become shares with `normalize`. On a crosstab, `normalize="index"` makes each row sum to 1, which answers "within each group, what share passed?":

```python
exam["passed"] = exam["score"] >= 60
print(exam["passed"].value_counts(normalize=True))
print(pd.crosstab(exam["group"], exam["passed"], normalize="index"))
```

```text
passed
True     0.7
False    0.3
Name: proportion, dtype: float64
passed  False  True 
group               
A         0.4    0.6
B         0.2    0.8
```

`normalize="columns"` makes each column sum to 1, and `normalize=True` divides by the grand total. Pick the one that matches the question, because the same table answers three different ones.

## Correlation and covariance

The **covariance** of two columns is positive when they tend to rise together; its size depends on the units, so it is hard to read. The **Pearson correlation** rescales it to between -1 and 1: 1 is a perfect rising straight line, 0 no straight-line relationship. **Spearman** correlation is Pearson's computed on the ranks, so it measures any steadily rising relationship and is barely moved by one extreme value:

```python
pair = exam[["hours", "score"]]
print(pair.corr())
print(pair.corr(method="spearman").round(3))
print(pair.cov())
```

```text
          hours     score
hours  1.000000  0.404416
score  0.404416  1.000000
       hours  score
hours  1.000  0.877
score  0.877  1.000
           hours       score
hours  74.266667   59.866667
score  59.866667  295.066667
```

The ranks say more revision went with higher scores (0.877), but Pearson gives only 0.40 because Jo's 30 hours sits far from the line the others follow. When the two disagree this much, look for outliers. The diagonal of `cov` holds each column's variance. Correlation describes association, not cause. `corr` uses only rows where both values are present, and it raises an error on text columns, so select the numeric ones first.

## Ranks and ties

`rank` gives each value its position, 1 for the smallest unless `ascending=False`. The interesting part is **ties**: Bo, Eko and Jo all scored 74. `method` decides their ranks:

```python
best_first = exam["score"].rank(ascending=False, method="first")
ranked = exam[["student", "score"]].assign(
    average=exam["score"].rank(ascending=False),
    min=exam["score"].rank(ascending=False, method="min"),
    dense=exam["score"].rank(ascending=False, method="dense"),
    first=best_first,
)
print(ranked.sort_values("first").iloc[2:7])
```

```text
  student  score  average  min  dense  first
5     Fin     80      3.0  3.0    3.0    3.0
1      Bo     74      5.0  4.0    4.0    4.0
4     Eko     74      5.0  4.0    4.0    5.0
9      Jo     74      5.0  4.0    4.0    6.0
6     Gia     62      7.0  7.0    5.0    7.0
```

- `average` (the default): tied values share the mean of their positions, (4 + 5 + 6) / 3 = 5.
- `min`: all get the best position, 4, and the next student is 7th, as in a sports table.
- `dense`: like `min`, but the next rank is 5, with no gaps.
- `first`: ties are broken by order of appearance, so every rank is unique.

`pct=True` turns ranks into percentile ranks between 0 and 1, and `groupby(...)["score"].rank()` ranks within each group (lesson 1). Missing values get a `NaN` rank unless you set `na_option`.

## Bins with `cut` and `qcut`

**Binning** turns a number into a category. `pd.cut` uses edges you choose, such as grade boundaries. By default each bin includes its right edge, written `(50, 70]`:

```python
bands = pd.cut(exam["score"], bins=[0, 50, 70, 85, 100],
               labels=["fail", "pass", "merit", "distinction"])
print(bands.value_counts(sort=False))
quartile = pd.qcut(exam["score"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
print(quartile.value_counts(sort=False))
```

```text
score
fail           2
pass           2
merit          5
distinction    1
Name: count, dtype: int64
score
Q1    3
Q2    4
Q3    0
Q4    3
Name: count, dtype: int64
```

The result is an ordered categorical, so the bands sort in grade order. Without `labels` the categories are the intervals themselves. `right=False` makes bins include their left edge instead, and a value outside every bin becomes `NaN`: with edges starting at 0 and the default `right=True`, a score of exactly 0 would be lost unless you add `include_lowest=True`.

`pd.qcut` chooses the edges for you, at quantiles, aiming for equal-sized groups. Ties defeat it here: the median is 74, all three 74s fall into Q2, and Q3, from 74 to 78.5, is empty. On data with many repeated values, `qcut` can even fail with `ValueError: Bin edges must be unique: ...`, which `duplicates="drop"` resolves by merging bins.

## z-scores and outliers

A **z-score** says how many standard deviations a value lies from the mean, `(x - mean) / std`; a common rule flags values beyond 3. The **IQR rule** uses quartiles instead. The **interquartile range** is `IQR = Q3 - Q1`, and values below `Q1 - 1.5 * IQR` or above `Q3 + 1.5 * IQR` are outliers:

```python
hours = exam["hours"]
z = (hours - hours.mean()) / hours.std()
print(z.round(2).tolist())
q1, q3 = hours.quantile([0.25, 0.75])
iqr = q3 - q1
low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
print(low, high)
print(exam.loc[(hours < low) | (hours > high), ["student", "hours"]])
```

```text
[-0.53, -0.19, -0.65, 0.16, -0.3, -0.07, -0.42, 0.05, -0.77, 2.72]
-4.5 13.5
  student  hours
9      Jo     30
```

The z-score rule misses Jo (2.72): the outlier itself inflates the mean and standard deviation it is measured against, and in a small sample no value can reach 3. Quartiles barely move, so the IQR rule flags 30 hours clearly. An outlier is a question, not an error: check it, then decide whether to fix, keep or exclude it, and say which.

## Common mistakes

- **Reading `describe()` of a text column as numbers.** On text it reports `count`, `unique`, `top` and `freq`. Select numeric columns, or convert with `pd.to_numeric`.
- **Normalising along the wrong axis.** `crosstab(..., normalize="columns")` answers "of those who passed, what share was in each group?", not "what share of each group passed?".
- **Ranking with the default for a leaderboard.** `average` gives 5.0 to three tied students; a table usually wants `method="min"`.
- **Losing values at the edges of `cut`.** `pd.cut(pd.Series([0, 50, 100]), bins=[0, 50, 100])` gives `NaN` for 0. Use `include_lowest=True` or a lower first edge.

## Practice

1. Rank students within their group, best first, so that tied students share the better place.
2. Within each group, what share of students fell into each band?
3. Does the IQR rule flag any `score`?

### Answers

```python
exam["place"] = exam.groupby("group")["score"].rank(ascending=False, method="min").astype(int)
print(exam.loc[exam["group"] == "A", ["student", "score", "place"]])
print(pd.crosstab(exam["group"], bands, normalize="index"))
q1, q3 = exam["score"].quantile([0.25, 0.75])
iqr = q3 - q1
print(exam[(exam["score"] < q1 - 1.5 * iqr) | (exam["score"] > q3 + 1.5 * iqr)].empty)
```

```text
  student  score  place
0     Ana     58      4
1      Bo     74      2
2      Cy     49      5
3     Dee     91      1
4     Eko     74      2
score  fail  pass  merit  distinction
group                                
A       0.2   0.2    0.4          0.2
B       0.2   0.2    0.6          0.0
True
```

Bo and Eko share second place in group A, and Ana is fourth. Each crosstab row sums to 1. The fences for scores are 29.75 and 107.75, so no score is flagged: Ira's 35 is low but not unusual for this class.

## Key takeaways

- `describe` and `quantile` summarise a column; the median and quartiles resist extreme values better than the mean.
- `normalize=True` turns counts into shares; on a crosstab choose `"index"` or `"columns"` by the question.
- Pearson measures straight-line association and is sensitive to outliers; Spearman works on ranks.
- `rank(method=...)` decides ties: `average`, `min`, `dense` or `first`.
- `cut` bins by fixed edges, `qcut` by quantiles; ties can unbalance `qcut`.
- The IQR rule finds outliers more reliably than z-scores in small samples.

## Further reading

- [pandas user guide: Descriptive statistics](https://pandas.pydata.org/docs/user_guide/basics.html#descriptive-statistics)
- [API reference: Series.rank](https://pandas.pydata.org/docs/reference/api/pandas.Series.rank.html)
- [API reference: pandas.cut](https://pandas.pydata.org/docs/reference/api/pandas.cut.html)
- [API reference: DataFrame.corr](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.corr.html)
