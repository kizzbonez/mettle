Write the four functions of `solution.py`. Each takes a DataFrame or one column (a Series) and
must not change it. The sample export is `data/loans.csv`; read it with `pd.read_csv` to try your
functions.

1. `missing_counts(frame)` returns a Series with one entry per column of `frame`, in column order:
   the number of missing values in that column (`int64`). A column without gaps gives `0`.
2. `category_report(column)` returns a dict with four keys:
   - `"distinct"`: the number of distinct values, missing values not counted;
   - `"missing"`: the number of missing values;
   - `"top"`: the most common value among the values that are present (a missing value is never
     the top, however many there are). When several are equally common, the one that appears
     first in the column;
   - `"top_share"`: how often `top` appears divided by the number of values present, rounded to
     3 decimals.

   The column always has at least one value present.
3. `spot_check(frame, n, seed)` returns `n` random rows of `frame`, chosen with
   `sample(..., random_state=seed)`, so the same seed always gives the same rows. The rows keep
   their index labels. `n` is never more than the number of rows.
4. `numeric_summary(frame)` returns what `describe()` gives for `frame` (its numeric columns),
   with every value rounded to 2 decimals.

Example:

```python
loans = pd.read_csv("data/loans.csv")
print(missing_counts(loans))
category_report(loans["branch"])
# {'distinct': 4, 'missing': 0, 'top': 'Central', 'top_share': 0.5}
category_report(loans["item"])
# {'distinct': 3, 'missing': 1, 'top': 'book', 'top_share': 0.636}
print(spot_check(loans, 3, seed=4))
print(numeric_summary(loans))
```

```text
loan_id         0
branch          0
item            1
days_out        1
renewals        0
borrower_age    2
dtype: int64
  loan_id     branch       item  days_out  renewals  borrower_age
3    L004  Hillcrest  audiobook      14.0         0          41.0
4    L005    Central       book       NaN         0          29.0
6    L007  riverside       book      14.0         0          52.0
       days_out  renewals  borrower_age
count     11.00     12.00         10.00
mean      16.18      0.92         41.60
std        8.96      1.38         18.34
min        3.00      0.00         15.00
25%       14.00      0.00         30.25
50%       14.00      0.00         39.50
75%       17.50      1.25         50.00
max       35.00      4.00         73.00
```

The branch report shows the kind of problem these checks are for: four distinct branches, because
one loan was written `riverside` in lower case.

**Tips.** `count()` gives the values present in each column and `len(frame)` the rows.
`value_counts()` lists the most common value first and leaves missing values out unless told
otherwise; `normalize=True` turns counts into shares. `nunique()` skips missing values, while
`len(unique())` counts them as one more value.
