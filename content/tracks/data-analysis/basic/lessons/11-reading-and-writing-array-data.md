---
title: Reading and Writing Array Data
summary: Load numeric text files with `np.loadtxt`, read files with gaps with `np.genfromtxt`, write text with `np.savetxt` and a chosen format, save arrays exactly with `np.save`, `np.load` and `np.savez`, and see where NumPy's file reading stops being enough.
minutes: 35
objectives:
  - Read a CSV of numbers with `np.loadtxt`, using `delimiter`, `skiprows`, `usecols`, `dtype` and `unpack`
  - Read a file with missing values into NaN with `np.genfromtxt`, and fill them with `filling_values`
  - Write an array as text with `np.savetxt`, controlling `fmt`, `header` and `comments`
  - Save and load arrays in NumPy's binary `.npy` and `.npz` formats
  - Recognise files that need pandas, such as mixed types, named columns, text and dates
---

## Outline

1. Reading numbers with `np.loadtxt`
2. When `loadtxt` fails: gaps
3. Missing values with `np.genfromtxt`
4. Writing text with `np.savetxt`
5. Binary files: `np.save`, `np.load`, `np.savez`
6. Where NumPy stops being enough

## Reading numbers with `np.loadtxt`

`np.loadtxt(fname)` reads a text file in which every line is a row of numbers. `fname` can be a file name, a `Path` or an open file. The examples here keep the data in the script with `io.StringIO`, which wraps a string so that it reads like a file; with a real file, pass its name instead. The key options:

- `delimiter`: the character between values. The default is any whitespace, so a CSV needs `delimiter=","`.
- `skiprows`: how many lines to skip at the top, such as a header line.
- `usecols`: which columns to read, counting from 0.
- `dtype`: the dtype of the result, `float` by default.
- `unpack=True`: return each column as its own array.

```python
import io

import numpy as np

csv_text = """day,max_c,min_c,rain_mm
1,14.2,6.1,0.0
2,15.8,7.4,2.5
3,12.9,5.0,11.2
4,16.4,8.3,0.4
"""
weather = np.loadtxt(io.StringIO(csv_text), delimiter=",", skiprows=1)
print(weather.shape, weather.dtype)
print(weather[:, 1])
max_c, rain = np.loadtxt(io.StringIO(csv_text), delimiter=",", skiprows=1, usecols=(1, 3), unpack=True)
print(max_c, rain)
days = np.loadtxt(io.StringIO(csv_text), delimiter=",", skiprows=1, usecols=0, dtype=np.int64)
print(days)
```

```text
(4, 4) float64
[14.2 15.8 12.9 16.4]
[14.2 15.8 12.9 16.4] [ 0.   2.5 11.2  0.4]
[1 2 3 4]
```

The whole file becomes one `(4, 4)` float table; the header line is skipped and its names are lost. `unpack=True` transposes the result so that the two selected columns unpack into two names. Lines starting with `#` are treated as comments and skipped.

## When `loadtxt` fails: gaps

`loadtxt` is fast and strict: every row must have the same number of values, and every value must convert to the dtype. A gap or a marker such as `NA` stops it:

```python
import io

import numpy as np

csv_text = """day,max_c,min_c,rain_mm
1,14.2,6.1,0.0
2,15.8,,2.5
3,12.9,5.0,NA
"""
try:
    np.loadtxt(io.StringIO(csv_text), delimiter=",", skiprows=1)
except ValueError as error:
    print(error)
```

```text
could not convert string '' to float64 at row 1, column 3.
```

The same `ValueError` appears when you forget `skiprows` (`could not convert string 'day' to float64`) and when you forget `delimiter=","` on a CSV (`could not convert string '1,2' to float64`). The reference points to `genfromtxt` for files with missing values.

## Missing values with `np.genfromtxt`

`np.genfromtxt` is the patient sibling. The NumPy guide explains that it reads in two passes: first it splits each line into strings, then it converts each string, so it can notice values that are missing. By default an empty field is missing, `missing_values=` adds markers such as `"NA"`, and in a float array missing values become NaN. Its option for header lines is `skip_header`:

```python
import io

import numpy as np

csv_text = """day,max_c,min_c,rain_mm
1,14.2,6.1,0.0
2,15.8,,2.5
3,12.9,5.0,NA
4,16.4,8.3,0.4
"""
weather = np.genfromtxt(io.StringIO(csv_text), delimiter=",", skip_header=1, missing_values="NA")
print(weather)
print(np.isnan(weather).sum(axis=0))
print(np.nanmean(weather[:, 2]).round(2))
filled = np.genfromtxt(io.StringIO(csv_text), delimiter=",", skip_header=1, missing_values="NA", filling_values=0.0)
print(filled[:, 3])
```

```text
[[ 1.  14.2  6.1  0. ]
 [ 2.  15.8  nan  2.5]
 [ 3.  12.9  5.   nan]
 [ 4.  16.4  8.3  0.4]]
[0 0 1 1]
6.47
[0.  2.5 0.  0.4]
```

Everything from lessons 6 and 9 now applies: count the gaps per column with `np.isnan(...).sum(axis=0)`, summarise with the `nan` functions, or replace them through a mask. `filling_values=0.0` fills the gaps at read time instead. Choose deliberately: an unrecorded rainfall is not the same as a dry day. Plain text in a numeric column also becomes NaN, silently, so count the NaN after reading.

## Writing text with `np.savetxt`

`np.savetxt(fname, arr)` writes a one- or two-dimensional array as text. Without options it writes every value with 18 significant digits in scientific notation, separated by spaces. `fmt` sets the format, one `%` format for all columns or a list with one per column (`"%d"` an integer, `"%.1f"` one decimal). `header` writes a first line, and `comments=""` stops NumPy from starting it with `# `:

```python
from pathlib import Path

import numpy as np

summary = np.array([[1, 14.2, 6.1], [2, 15.8, 7.4], [3, 12.9, 5.0]])
np.savetxt("summary.csv", summary, delimiter=",", fmt=["%d", "%.1f", "%.1f"], header="day,max_c,min_c", comments="")
print(Path("summary.csv").read_text(encoding="utf-8"))
np.savetxt("raw.txt", summary[:1])
print(Path("raw.txt").read_text(encoding="utf-8"))
```

```text
day,max_c,min_c
1,14.2,6.1
2,15.8,7.4
3,12.9,5.0

1.000000000000000000e+00 1.419999999999999929e+01 6.099999999999999645e+00

```

The default format shows that 14.2 is not stored exactly as a float, which is one reason to choose `fmt` for files people will read.

## Binary files: `np.save`, `np.load`, `np.savez`

Text loses information: the dtype, the shape, and digits you did not write. NumPy's own binary format keeps everything and is smaller and faster to read. `np.save` writes one array to a `.npy` file, `np.load` reads it back, and `np.savez` puts several named arrays in one `.npz` file:

```python
import numpy as np

counts = np.array([[3, 0, 5], [2, 7, 1]], dtype=np.int16)
np.save("counts.npy", counts)
loaded = np.load("counts.npy")
print(loaded, loaded.dtype, loaded.shape)

temps = np.linspace(10.0, 12.0, 5)
np.savez("station.npz", counts=counts, temps=temps)
with np.load("station.npz") as archive:
    print(archive.files)
    print(archive["temps"])
```

```text
[[3 0 5]
 [2 7 1]] int16 (2, 3)
['counts', 'temps']
[10.  10.5 11.  11.5 12. ]
```

The `int16` dtype and the shape came back exactly. For an `.npz`, `np.load` returns an archive that behaves like a dictionary of arrays; open it in a `with` block so the file is closed. `np.savez_compressed` does the same with compression. Use these formats to pass arrays between your own NumPy programs; use text when people or other tools must read the file.

## Where NumPy stops being enough

Real files mix types: a station name, a date, a temperature. A NumPy array has one dtype, so this is where it struggles:

```python
import io

import numpy as np

csv_text = """station,date,max_c
Harbour,2026-10-01,14.2
Hilltop,2026-10-01,11.8
Harbour,2026-10-02,15.8
"""
try:
    np.loadtxt(io.StringIO(csv_text), delimiter=",", skiprows=1)
except ValueError as error:
    print(error)
print(np.genfromtxt(io.StringIO(csv_text), delimiter=",", skip_header=1))
table = np.genfromtxt(io.StringIO(csv_text), delimiter=",", names=True, dtype=None, encoding="utf-8")
print(table)
print(table.dtype)
print(table["max_c"][table["station"] == "Harbour"])
```

```text
could not convert string 'Harbour' to float64 at row 0, column 1.
[[ nan  nan 14.2]
 [ nan  nan 11.8]
 [ nan  nan 15.8]]
[('Harbour', '2026-10-01', 14.2) ('Hilltop', '2026-10-01', 11.8)
 ('Harbour', '2026-10-02', 15.8)]
[('station', '<U7'), ('date', '<U10'), ('max_c', '<f8')]
[14.2 15.8]
```

`loadtxt` refuses, and plain `genfromtxt` turns the text into NaN. With `names=True` and `dtype=None`, `genfromtxt` builds a **structured array**: one element per row, with named fields of different dtypes. It works for a quick look, but the dates are still strings, there is no grouping, no joining of two files, and every operation is by hand. This is the job pandas was built for: a table of named columns, each with its own dtype, read from CSV, JSON and more in one call. The next level of this course starts there, and keeps using NumPy underneath every column.

## Common mistakes

- **Forgetting `delimiter=","` or `skiprows=1`.** The error names the string it could not convert: `'1,2'` or `'day'`.
- **`loadtxt` on a file with gaps.** Use `genfromtxt`, then count the NaN it produced.
- **Integer columns with gaps.** `np.genfromtxt(..., dtype=int)` fills a gap with `-1`, which looks like real data. Read as float so gaps are NaN.
- **Rows of different lengths.** `loadtxt` raises `ValueError: the number of columns changed from 2 to 3 at row 2`.
- **A single-row file.** `loadtxt` returns a one-dimensional array; pass `ndmin=2` to always get a table.

## Practice

The text below has a comment line, a header, and gaps:

```text
# meter readings, kWh
flat,jan,feb,mar
1,310,295,
2,420,,350
3,190,185,170
```

1. Read the three monthly columns into a float array with NaN for the gaps.
2. Compute each month's mean, ignoring gaps.
3. Write each flat's total to `totals.csv`, one whole number per line.
4. Save the readings to `readings.npy` and check that they load back unchanged.

### Answers

```python
import io

import numpy as np

csv_text = """# meter readings, kWh
flat,jan,feb,mar
1,310,295,
2,420,,350
3,190,185,170
"""
readings = np.genfromtxt(io.StringIO(csv_text), delimiter=",", skip_header=2, usecols=(1, 2, 3))
print(readings)
print(np.nanmean(readings, axis=0).round(1))
np.savetxt("totals.csv", np.nansum(readings, axis=1), fmt="%.0f")
np.save("readings.npy", readings)
print(np.array_equal(np.load("readings.npy"), readings, equal_nan=True))
```

```text
[[310. 295.  nan]
 [420.  nan 350.]
 [190. 185. 170.]]
[306.7 240.  260. ]
True
```

`skip_header=2` skips the comment and the header. `totals.csv` holds 605, 770 and 545 on three lines. `np.array_equal` needs `equal_nan=True`, because NaN never equals NaN.

## Key takeaways

- `np.loadtxt` reads clean numeric text fast: `delimiter`, `skiprows`, `usecols`, `dtype`, `unpack`.
- `np.genfromtxt` turns empty fields and `missing_values` into NaN, or into `filling_values`.
- `np.savetxt` writes text; set `fmt`, and `header` with `comments=""` for a plain CSV header.
- `np.save`/`np.load` (`.npy`) and `np.savez` (`.npz`) keep dtype and shape exactly.
- Mixed columns, names and dates are pandas' job, which comes next.

## Further reading

- [NumPy fundamentals: importing data with genfromtxt](https://numpy.org/doc/stable/user/basics.io.genfromtxt.html)
- [numpy.loadtxt](https://numpy.org/doc/stable/reference/generated/numpy.loadtxt.html)
- [numpy.savetxt](https://numpy.org/doc/stable/reference/generated/numpy.savetxt.html)
- [numpy.savez](https://numpy.org/doc/stable/reference/generated/numpy.savez.html)
