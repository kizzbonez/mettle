---
title: Reproducible Analysis
summary: Make an analysis give the same result every time anyone runs it. Seed random generators and pass them explicitly, sort with stable algorithms and full keys, record and pin library versions, avoid hidden state, write outputs in fixed formats, make pipelines safe to run twice, and prefer scripts to notebooks for anything that runs again.
minutes: 30
objectives:
  - Seed `np.random.default_rng` and pass the generator to the code that needs it, including `DataFrame.sample`
  - Make row order deterministic with `kind="stable"` and tie-breaking sort keys
  - Record the Python, NumPy, pandas and pyarrow versions with results and pin them for reruns
  - Write functions without hidden state, outputs with fixed formats, and pipelines that are safe to run twice
---

## Outline

1. What reproducible means
2. Randomness: seeded generators, passed explicitly
3. Ties: stable sorts and full keys
4. Recording and pinning versions
5. No hidden state
6. Fixed formats and idempotent pipelines
7. Scripts over notebooks

## What reproducible means

An analysis is **reproducible** when the same code on the same input gives the same output, for
you next month and for a colleague on another machine. That sounds automatic, but several things
quietly break it: random numbers, the order of rows that tie, library versions that change
behaviour (pandas 3 changed several defaults), state left over from earlier steps, and outputs
whose formatting drifts. Each has a simple remedy.

## Randomness: seeded generators, passed explicitly

`np.random.default_rng(seed)` creates a **generator** whose sequence is fixed by the seed. The
safe pattern is to create it in one place and pass it to every function that needs randomness;
pandas methods such as `sample` accept a generator as `random_state`:

```python
import numpy as np
import pandas as pd

households = pd.DataFrame({"household": range(1, 201), "street": np.repeat(["Ash", "Birch", "Cedar", "Elm"], 50)})


def pick(frame, seed, n=4):
    rng = np.random.default_rng(seed)
    return frame.sample(n=n, random_state=rng)["household"].tolist()


print(pick(households, 2026), pick(households, 2026), pick(households, 2027))
rng = np.random.default_rng(2026)
first = households.sample(n=4, random_state=rng)["household"].tolist()
second = households.sample(n=4, random_state=rng)["household"].tolist()
print(first, second)
```

```text
[6, 168, 128, 36] [6, 168, 128, 36] [78, 30, 125, 2]
[6, 168, 128, 36] [73, 128, 71, 167]
```

The same seed gives the same survey sample; a different seed a different one. A generator moves
on as it is used, so the second draw from `rng` differs from the first, and adding a draw earlier
in a script changes every draw after it. Write the seed into the script or its configuration, and
into the report. Avoid `np.random.seed()` and the module-level functions such as
`np.random.rand()`: they share one hidden global generator, so any library call that uses it
shifts your numbers. The NumPy docs recommend `Generator` for all new code.

## Ties: stable sorts and full keys

Sorting by a column with repeated values leaves a choice: in what order do equal values come out?
`sort_values` uses `kind="quicksort"` by default, which does not promise anything about that:

```python
rng = np.random.default_rng(5)
results = pd.DataFrame({"runner": [f"R{n:03d}" for n in range(60)], "minutes": rng.integers(40, 44, 60)})
default = results.sort_values("minutes")["runner"].head(6).tolist()
stable = results.sort_values("minutes", kind="stable")["runner"].head(6).tolist()
keyed = results.sort_values(["minutes", "runner"])["runner"].head(6).tolist()
print(default)
print(stable)
print(keyed)
```

```text
['R002', 'R014', 'R015', 'R009', 'R020', 'R018']
['R002', 'R009', 'R014', 'R015', 'R016', 'R017']
['R002', 'R009', 'R014', 'R015', 'R016', 'R017']
```

Seventeen runners finished in 40 minutes. Quicksort returned them in a scrambled order; a
**stable** sort keeps equal rows in their original order, so the result depends only on the data.
That matters as soon as you take the "top 5" or drop duplicates after sorting. The most robust
fix is a **full key**: add columns until no two rows tie, here the runner's id. Then the order is
defined by the data alone and does not depend on the algorithm or the input order at all. (`kind` only applies when sorting by a single column; with a full key, the
algorithm no longer matters.)

## Recording and pinning versions

Results depend on the versions of the libraries that computed them. Record them next to every
output, and **pin** them, so a rerun installs exactly the same ones:

```python
import json
import platform

import pyarrow

versions = {
    "python": platform.python_version(),
    "numpy": np.__version__,
    "pandas": pd.__version__,
    "pyarrow": pyarrow.__version__,
}
print(json.dumps(versions))
pd.show_versions(as_json="environment.json")
```

```text
{"python": "3.15.0", "numpy": "2.5.4", "pandas": "3.0.6", "pyarrow": "26.0.0"}
```

`pd.show_versions()` prints the operating system and the versions of pandas and every library it
can use, the report the pandas developers ask for in bug reports; with `as_json="environment.json"`
it writes that report to a file instead. Pinning is a requirements file with exact versions,
installed into a virtual environment (the Python course covers both):

```text
numpy==2.5.4
pandas==3.0.6
pyarrow==26.0.0
```

```console
$ python -m pip install -r requirements.txt
```

## No hidden state

**Hidden state** is anything that changes a result without appearing in the code you are
reading. The commonest kind in pandas is a function that modifies the frame it was given:

```python
def add_vat(prices):
    prices["with_vat"] = prices["net"] * 1.2
    return prices


def add_vat_safely(prices):
    return prices.assign(with_vat=prices["net"] * 1.2)


menu = pd.DataFrame({"item": ["soup", "pie"], "net": [4.0, 5.5]})
add_vat_safely(menu)
print(list(menu.columns))
add_vat(menu)
print(list(menu.columns))
```

```text
['item', 'net']
['item', 'net', 'with_vat']
```

Copy-on-Write protects a frame from changes made through **another** object derived from it, but
`add_vat` received the very same object and changed it, so the caller's `menu` grew a column.
Code that runs later now sees different data depending on whether `add_vat` ran first. Write
data functions that take frames and return new ones (`assign`, method chains), never modify
their arguments, and read no global variables that other code changes. Global settings such as
`pd.set_option` belong at the top of a script, not halfway through.

## Fixed formats and idempotent pipelines

An output is easiest to check when a rerun produces the **same bytes**: then a hash or a `diff`
proves nothing changed. That needs fixed formats (float decimals, date format, line endings), a
defined row order, and no timestamps of "now" inside the data. A pipeline step is **idempotent**
when running it twice leaves the same result as running it once:

```python
import hashlib
from pathlib import Path


def write_summary(path):
    sales = pd.DataFrame({
        "day": pd.to_datetime(["2026-06-02", "2026-06-01", "2026-06-01"]),
        "stall": ["Herbs", "Bread", "Herbs"],
        "takings": [61.5, 112.25, 48.0],
    })
    summary = sales.groupby(["day", "stall"], as_index=False)["takings"].sum()
    summary.to_csv(path, index=False, float_format="%.2f", date_format="%Y-%m-%d", lineterminator="\n")


for run in range(2):
    write_summary("summary.csv")
    print(run, hashlib.sha256(Path("summary.csv").read_bytes()).hexdigest()[:16])
print(Path("summary.csv").read_text(encoding="utf-8"), end="")

for run in range(2):
    pd.DataFrame({"day": ["2026-06-01"], "total": [221.75]}).to_csv(
        "log.csv", mode="a", header=not Path("log.csv").exists(), index=False)
print(Path("log.csv").read_text(encoding="utf-8"), end="")
```

```text
0 9c4e67cbccb792a9
1 9c4e67cbccb792a9
day,stall,takings
2026-06-01,Bread,112.25
2026-06-01,Herbs,48.00
2026-06-02,Herbs,61.50
day,total
2026-06-01,221.75
2026-06-01,221.75
```

`hashlib.sha256(data).hexdigest()` is a fingerprint of the bytes: change one character of the
file and it changes. `write_summary` overwrites its file with sorted rows and fixed formats, so
both runs produce the same fingerprint. The second loop appends (`mode="a"`), so running the step twice recorded the same
day twice: not idempotent. Overwrite whole outputs, or, when you must add to a store, first
remove what an earlier run of the same input wrote.

## Scripts over notebooks

Notebooks are excellent for exploring, but their cells can run in any order, and the state in
memory may come from cells that were since edited or deleted. For anything that runs twice
(a weekly report, a figure in a paper), move the code into a script with functions, run it from
the top in a fresh process, and keep it with the pinned requirements under version control.
Lesson 8 builds such a script.

## Common mistakes

- **Seeding the global generator.** `np.random.seed(1)` is undone by any other code that draws.
  Pass a `Generator`.
- **Sorting on a column with ties, then taking the top rows.** Add a tie-breaking key.
- **Appending on every run.** Reruns duplicate rows; write whole files.
- **"It worked on my machine."** Without recorded and pinned versions you cannot tell whether a
  difference comes from the code or from pandas 2 against pandas 3.

## Practice

1. Draw 3 households per street, reproducibly.
2. Sort `results` so the order is fully determined, fastest first.
3. Why does adding a `print(rng.random())` near the top of a script change a sample taken later?

### Answers

```python
by_street = households.groupby("street").sample(n=3, random_state=np.random.default_rng(7))
fastest = results.sort_values(["minutes", "runner"], ignore_index=True)
```

1. `groupby(...).sample` draws within each group; the seeded generator fixes which rows.
2. `runner` is unique, so no two rows tie and the order is defined by the data.
3. Each draw advances the generator, so every later draw starts from a different point.

## Key takeaways

- Create a seeded `np.random.default_rng` once and pass it to everything random.
- Use `kind="stable"` or, better, a sort key with no ties.
- Record versions with each result (`pd.show_versions(as_json=...)`) and pin them.
- Functions return new frames instead of changing their arguments; avoid hidden globals.
- Fixed formats and overwriting outputs make reruns produce identical files.

## Further reading

- [NumPy: Random sampling](https://numpy.org/doc/stable/reference/random/index.html)
- [pandas: DataFrame.sort_values](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.sort_values.html)
- [pandas: show_versions](https://pandas.pydata.org/docs/reference/api/pandas.show_versions.html)
- [NumPy: numpy.sort (stability)](https://numpy.org/doc/stable/reference/generated/numpy.sort.html)
