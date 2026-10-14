Write the four functions of `solution.py`. Every path they receive may be a `str` or a
`pathlib.Path`. Open every file with `encoding="utf-8"`. Two sample books are in the folder
`data/`: `2026-autumn.txt` and `2026-winter.txt`, next to `house-rules.md`.

A guest book is a text file of lines `NAME: MESSAGE`. A season's book starts with the line
`# Guest book SEASON`.

1. `sign(path, name, message)` adds the line `NAME: MESSAGE` and a newline at the **end** of
   the file, creating the file if it does not exist. What is already in the file stays.
2. `read_entries(path)` returns a list of `(name, message)` tuples, one per entry, in the order
   of the file. Strip each line first; a line that is then empty, starts with `#`, or has no
   `: ` in it is not an entry. Split an entry at its **first** `: `. A file that does not exist
   gives `[]`.
3. `new_book(folder, season)` creates the folder, with any missing parent folders, if needed.
   Then it creates the file `SEASON.txt` in it, opened with mode `"x"`, holding the line
   `# Guest book SEASON` and a newline, and returns `True`. If that file already exists, it
   leaves it exactly as it is and returns `False`.
4. `seasons(folder)` returns the sorted list of the names without `.txt` of the `.txt` files in
   the folder. A folder without any, or a folder that does not exist, gives `[]`.

Example:

```python
from pathlib import Path

new_book("guestbook", "2027-summer")     # True
new_book("guestbook", "2027-summer")     # False: it exists already
book = Path("guestbook") / "2027-summer.txt"
sign(book, "Zoë", "Lovely view of the bay!")
sign(book, "Tom", "The kettle: needs descaling")
read_entries(book)
# [('Zoë', 'Lovely view of the bay!'), ('Tom', 'The kettle: needs descaling')]
seasons("guestbook")                     # ['2027-summer']
seasons("data")                          # ['2026-autumn', '2026-winter']
read_entries("guestbook/2026-spring.txt")   # []
```

**Tips.** Mode `"a"` appends and creates; `"w"` would empty the file first. Mode `"x"` raises
FileExistsError when the file exists: catch it rather than checking first. `Path.mkdir` takes
`parents=True, exist_ok=True`, and `Path.glob("*.txt")` lists in no particular order.
