Write `solution.py`. The starter declares every class, method and function the tests use: keep
their names and parameters. You may add helper functions and private attributes. The sheets are
in the folder `data/`: `maple-close.txt`, `station-road.txt` and `allotments.txt`.

**A sheet.** Each line of a sheet is one of:

- a **blank line** (empty or only whitespace), skipped;
- a **comment**: its first non-whitespace character is `#`, skipped;
- a **sighting**: `TIME SPECIES COUNT`, fields separated by one or more spaces, with spaces
  allowed around the line. The species is every field between the first and the last, so it
  may be several words: `07:26 wood  pigeon 3`.

Lines are numbered from 1, and every line counts, including the skipped ones.

1. **Exceptions.** Define `SurveyError(Exception)`, the base class, and two subclasses of it:
   - `SheetLineError(line_number, text, reason)` stores the three arguments as attributes of
     the same names, and its message (`str(error)`) is `line N: REASON`, for example
     `line 9: bad count`.
   - `MissingSheetError(path)` stores `path` (a `str`) as an attribute, and its message is
     `no such sheet: PATH`.
2. **`Sighting(time, species, count)`** stores the three as attributes `time` (a `str` such as
   `"07:05"`), `species` (a `str`) and `count` (an `int`). `repr()` of a sighting is exactly
   `Sighting('07:05', 'blue tit', 4)`.
3. **`parse_line(text, line_number)`** turns the text of one sighting line into a `Sighting`.
   Split the text on whitespace, then check in this order and raise
   `SheetLineError(line_number, text, reason)` at the first problem, with `reason`:
   - `"too few fields"` if there are fewer than three fields;
   - `"bad time"` unless the first field is two decimal digits, a colon and two decimal digits,
     with hours from `00` to `23` and minutes from `00` to `59`;
   - `"bad count"` unless the last field is made only of decimal digits and is at least 1.

   The species is the fields in between, lower-cased and joined with single spaces.
4. **`sheet_lines(path)`** is a **generator function**. It opens the file (a `str` or a
   `Path`) as UTF-8 text and yields a tuple `(line_number, text)` for each line that is not
   blank and not a comment, where `text` is the line with the whitespace around it removed.
5. **`BirdCount()`** starts with two empty lists of its own: `sightings` and `problems`.
   - **`add_sheet(path)`** reads one sheet (a `str` or a `Path`) with `sheet_lines` and
     `parse_line`. It appends each `Sighting` to `sightings`. For each line that raises
     `SheetLineError`, it appends to `problems` the string `FILE line N: REASON`, where `FILE`
     is the file's name without its folders: `maple-close.txt line 9: bad count`. Then it
     carries on with the next line. It returns the number of sightings it added from this
     sheet. If the file does not exist, it raises `MissingSheetError(str(path))`, chained with
     `raise ... from` to the `FileNotFoundError`, and the count is unchanged.
   - **`total_birds`** is a read-only **property**: the sum of the counts of all sightings.
   - **`totals()`** returns a dict from each species to its total number of birds, with the
     keys in alphabetical order.
   - **`top(n=3)`** returns a list of at most `n` tuples `(species, total)`, the highest total
     first; species with the same total are in alphabetical order.
   - **`seen_between(start, end)`** returns the sorted list of distinct species with at least
     one sighting whose time is from `start` to `end`, both included. Times such as `"07:05"`
     compare correctly as strings.

Example, with the Maple Close sheet:

```text
 1  # Garden bird count, Saturday 3 October 2026
 2  # Volunteer: Ines, 12 Maple Close
 3
 4  07:02 blackbird 2
 5  07:05 Blue Tit 4
 6  07:11 robin 1
 7  07:18 blackbird 1
 8  07:26 wood  pigeon 3
 9  07:31 robin one
10  7:40 dunnock 1
11  07:44 house sparrow 6
```

```python
count = BirdCount()
count.add_sheet("data/maple-close.txt")   # 6
count.problems                            # ['maple-close.txt line 9: bad count',
                                          #  'maple-close.txt line 10: bad time']
count.sightings[1]                        # Sighting('07:05', 'blue tit', 4)
count.totals()                            # {'blackbird': 3, 'blue tit': 4, 'house sparrow': 6,
                                          #  'robin': 1, 'wood pigeon': 3}
count.total_birds                         # 17
count.top(2)                              # [('house sparrow', 6), ('blue tit', 4)]
count.seen_between("07:05", "07:18")      # ['blackbird', 'blue tit', 'robin']
next(sheet_lines("data/maple-close.txt")) # (4, '07:02 blackbird 2')
parse_line("7:40 dunnock 1", 10)          # raises SheetLineError: line 10: bad time
count.add_sheet("data/nowhere.txt")       # raises MissingSheetError: no such sheet: data/nowhere.txt
```

**Tips.** Write and try `parse_line` first; `str.partition`, `isdecimal` and starred
unpacking or a `match` on the list of fields keep it short. A comprehension and a generator
expression make `totals` and `total_birds` one statement each. Remember that a generator
function's body runs only when you iterate over it, so the `FileNotFoundError` appears inside
the loop of `add_sheet`, not at the call of `sheet_lines`.
