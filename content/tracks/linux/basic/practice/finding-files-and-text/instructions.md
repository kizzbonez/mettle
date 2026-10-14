The tests make a folder holding `tickets.txt`, one ticket per line, and a folder tree called
`floors`, go into it and run your script there:

```bash
bash solution.sh
```

The starter prints four headings. Under each one, write one command or one pipeline:

1. **leaks**: how many lines of `tickets.txt` contain the word `leak` on its own, in any case.
   `Leak` and `LEAK` count; `leaks`, `leaky` and `bleak` do not. Print only the number.
2. **open**: the lines of `tickets.txt` that do not contain `done`, each with its line number in
   front, as `grep` numbers lines.
3. **logs**: the paths of the **regular files** anywhere under `floors` whose names end in
   `.log`, starting with `floors/`, sorted. A folder whose name ends in `.log` is not listed, and
   `.LOG` is a different ending.
4. **urgent**: the paths of the files anywhere under `floors` that contain `URGENT` in capitals,
   sorted. Print each path once, however many times the word appears in the file.

`find` and `grep -r` list files in whatever order they meet them, so pipe both lists into `sort`.
Nothing may appear on standard error.

For the visible test, `tickets.txt` holds

```text
101 tap leak in bathroom done
204 Leak under the sink
305 lightbulb out
112 leaky roof in corridor
220 LEAK behind the fridge done
318 door sticks
```

and `floors` holds `1/boiler.log` (with a line saying `URGENT`), `1/notes.txt`, `2/lift.log` and
`2/rooms.txt` (also with `URGENT`). The script prints:

```text
== leaks ==
3
== open ==
2:204 Leak under the sink
3:305 lightbulb out
4:112 leaky roof in corridor
6:318 door sticks
== logs ==
floors/1/boiler.log
floors/2/lift.log
== urgent ==
floors/1/boiler.log
floors/2/rooms.txt
```

The hidden tests add words such as `leaks,` and `Leak.`, a folder called `old.log`, logs deeper
in the tree, names with spaces, a lower-case `urgent`, and a `.log` file next to `tickets.txt`.
