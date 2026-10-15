---
title: Inspecting Data
summary: Look at a dataset before analysing it. Print its first, last and random rows, read `info` and `describe` for numbers and text, count values with `value_counts`, `nunique` and `unique`, and measure memory with `memory_usage`.
minutes: 30
objectives:
  - Look at a sample of rows with `head`, `tail` and a reproducible `sample`
  - Read `info` to find each column's dtype and how many values are missing
  - Summarise numeric and text columns with `describe`
  - Count categories with `value_counts`, `nunique` and `unique`, with and without missing values
  - Measure a DataFrame's memory with `memory_usage`
---

## Outline

1. A first look: `shape`, `head`, `tail`, `sample`
2. `info`: types and gaps
3. `describe`: a summary of each column
4. Counting values
5. Memory
6. A routine for every new file

## A first look: `shape`, `head`, `tail`, `sample`

A city bike scheme sends you its trips. Before computing anything, look at what arrived. The
examples in this lesson all use this frame:

```python
import io

import pandas as pd

trips_csv = """trip,station,bike,minutes,distance_km,rating
1,Harbour,electric,14,3.2,5
2,Museum,classic,32,5.1,4
3,Harbour,classic,7,1.1,
4,Station,electric,22,6.4,5
5,Museum,electric,18,4.0,3
6,Harbour,classic,41,7.9,4
7,Station,classic,9,1.8,
8,Harbour,electric,12,2.9,5
9,Park,classic,55,9.6,2
10,Station,electric,16,3.7,4
"""
trips = pd.read_csv(io.StringIO(trips_csv), index_col="trip")
print(trips.shape)
print(trips.head(3))
print(trips.tail(2))
```

```text
(10, 5)
      station      bike  minutes  distance_km  rating
trip                                                 
1     Harbour  electric       14          3.2     5.0
2      Museum   classic       32          5.1     4.0
3     Harbour   classic        7          1.1     NaN
      station      bike  minutes  distance_km  rating
trip                                                 
9        Park   classic       55          9.6     2.0
10    Station  electric       16          3.7     4.0
```

`head(n)` shows the first `n` rows and `tail(n)` the last; both default to 5. The `trip` column
became the index, so its name sits on its own line above the row labels. The first rows of a file
are often its tidiest, so also look at a **random** sample:

```python
print(trips.sample(3, random_state=7))
```

```text
      station      bike  minutes  distance_km  rating
trip                                                 
9        Park   classic       55          9.6     2.0
6     Harbour   classic       41          7.9     4.0
1     Harbour  electric       14          3.2     5.0
```

`random_state` seeds the random choice, so the same seed picks the same rows every time, exactly
like the seeded generators of NumPy Foundations. Leave it out and every run shows other rows.

A frame longer than 60 rows prints only its first and last five rows, with `..` between them and
the size at the bottom, such as `[100 rows x 1 columns]`.

## `info`: types and gaps

`info()` prints one line per column: its position, name, how many values are **not** missing, and
its dtype. It prints directly and returns `None`, so call it without `print`:

```python
trips.info()
```

```text
<class 'pandas.DataFrame'>
RangeIndex: 10 entries, 1 to 10
Data columns (total 5 columns):
 #   Column       Non-Null Count  Dtype  
---  ------       --------------  -----  
 0   station      10 non-null     str    
 1   bike         10 non-null     str    
 2   minutes      10 non-null     int64  
 3   distance_km  10 non-null     float64
 4   rating       8 non-null      float64
dtypes: float64(2), int64(1), str(2)
memory usage: 672.0 bytes
```

Two things to read here. `rating` has 8 non-null values out of 10 entries, so two riders left no
rating. And `rating` is `float64` although ratings are whole numbers: the gaps are NaN, which needs
a float column. pandas noticed that the trip numbers 1 to 10 form a regular range and stored them
as a compact `RangeIndex`.

## `describe`: a summary of each column

`describe()` summarises the numeric columns. Rounding keeps the table readable:

```python
print(trips.describe().round(2))
print(trips["station"].describe())
```

```text
       minutes  distance_km  rating
count    10.00        10.00    8.00
mean     22.60         4.57    4.00
std      15.48         2.70    1.07
min       7.00         1.10    2.00
25%      12.50         2.98    3.75
50%      17.00         3.85    4.00
75%      29.50         6.08    5.00
max      55.00         9.60    5.00
count          10
unique          4
top       Harbour
freq            4
Name: station, dtype: object
```

- `count` is the number of values that are not missing: 8 for `rating`. The mean and the other
  statistics skip the missing ones.
- `std` is the sample standard deviation. `25%`, `50%` and `75%` are quartiles; `50%` is the
  median. A mean (22.6) well above the median (17) says a few long trips pull it up.
- For a text column, `describe` gives the count, the number of distinct values, the most common
  one (`top`) and how often it appears (`freq`). `describe(include="all")` puts both kinds in one
  table, with NaN where a statistic does not apply.

## Counting values

`value_counts()` counts each distinct value, most common first. It is the first thing to run on any
category column:

```python
print(trips["station"].value_counts())
print(trips["rating"].value_counts(dropna=False))
print(trips["station"].nunique(), trips["station"].unique())
```

```text
station
Harbour    4
Station    3
Museum     2
Park       1
Name: count, dtype: int64
rating
5.0    3
4.0    3
NaN    2
3.0    1
2.0    1
Name: count, dtype: int64
4 <ArrowStringArray>
['Harbour', 'Museum', 'Station', 'Park']
Length: 4, dtype: str
```

- The result is a Series: the values become the index and the counts are named `count`.
- Missing values are left out of the counts unless you pass `dropna=False`. Do that when
  checking data, since a column that is half NaN looks healthy otherwise.
- `nunique()` counts distinct values, skipping NaN. `unique()` returns them in order of first
  appearance. For a `str` column it is a pandas array, shown as `ArrowStringArray`; for numbers it
  is a NumPy array.
- `value_counts(normalize=True)` gives proportions instead of counts.

Counting is where messy data shows itself: `Harbour`, `harbour` and `Harbour ` would appear as
three stations.

## Memory

`memory_usage()` gives the bytes each column uses, the index first:

```python
print(trips.memory_usage(deep=True))
```

```text
Index          132
station        145
bike           155
minutes         80
distance_km     80
rating          80
dtype: int64
```

Ten `int64` or `float64` values take 80 bytes, 8 each, as in NumPy. Text columns depend on the
length of the strings. `deep=True` asks pandas to measure text exactly; with pyarrow-backed `str`
columns the plain call already gives the same numbers. Lesson 8 compares this with the older
`object` dtype, where it makes a large difference.

## A routine for every new file

Make this a habit after every `read_csv`: `shape`, `head()`, `sample(5, random_state=...)`,
`info()`, `describe()` and `value_counts(dropna=False)` on each category column. It takes a minute
and catches wrong separators, numbers read as text, unexpected gaps and misspelt categories before
they reach a result.

## Common mistakes

- **`print(df.info())`.** `info` prints and returns `None`, so this prints the summary followed by
  `None`.
- **Reading `count` as the number of rows.** In `describe`, `count` excludes missing values; compare
  it with `len(df)`.
- **Trusting `head()` alone.** Problems are often further down. Use `sample` and `value_counts`.
- **`len(s.unique())` vs `s.nunique()`.** For `rating`, `len(trips["rating"].unique())` is 5
  because `unique` keeps NaN, while `nunique()` is 4.
- **An unseeded sample in a report.** `sample(5)` changes every run; pass `random_state`.

## Practice

1. Print the number of trips per bike type.
2. Print the mean trip length in minutes and the longest distance.
3. How many trips have no rating? Answer with `info` and then with one expression.

### Answers

```python
print(trips["bike"].value_counts())
print(trips["minutes"].mean(), trips["distance_km"].max())
print(trips["rating"].isna().sum(), len(trips) - trips["rating"].count())
```

```text
bike
electric    5
classic     5
Name: count, dtype: int64
22.6 9.6
2 2
```

`info` shows `8 non-null` of 10 entries for `rating`. `isna()` gives a boolean Series, and
summing booleans counts the `True` values, as with NumPy masks; lesson 7 builds on it. `count()`
counts the values that are present.

## Key takeaways

- Look before you analyse: `shape`, `head`, `tail` and a seeded `sample`.
- `info` shows dtypes and non-null counts, so it reveals both wrong types and gaps.
- `describe` summarises numbers (count, mean, quartiles) and text (unique, top, freq); `count`
  skips missing values.
- `value_counts(dropna=False)`, `nunique` and `unique` expose categories, typos and gaps.
- `memory_usage(deep=True)` measures each column in bytes.

## Further reading

- [pandas user guide: Essential basic functionality](https://pandas.pydata.org/docs/user_guide/basics.html)
- [pandas.DataFrame.info](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.info.html)
- [pandas.DataFrame.describe](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.describe.html)
- [pandas.Series.value_counts](https://pandas.pydata.org/docs/reference/api/pandas.Series.value_counts.html)
