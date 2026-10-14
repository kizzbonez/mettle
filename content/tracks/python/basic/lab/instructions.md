Write `solution.py`. It has two parts: four functions at the top, which the tests also call
directly, and below them the **script part**, which reads the notes and prints the result. Keep
the function names and parameters exactly as in the starter. The four functions must not print
anything.

1. `normalize_section(name)` returns the section name in lower case, with the words separated by
   single spaces and no spaces at either end. `normalize_section("  Mezzo  Soprano SOLOISTS ")`
   returns `"mezzo soprano soloists"`.

2. `parse_headcount(line)` takes one line of notes, such as `"First Sopranos, 2"`, and returns a
   **tuple** `(section, count)`: the normalized section name and the count as an `int`, here
   `("first sopranos", 2)`. Check the line in this order and, at the first problem, raise
   `ValueError` with exactly this message:

   | Problem | Message |
   | --- | --- |
   | the line does not contain exactly one comma | `expected 'section, count'` |
   | the section is empty after normalizing | `section is missing` |
   | the count, with the spaces around it removed, is not a whole number as `int()` reads it | `count is not a whole number` |
   | the count is less than 1 | `count must be at least 1` |

   So `"tenors, four"`, `"tenors, 2.5"` and `"tenors,"` have a count that is not a whole number,
   while `"tenors, -2"` has a whole number that is too small.

3. `record(tally, section, count)` updates the dictionary `tally`, which maps section names to
   counts. If the section is not in it yet, add it with `count`. If it is, keep the **larger**
   of the stored count and `count`. It returns nothing.

4. `report_lines(tally)` returns the report as a **list of strings**:
   - if `tally` is empty, the list `["no singers counted"]`;
   - otherwise one line `"<section>: <count>"` per section in alphabetical order, then
     `"sections: <number of sections>, singers: <sum of the counts>"`, then
     `"largest section: <section> (<count>)"` for the section with the largest count. If several
     share the largest count, name the one that comes first alphabetically.

5. The **script part**, below the functions:
   - Read the notes with `input()`, **without a prompt**, one line at a time, until `input()`
     raises `EOFError` at the end of the input.
   - Number the lines from 1. Every line counts, including the ones that are skipped.
   - Skip a line that is empty or contains only spaces, and a line whose first character after
     any spaces is `#`.
   - Pass every other line to `parse_headcount`. If it raises `ValueError`, print
     `line <number>: <message>` straight away and carry on with the next line. Otherwise
     `record` the headcount.
   - At the end, print each string from `report_lines` on its own line.

Example. With this input:

```text
# Thursday rehearsal, Riverside hall
altos, 2
Basses, 1
second  sopranos, 6
altos, 3
tenors, four

baritones, 0
basses, 2
tenors
altos, 1
```

the script prints exactly:

```text
line 6: count is not a whole number
line 8: count must be at least 1
line 10: expected 'section, count'
altos: 3
basses: 2
second sopranos: 6
sections: 3, singers: 11
largest section: second sopranos (6)
```

The altos score 3, the largest count at one time, not 2 + 3 + 1. With no usable lines at all,
the script prints only `no singers counted`.

**Tips.** Write and try the functions in order; each one uses the ones before it. To try the
whole script, run it and type the notes, then press Ctrl+D (Ctrl+Z then Enter on Windows) to end
the input. Remember that `int(" 7 ")` already ignores the spaces around a number.
