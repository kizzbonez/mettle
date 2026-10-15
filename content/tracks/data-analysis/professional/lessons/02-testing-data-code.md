---
title: Testing Data Code
summary: Prove that data functions return what you think. Compare frames and arrays with `pandas.testing` and `numpy.testing` instead of `==`, choose `check_dtype`, `check_like` and tolerances deliberately, build tiny fixtures by hand, and test the edge cases (empty frames, missing values, one row) with `unittest`.
minutes: 35
objectives:
  - Explain why `==` and `DataFrame.equals` are poor tests for frames
  - Compare frames and Series with `assert_frame_equal` and `assert_series_equal`, using `check_dtype`, `check_like` and `rtol`
  - Compare arrays with `np.testing.assert_array_equal` and `assert_allclose`
  - Write small hand-made fixtures and `unittest` tests that cover empty frames, missing values and one row
---

## Outline

1. Why data code needs tests
2. Why `==` is not a test
3. `assert_frame_equal` and `assert_series_equal`
4. Arrays: `assert_array_equal` and `assert_allclose`
5. Fixtures and edge cases with `unittest`

## Why data code needs tests

A bug in data code rarely crashes. It returns a plausible number that is wrong: a rate computed
over the wrong rows, a join that dropped a few customers, a missing value counted as zero. The
only defence is to run each function on a small input whose correct answer you worked out by
hand, and compare. That comparison is the hard part with tables, because a DataFrame has values,
dtypes, an index and column names, and floats that are almost but not exactly equal.

## Why `==` is not a test

Suppose a function returns each delivery driver's on-time rate and you expect two thirds for Ana:

```python
import pandas as pd

result = pd.DataFrame({"driver": ["Ana", "Ben"], "on_time": [2 / 3, 1.0]})
expected = pd.DataFrame({"driver": ["Ana", "Ben"], "on_time": [0.667, 1.0]})
print(result == expected)
print(result.equals(expected))
assert result == expected
```

```text
   driver  on_time
0    True    False
1    True     True
False
Traceback (most recent call last):
  File "/tmp/work/main.py", line 7, in <module>
    assert result == expected
           ^^^^^^^^^^^^^^^^^^
  ...
ValueError: The truth value of a DataFrame is ambiguous. Use a.empty, a.bool(), a.item(), a.any() or a.all().
```

`==` compares element by element and returns a frame, which `assert` cannot turn into one `True`
or `False`. `equals` returns a single bool, but it says nothing about **what** differs, and it
has no tolerance: `0.6666666666666666` is not `0.667`, and you could never write the exact float
by hand anyway.

## `assert_frame_equal` and `assert_series_equal`

The module `pandas.testing` holds assertion functions built for this. `assert_frame_equal(left,
right)` returns nothing when the frames match and raises `AssertionError` with a description of
the first difference when they do not. It checks the values, each column's dtype, the index, the
column names and their order:

```python
import pandas.testing as pdt

result = pd.DataFrame({"driver": ["Ana", "Ben"], "late": [1, 0], "on_time": [2 / 3, 1.0]})
expected = pd.DataFrame({"driver": ["Ana", "Ben"], "late": [1.0, 0.0], "on_time": [0.667, 1.0]})
pdt.assert_frame_equal(result, expected)
```

```text
Traceback (most recent call last):
  ...
AssertionError: Attributes of DataFrame.iloc[:, 1] (column name="late") are different

Attribute "dtype" are different
[left]:  int64
[right]: float64
```

Each option relaxes one check, and you should relax only what does not matter to the caller:

- `check_dtype=False` accepts `1` and `1.0` as equal. Keep the default when callers depend on the
  dtype (a count must stay an integer).
- `rtol` and `atol` set the tolerance for floats: values pass when `|left - right| <= atol + rtol * |right|`.
  The defaults are `rtol=1e-5` and `atol=1e-8`; integer columns are compared exactly unless you
  pass a tolerance or `check_exact=False`.
- `check_like=True` ignores the **order** of rows and columns, while still matching each label
  with its own data.

```python
try:
    pdt.assert_frame_equal(result, expected, check_dtype=False)
except AssertionError as error:
    print(error)
pdt.assert_frame_equal(result, expected, check_dtype=False, rtol=1e-3)
reordered = expected[["on_time", "driver", "late"]]
pdt.assert_frame_equal(result, reordered, check_dtype=False, rtol=1e-3, check_like=True)
print("both passed")
```

```text
DataFrame.iloc[:, 2] (column name="on_time") are different

DataFrame.iloc[:, 2] (column name="on_time") values are different (50.0 %)
[index]: [0, 1]
[left]:  [0.6666666666666666, 1.0]
[right]: [0.667, 1.0]
At positional index 0, first diff: 0.6666666666666666 != 0.667
both passed
```

The relative difference between `0.6667` and `0.667` is about `5e-4`, more than the default
`1e-5`, so the first call fails; with `rtol=1e-3` it passes. A better fix is usually to write the
expected value the way it is computed, `2 / 3`, and keep the default tolerance.

`assert_series_equal` does the same for a Series and also compares its `name`, which trips
people up: `pdt.assert_series_equal(result["late"], pd.Series([1, 0]))` fails with
`Attribute "name" are different`, because the left Series is named `late`. Give the expected Series
the same name, or pass `check_names=False`.

## Arrays: `assert_array_equal` and `assert_allclose`

`numpy.testing` provides the same for arrays. `assert_array_equal` demands exact equality, and,
unlike `==`, treats NaNs in the same positions as equal. `assert_allclose` allows a tolerance,
`rtol=1e-7` by default, and is the one to use for floats:

```python
import numpy as np

totals = np.array([0.1, 0.2, np.nan]) * 3
try:
    np.testing.assert_array_equal(totals, [0.3, 0.6, np.nan])
except AssertionError as error:
    print(error)
np.testing.assert_allclose(totals, [0.3, 0.6, np.nan])
print("assert_allclose passed")
```

```text

Arrays are not equal

Mismatched elements: 2 / 3 (66.7%)
Mismatch at indices:
 [0]: 0.30000000000000004 (ACTUAL), 0.3 (DESIRED)
 [1]: 0.6000000000000001 (ACTUAL), 0.6 (DESIRED)
Max absolute difference among violations: 1.11022302e-16
Max relative difference among violations: 1.85037171e-16
 ACTUAL: array([0.3, 0.6, nan])
 DESIRED: array([0.3, 0.6, nan])
assert_allclose passed
```

`0.1 * 3` is `0.30000000000000004` in binary floating point (lesson 6 explains why), so exact
comparison of computed floats is almost always the wrong test. The tolerance is relative to the
second argument, so pass the expected values second.

## Fixtures and edge cases with `unittest`

A **fixture** is the input a test runs on. For data code the best fixtures are tiny frames built
inside the test, a handful of rows where you can see the right answer, rather than a sample of
the real file. A small helper that builds them keeps each test to the point.

Python's built-in `unittest` module runs the tests (the Python course's Production Python level
covers it in depth). A test is a method whose name starts with `test_` on a subclass of
`unittest.TestCase`; methods such as `assertEqual` and `assertIn` check results, and
`unittest.main()` runs every test in the file:

```python
import unittest

import pandas as pd
import pandas.testing as pdt


def on_time_rate(deliveries):
    """Share of each driver's delivered parcels that arrived by the promised time."""
    done = deliveries.dropna(subset=["delivered"])
    on_time = done["delivered"] <= done["promised"]
    return on_time.groupby(done["driver"]).mean().rename("on_time").reset_index()


def make(rows):
    """A small deliveries frame from (driver, promised, delivered) tuples."""
    frame = pd.DataFrame(rows, columns=["driver", "promised", "delivered"])
    for column in ["promised", "delivered"]:
        frame[column] = pd.to_datetime(frame[column], format="%H:%M")
    return frame


class OnTimeRateTest(unittest.TestCase):
    def test_rate_per_driver(self):
        deliveries = make([("Ana", "10:00", "09:50"), ("Ana", "11:00", "11:20"), ("Ben", "10:00", "10:00")])
        expected = pd.DataFrame({"driver": ["Ana", "Ben"], "on_time": [0.5, 1.0]})
        pdt.assert_frame_equal(on_time_rate(deliveries), expected)

    def test_parcel_not_delivered_is_left_out(self):
        deliveries = make([("Ana", "10:00", "09:50"), ("Ana", "11:00", None)])
        self.assertEqual(on_time_rate(deliveries)["on_time"].tolist(), [1.0])

    def test_one_row(self):
        self.assertEqual(on_time_rate(make([("Cy", "10:00", "10:01")]))["on_time"].tolist(), [0.0])

    def test_empty_frame(self):
        result = on_time_rate(make([]))
        self.assertEqual(list(result.columns), ["driver", "on_time"])
        self.assertEqual(len(result), 0)

    def test_driver_with_nothing_delivered(self):
        deliveries = make([("Ana", "10:00", "09:50"), ("Dee", "10:00", None)])
        self.assertNotIn("Dee", on_time_rate(deliveries)["driver"].tolist())


if __name__ == "__main__":
    unittest.main(verbosity=2)
```

The last four tests are the **edge cases** that break data code: a missing value, a single row,
no rows at all, and a group whose column is entirely missing. They are worth more than another
ordinary case. To see them earn their place, remove the `dropna` line and run the file. A missing
`delivered` time compares as `False`, so an undelivered parcel counts as late:

```console
$ python test_deliveries.py
test_driver_with_nothing_delivered (__main__.OnTimeRateTest.test_driver_with_nothing_delivered) ... FAIL
test_empty_frame (__main__.OnTimeRateTest.test_empty_frame) ... ok
test_one_row (__main__.OnTimeRateTest.test_one_row) ... ok
test_parcel_not_delivered_is_left_out (__main__.OnTimeRateTest.test_parcel_not_delivered_is_left_out) ... FAIL
test_rate_per_driver (__main__.OnTimeRateTest.test_rate_per_driver) ... ok
...
AssertionError: 'Dee' unexpectedly found in ['Ana', 'Dee']
...
AssertionError: Lists differ: [0.5] != [1.0]
...
FAILED (failures=2)
```

(The output is shortened.) With the line back, all five pass.

## Common mistakes

- **`assert df1 == df2`.** It raises `ValueError: The truth value of a DataFrame is ambiguous`.
  Use `assert_frame_equal`.
- **Exact comparison of computed floats.** `assert_array_equal(totals, [0.3, 0.6])` fails on
  `0.30000000000000004`. Use `assert_allclose`, or `assert_frame_equal`'s default tolerance.
- **Turning off every check.** `check_dtype=False, check_like=True, check_names=False` together
  can hide the very bug a test should catch, such as a count that became a float.
- **Testing only the happy path.** Most data bugs live in empty input, missing values and single
  rows; write those tests first.

## Practice

1. `assert_frame_equal(a, b)` fails only because `a` has the index `[3, 7]` and `b` the index
   `[0, 1]`. Fix the test without changing what it checks about values and columns.
2. Which assertion would you use to check that a function returns the mean temperatures
   `[12.4, 13.1]` computed from many readings, and why?
3. Write a test that `on_time_rate` keeps the driver order sorted by name.

### Answers

1. Compare `a.reset_index(drop=True)` with `b`, if the index carries no meaning for the caller.
2. `np.testing.assert_allclose(result, [12.4, 13.1])` (or `assert_series_equal` with a
   tolerance): a computed mean is a float that will rarely equal the literal exactly.
3. ```python
   def test_drivers_sorted(self):
       deliveries = make([("Zoe", "10:00", "09:00"), ("Ana", "10:00", "09:00")])
       self.assertEqual(on_time_rate(deliveries)["driver"].tolist(), ["Ana", "Zoe"])
   ```

## Key takeaways

- Use `pandas.testing.assert_frame_equal` and `assert_series_equal`, never `==`, to test frames.
- They check values, dtypes, index and names; relax only what does not matter with `check_dtype`,
  `check_like`, `check_names`, `rtol` and `atol`.
- Use `np.testing.assert_allclose` for float arrays and `assert_array_equal` for exact ones.
- Build tiny fixtures inside the test, and always test empty frames, missing values and one row.

## Further reading

- [pandas: assert_frame_equal](https://pandas.pydata.org/docs/reference/api/pandas.testing.assert_frame_equal.html)
- [pandas: assert_series_equal](https://pandas.pydata.org/docs/reference/api/pandas.testing.assert_series_equal.html)
- [NumPy: assert_allclose](https://numpy.org/doc/stable/reference/generated/numpy.testing.assert_allclose.html)
- [Python: unittest](https://docs.python.org/3/library/unittest.html)
