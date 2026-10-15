This time you write the tests, not the code. `solution.py` starts with two working functions,
`attendance` and `sprint_scores`, and a helper `make` that builds a small register from
`(player, status)` tuples (`None` is a missing status). Read their docstrings and do not change
them. Below them are two `unittest.TestCase` classes with one test each. Add test methods so that
the classes check every rule listed here, on small frames and arrays you build inside the tests.
Compare frames with `pdt.assert_frame_equal` and arrays with `np.testing.assert_allclose` or
`assert_array_equal`, never with `==`.

**How it is judged.** The lab runs your two classes with `unittest`, first against correct
versions of the functions, where every test must pass, and then against broken versions, each
with one of the mistakes below, where at least one of your tests must fail. (It swaps the
functions in the module, so call them by their plain names, `attendance(...)`, as the starter
does.)

1. `AttendanceTest` checks `attendance(register)`:
   - `rate` is each player's share of recorded sessions with the status `"present"`, **not
     rounded**: 2 of 3 is `2 / 3`, not `0.67`;
   - `sessions` counts the recorded sessions only, and is `int64`;
   - a missing status (no register taken that day) is neither present nor absent: it is left out;
   - a player whose every status is missing has no row;
   - the rows are sorted by player, with the index 0 to n-1, whatever order the register is in;
   - a register of one row works, and an empty register (`make([])`) gives a frame with no rows
     and the columns `player`, `sessions` and `rate`.
2. `SprintScoresTest` checks `sprint_scores(seconds)`:
   - each score is the best time divided by that time, **not rounded**: `6.0` against `7.0`
     scores `6 / 7`;
   - a missing time (`np.nan`) scores NaN, and is ignored when finding the best;
   - when every time is missing, every score is NaN;
   - the array it is given is left unchanged.

**Example.** If someone removed the `dropna` line, a missing status would count as absent. A test
like this one fails then, because Ana would have 3 sessions and a rate of `1 / 3`:

```python
def test_missing_status_is_left_out(self):
    register = make([("Ana", "present"), ("Ana", None), ("Ana", "absent")])
    expected = pd.DataFrame({"player": ["Ana"], "sessions": [2], "rate": [0.5]})
    pdt.assert_frame_equal(attendance(register), expected)
```

The visible check runs your classes against the correct functions, against an `attendance` that
counts a missing status as absent, and against a `sprint_scores` that divides each time by the
best instead of the best by each time. The hidden checks use other broken versions, one for each
rule above.

**Tips.** `assert_frame_equal` checks dtypes and the index too, so keep its defaults.
`assert_allclose` treats NaNs in the same places as equal; keep a `copy()` of an input to check
it afterwards. Run the file with `python solution.py` to see your tests pass.
