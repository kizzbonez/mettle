The tests run your file as a script and type two lines into it: the runners' names, separated by
spaces, and their finishing times in whole seconds, in the same order. The starter reads them
into two lists, `names` and `times` (already converted to `int`). Write only where a comment says
`YOUR CODE`.

1. If the two lists are not the same length, print `names and times do not match` and nothing
   else. If both are empty, print `no runners` and nothing else.
2. Pair each time with its name in a **tuple** `(time, name)`, with `zip`, and sort the pairs.
   Tuples compare item by item, so the fastest comes first, and runners with the same time are
   ordered by their names, as Python compares strings.
3. Print one line per runner in that order: `<position>. <name> <time>`, with positions from 1
   (use `enumerate`). Write each time as minutes, a colon, and the seconds as two digits, such as
   `24:55` or `0:59`. A time of an hour or more stays in minutes: 3725 seconds is `62:05`.
4. Print `spread: <time>`: the slowest time minus the fastest, written the same way. A single
   runner gives `spread: 0:00`.

Example: with the input

```text
Ada Bo Cy Di
1520 1495 1610 1495
```

the script prints:

```text
1. Bo 24:55
2. Di 24:55
3. Ada 25:20
4. Cy 26:50
spread: 1:55
```

Bo and Di share the fastest time, so Bo comes first, by name. The spread is 1610 - 1495 = 115
seconds.

**Tips.** `divmod(seconds, 60)` returns the minutes and the seconds left over as a tuple; unpack it
into two names, and write the seconds with `:02d` in an f-string. In
`for position, (seconds, name) in enumerate(...)` the parentheses unpack each pair. After
sorting, the first pair is the fastest and the last pair the slowest.
