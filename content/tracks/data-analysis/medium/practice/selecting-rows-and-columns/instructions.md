Write the four functions of `solution.py`. `rooms` is a DataFrame with a RangeIndex and the
columns `room` (a unique code such as `"G01"` or `"103"`, as text), `floor`, `beds`, `view` and
`rate`; the room column is not always the first. No function changes the frame it is given.

1. `index_by_room(rooms)` returns the same table with `room` moved into the index (so the index is
   named `room` and `room` is no longer a column). The other columns keep their order.
2. `rate_of(indexed, room)` takes a frame like the one `index_by_room` returns and a room code,
   and returns that room's `rate`, a single value. A code that is not in the index raises
   `KeyError`.
3. `block(indexed, first, last, columns)` returns the rooms from the row labelled `first` to the
   row labelled `last`, **both included**, in the table's order, with only the columns in the list
   `columns`, in the order of that list. The result is always a DataFrame, even for one room or one
   column. `first` and `last` are in the index, and `first` does not come after `last`.
4. `last_rooms(indexed, n)` returns the last `n` rows **by position**, with the room code back as
   the first column `room` and the rows numbered from 0. `n` is from 0 to the number of rows; for
   0 it returns a frame with no rows and the same columns.

Example:

```python
rooms = pd.DataFrame(
    {
        "room": ["G01", "G02", "101", "102", "103", "201", "202"],
        "floor": [0, 0, 1, 1, 1, 2, 2],
        "beds": [2, 1, 2, 2, 3, 1, 4],
        "view": ["garden", "street", "sea", "street", "sea", "sea", "garden"],
        "rate": [95.0, 70.0, 120.0, 85.0, 140.0, 90.0, 160.0],
    }
)
indexed = index_by_room(rooms)
rate_of(indexed, "103")                              # 140.0
print(block(indexed, "102", "201", ["rate", "view"]))
print(last_rooms(indexed, 2))
```

```text
       rate    view
room               
102    85.0  street
103   140.0     sea
201    90.0     sea
  room  floor  beds    view   rate
0  201      2     1     sea   90.0
1  202      2     4  garden  160.0
```

**Tips.** `loc` takes labels and its slices include the stop; `iloc` takes positions and its
slices stop before the end, like a list. `at` reads one cell by labels. Check what `-0` means in a
slice before you rely on it. `reset_index` undoes `set_index`.
