Write the four functions of `solution.py`, each with one of the creation functions from the
lesson. None of them uses a loop or a list comprehension.

1. `results_board(heats, lanes)` returns a `float64` array of shape `(heats, lanes)` in which
   every value is `-1.0`, the mark for "no time yet".
2. `lane_numbers(lanes)` returns the integer array of lane numbers `1, 2, ..., lanes`: both
   ends included.
3. `heat_starts(session_minutes, heats)` returns a `float64` array of `heats` start times, in
   minutes from the start of the session: evenly spaced, the first at `0`, and the end of the
   session itself **not** a start. For a 60-minute session of 4 heats that is 0, 15, 30 and 45.
4. `as_times(times)` receives a list of race times in seconds, or an array of them, and returns
   them as a `float64` array. When `times` already **is** a `float64` array, it returns that
   same array object, not a copy.

Example:

```python
results_board(2, 4)
# array([[-1., -1., -1., -1.],
#        [-1., -1., -1., -1.]])
lane_numbers(6)        # array([1, 2, 3, 4, 5, 6])
heat_starts(60, 4)     # array([ 0., 15., 30., 45.])
heat_starts(90, 4)     # array([ 0. , 22.5, 45. , 67.5])

pads = np.array([31.2, 29.8, 33.05])
as_times(pads) is pads     # True: already float64, so nothing is copied
as_times([31, 30])         # array([31., 30.])
```

**Tips.** `full` takes its dtype from the value you fill with. `arange` leaves out its stop
value. An `arange` with a fractional step can make one value too many; `linspace` takes a
count instead, and `endpoint=False` leaves the end out. `np.array` always copies an array it
is given, `np.asarray` only when it must.
