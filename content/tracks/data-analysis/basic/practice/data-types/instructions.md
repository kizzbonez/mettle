Write the three functions of `solution.py`. None of them changes the arrays it is given, and
none uses a loop.

1. `net_totals(first, second)` receives two `uint8` arrays of the same shape: the creatures
   caught by the first and the second net at each spot. It returns their sum as an **`int64`**
   array of that shape, correct even when a total is above 255.
2. `whole_cm(depths)` receives a float array of depths in centimetres and returns them as an
   **`int64`** array of whole centimetres, each **rounded** to the nearest whole number with
   `np.round` (which sends a half to the even neighbour: 30.5 becomes 30, 7.5 becomes 8), not
   cut off.
3. `missing_temps(temps)` receives a float array of water temperatures, of any shape, in which
   NaN marks a missing reading, and returns how many readings are missing, as a whole number.

Example:

```python
first = np.array([12, 250, 0, 31], dtype=np.uint8)
second = np.array([9, 10, 4, 0], dtype=np.uint8)
net_totals(first, second)    # array([ 21, 260,   4,  31]); first + second gives 4 at the second spot
whole_cm(np.array([12.4, 30.5, 7.5, 18.9]))     # array([12, 30,  8, 19])
missing_temps(np.array([14.5, np.nan, 13.9, np.nan]))   # 2
```

**Tips.** Adding two `uint8` arrays gives a `uint8` array, which wraps past 255 without a
word: convert before you add. `astype(np.int64)` on floats drops the fraction, so round
first. NaN is not equal to anything, itself included; `np.isnan` finds it, and `True` counts
as 1 in a sum.
