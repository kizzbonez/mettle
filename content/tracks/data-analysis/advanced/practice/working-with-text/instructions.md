Write the three functions of `solution.py`. Each takes a text column (a Series of dtype `str`,
possibly with missing values), returns a result with the **same index**, and must not change
its input. The sample is `data/packets.csv`, with the columns `label`, `kind` and `notes`.

1. `split_labels(labels)` returns a DataFrame with the columns `crop`, `year` and `number`. A
   label is valid when, after removing the spaces around it and making it upper case, it is
   **exactly** three letters, a dash, four digits, a dash and three digits, such as
   `TOM-2025-014`. Then `crop` is the three letters (`str`), `year` the four digits as a
   number (`float64`) and `number` the last three digits as text, keeping leading zeros
   (`str`). For any other label, and a missing one, all three are missing.
2. `seed_kind(answers)` turns the donors' free-text answers into a fixed set. First clean each
   answer: remove the spaces around it, make it lower case, remove a note in round brackets
   together with the spaces before it, and replace every run of spaces inside it by one space.
   Then map the known spellings:
   - `heirloom` to `heirloom`;
   - `op`, `open pollinated` and `open-pollinated` to `open-pollinated`;
   - `f1`, `f1 hybrid` and `hybrid` to `hybrid`.

   Anything else, an empty answer and a missing one become missing. Return a **categorical**
   Series named `kind` with the categories `heirloom`, `open-pollinated`, `hybrid`, in that order.
3. `mentions(notes, phrase)` returns a `bool` Series: `True` where the note contains `phrase`,
   ignoring case. Take `phrase` **literally**: in `"1+1"` or `"a.m."` the `+` and `.` are just
   characters. A missing note is `False`.

Example:

```python
packets = pd.read_csv("data/packets.csv")
print(split_labels(packets["label"]))
seed_kind(packets["kind"]).tolist()
# ['heirloom', 'open-pollinated', 'hybrid', 'open-pollinated', nan, nan]
mentions(packets["notes"], "organic").tolist()
# [False, False, False, False, True, True]
mentions(packets["notes"], "10+").tolist()
# [False, False, False, True, False, False]
```

```text
  crop    year number
0  TOM  2025.0    014
1  BEA  2024.0    003
2  NaN     NaN    NaN
3  CHI  2025.0    101
4  LET  2025.0    022
5  NaN     NaN    NaN
```

`pea 2023 7` has no dashes and `SQU-2024-0091` has four digits at the end, so neither is a
valid label. `f1  hybrid` has two spaces inside and `Open pollinated (dry year)` a note in
brackets; `dunno` is not a known spelling.

**Tips.** Anchor a pattern with `^` and `$` so that it must match the whole label.
`astype(float)` turns extracted digits into floats, missing values included; `pd.to_numeric`
would give integers whenever no label is missing. `str.replace` needs `regex=True` for a
pattern such as `r"\s+"`, while `str.contains` treats its pattern as a regex unless you pass
`regex=False`. A dict passed to `map` turns every value that is not a key into a missing value.
