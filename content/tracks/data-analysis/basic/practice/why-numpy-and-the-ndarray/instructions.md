Finish the one function of `solution.py`. The starter already imports NumPy and turns the
distances into an array called `rides`: you write the `return` line.

1. `ride_report(miles)` receives `miles`, a list of distances in miles, or a list of lists with
   one list per member. It returns a dict with four keys:
   - `"shape"`: the shape of `rides`, a tuple;
   - `"size"`: the number of distances in `rides`;
   - `"dtype"`: the dtype of `rides`, the one NumPy picked;
   - `"km"`: every distance converted to kilometres by multiplying it by `MILES_TO_KM`
     (1.609344), as an array of the **same shape** as `rides`. Compute it in one expression on
     the whole array: no loop and no comprehension.

Example:

```python
report = ride_report([[12.5, 20.0, 31.0], [8.0, 15.5, 0.0]])
report["shape"]   # (2, 3): two members, three Sundays
report["size"]    # 6
report["dtype"]   # dtype('float64')
report["km"]
# array([[20.1168  , 32.18688 , 49.889664],
#        [12.874752, 24.944832,  0.      ]])

ride_report([10, 25, 40])["dtype"]   # dtype('int64'): whole numbers only
```

**Tips.** `shape`, `size` and `dtype` are attributes of the array, read without brackets.
`len(rides)` is the length of the first axis only, not the number of distances. Multiplying an
array by a number multiplies every element.
