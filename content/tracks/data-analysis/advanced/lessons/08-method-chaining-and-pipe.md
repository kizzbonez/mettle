---
title: Method Chaining and pipe
summary: Write a cleaning and analysis pipeline as one readable chain of methods, one step per line. Add columns with `assign` and `pd.col`, filter with `loc` and `query`, slot your own functions in with `pipe`, debug a chain step by step, and know when a named variable reads better.
minutes: 35
objectives:
  - Rewrite a sequence of reassignments as a method chain with one step per line
  - Add columns inside a chain with `assign`, using a lambda or a `pd.col` expression
  - Filter inside a chain with `loc` and `pd.col`, or with `query` and `@` variables
  - Put your own functions into a chain with `pipe`, with extra arguments
  - Debug a chain, and decide when to break it into named variables
---

## Outline

1. From reassignments to a chain
2. `assign` with lambdas and `pd.col`
3. Filtering inside a chain
4. Your own steps with `pipe`
5. Debugging a chain
6. When a named variable is clearer

## From reassignments to a chain

Most pandas methods return a **new** object and leave the original alone. So the result of one method can call the next one directly, a **method chain**. Here are a 5 km parkrun's results, read the usual way, one reassignment per step:

```python
import io

import pandas as pd

csv_text = """Runner,Age Group,Finish
Ama,SW30,24:10
Ben,SM40,21:45
Cleo,SW30,
Dev,SM20,19:58
Eli,SM40,27:30
Fay,SW20,22:05
Gus,SM40,23:40
Ivy,SW30,23:15
"""

results = pd.read_csv(io.StringIO(csv_text))
results = results.rename(columns={"Runner": "runner", "Age Group": "group", "Finish": "finish"})
results = results.dropna(subset=["finish"])
results["minutes"] = pd.to_timedelta("00:" + results["finish"]).dt.total_seconds() / 60
results["pace"] = (results["minutes"] / 5).round(2)
results = results[results["minutes"] < 25]
results = results.sort_values("minutes")
```

It works, but `results` means something different on every line, and running one line twice in a notebook gives a different answer. The same pipeline as a chain:

```python
fastest = (
    pd.read_csv(io.StringIO(csv_text))
    .rename(columns={"Runner": "runner", "Age Group": "group", "Finish": "finish"})
    .dropna(subset=["finish"])
    .assign(minutes=lambda df: pd.to_timedelta("00:" + df["finish"]).dt.total_seconds() / 60)
    .assign(pace=(pd.col("minutes") / 5).round(2))
    .loc[pd.col("minutes") < 25]
    .sort_values("minutes")
)
print(fastest)
```

```text
  runner group finish    minutes  pace
3    Dev  SM20  19:58  19.966667  3.99
1    Ben  SM40  21:45  21.750000  4.35
5    Fay  SW20  22:05  22.083333  4.42
7    Ivy  SW30  23:15  23.250000  4.65
6    Gus  SM40  23:40  23.666667  4.73
0    Ama  SW30  24:10  24.166667  4.83
```

The outer parentheses let the expression span lines, and starting each line with `.` gives **one step per line**, read top to bottom like a recipe. There is one name, `fastest`, for the finished result, and no half-done intermediate to misuse.

## `assign` with lambdas and `pd.col`

Inside a chain the DataFrame of the moment has no name, so `results["minutes"]` cannot refer to it. `assign` accepts two ways round this:

- A **lambda**, a one-line function. `assign` calls it with the DataFrame as it is at that step, and the lambda's return value becomes the column.
- A **`pd.col` expression**, new in pandas 3. `pd.col("minutes")` stands for "the `minutes` column of whatever frame this reaches". Operators (`/`, `<`, `+`, ...) and Series methods, including `.str` and `.dt`, build a bigger expression, which pandas evaluates at that step.

```python
print(pd.col("minutes") / 5)
try:
    pd.read_csv(io.StringIO(csv_text)).assign(time=pd.to_timedelta("00:" + pd.col("Finish")))
except TypeError as error:
    print(error)
```

```text
col('minutes') / 5
boolean value of an expression is ambiguous
```

The first line shows that an expression is a description, not data. The second shows its limit: a plain function such as `pd.to_timedelta` cannot take an expression. That is why the chain above computes `minutes` with a lambda and `pace` with `pd.col`. Use `pd.col` where it reads naturally, and a lambda for everything else. Columns created earlier in the same `assign` call can be used by later keywords.

## Filtering inside a chain

`loc` also accepts a `pd.col` comparison (or a lambda returning a mask), as in `.loc[pd.col("minutes") < 25]` above. The other option is `query`, which takes the condition as a string. Names in the string are columns, `@name` refers to a Python variable, and a column name with spaces goes in backticks:

```python
limit = 25
summary = (
    pd.read_csv(io.StringIO(csv_text))
    .rename(columns=lambda name: name.lower().replace(" ", "_"))
    .dropna(subset=["finish"])
    .assign(minutes=lambda df: pd.to_timedelta("00:" + df["finish"]).dt.total_seconds() / 60)
    .query("minutes < @limit")
    .groupby("age_group")
    .agg(runners=("runner", "size"), best=("minutes", "min"))
    .sort_values("best")
)
print(summary)
```

```text
           runners       best
age_group                    
SM20             1  19.966667
SM40             2  21.750000
SW20             1  22.083333
SW30             2  23.250000
```

`rename` with a function renames every column, so `Age Group` became `age_group`. A chain can run straight through `groupby` and `agg`, as long as each step returns something with the next method.

## Your own steps with `pipe`

Some steps are yours: a cleaning rule, a filter the team reuses. Write it as a function that takes a DataFrame and returns one, then call it with **`pipe`**. `df.pipe(func, a, b=1)` means `func(df, a, b=1)`, so a chain stays a chain instead of becoming nested calls:

```python
def only_groups(df, groups):
    return df[df["group"].isin(groups)]


result = (
    pd.read_csv(io.StringIO(csv_text))
    .rename(columns={"Runner": "runner", "Age Group": "group", "Finish": "finish"})
    .dropna(subset=["finish"])
    .assign(minutes=lambda df: pd.to_timedelta("00:" + df["finish"]).dt.total_seconds() / 60)
    .pipe(only_groups, ["SW30", "SM40"])
    .assign(under_24=pd.col("minutes") < 24)
    .sort_values(["group", "minutes"])
    .loc[:, ["runner", "group", "under_24"]]
)
print(result)
```

```text
  runner group  under_24
1    Ben  SM40      True
6    Gus  SM40      True
4    Eli  SM40     False
7    Ivy  SW30      True
0    Ama  SW30     False
```

Without `pipe`, the call would wrap the whole chain: `only_groups(...long chain..., ["SW30", "SM40"])`, which reads inside out. Small named functions are also easy to test on their own.

## Debugging a chain

A chain hides its intermediate results, so give yourself a window into them. A function that prints and returns the frame unchanged can go anywhere with `pipe`:

```python
def peek(df, label):
    print(f"{label}: {len(df)} rows, columns {list(df.columns)}")
    return df


result = (
    pd.read_csv(io.StringIO(csv_text))
    .pipe(peek, "read")
    .dropna(subset=["Finish"])
    .pipe(peek, "dropna")
    .query("`Age Group` == 'SM40'")
    .pipe(peek, "query")
)
```

```text
read: 8 rows, columns ['Runner', 'Age Group', 'Finish']
dropna: 7 rows, columns ['Runner', 'Age Group', 'Finish']
query: 3 rows, columns ['Runner', 'Age Group', 'Finish']
```

The other technique comes free with one step per line: comment out the last steps (`# .sort_values(...)`), run, and look at what the chain produced so far. Move the cut down a line at a time until the result goes wrong.

## When a named variable is clearer

Chains are not a goal in themselves. Stop and name a result when:

- you need it twice, for example a cleaned table that feeds two different summaries;
- the chain grows past about ten steps, or mixes two separate questions;
- a step needs a check, such as a row count after a merge (lesson 2), that you want to `assert`.

A good rule: one chain per question, ending in a name that says what the result is.

## Common mistakes

- **Using the outer name inside the chain.** `.assign(pace=results["minutes"] / 5)` refers to the original `results`, not to the frame at this step; it raises `KeyError` or silently uses unfiltered rows. Use `pd.col` or a lambda.
- **`inplace=True` in a chain.** Most methods return `None` when called with `inplace=True` (`dropna`, `rename`, `sort_values`), so the next step fails with `AttributeError: 'NoneType' object has no attribute ...`. Never use `inplace` in a chain.
- **Forgetting that methods return new objects.** `results.dropna(subset=["Finish"])` on a line of its own changes nothing; assign or chain the result.
- **Passing an expression to a plain function.** `pd.to_timedelta(pd.col("finish"))` raises `TypeError: boolean value of an expression is ambiguous`. Use a lambda.

## Practice

1. Write a chain that reads the CSV, keeps finishers under 23 minutes, and returns just `runner` and `minutes`, fastest first.
2. Write `add_pace(df, km)` that adds a `pace` column, and use it with `pipe`.
3. Insert `peek` after the filter of exercise 1 to check how many rows survive.

### Answers

```python
def add_pace(df, km):
    return df.assign(pace=(df["minutes"] / km).round(2))


quick = (
    pd.read_csv(io.StringIO(csv_text))
    .rename(columns={"Runner": "runner", "Finish": "finish"})
    .dropna(subset=["finish"])
    .assign(minutes=lambda df: pd.to_timedelta("00:" + df["finish"]).dt.total_seconds() / 60)
    .loc[pd.col("minutes") < 23]
    .pipe(peek, "under 23")
    .pipe(add_pace, 5)
    .sort_values("minutes")
    .loc[:, ["runner", "minutes", "pace"]]
)
print(quick)
```

```text
under 23: 3 rows, columns ['runner', 'Age Group', 'finish', 'minutes']
  runner    minutes  pace
3    Dev  19.966667  3.99
1    Ben  21.750000  4.35
5    Fay  22.083333  4.42
```

Inside `add_pace`, the frame has a name, `df`, so ordinary indexing works there. `peek` shows that only the columns renamed in the dict changed.

## Key takeaways

- Most methods return new objects, so they chain; wrap the chain in parentheses, one step per line.
- In `assign` and `loc`, use `pd.col("name")` expressions (pandas 3) or lambdas to refer to the frame at that step.
- `query` filters with a string; `@name` uses a Python variable, backticks quote awkward column names.
- `pipe(func, *args)` puts your own DataFrame-to-DataFrame functions into a chain.
- Debug with a `peek` step or by commenting out trailing lines; name results you reuse.

## Further reading

- [API reference: pandas.col](https://pandas.pydata.org/docs/reference/api/pandas.col.html)
- [API reference: DataFrame.pipe](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.pipe.html)
- [API reference: DataFrame.assign](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.assign.html)
- [What's new in pandas 3.0.0: pd.col](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html)
