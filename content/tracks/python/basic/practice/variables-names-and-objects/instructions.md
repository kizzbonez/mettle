The script reads two meter readings: the one at the start of the month, then the one at the end.
Both are bound to the same name, `reading`, so the second assignment rebinds `reading` and the
first reading would be lost. The tests run your file as a script and type the two readings into
it, one per line. Write only where a comment says `YOUR CODE`.

1. **Keep the old reading.** Before the second `reading = int(input())` line, bind a new name,
   `previous`, to the object `reading` refers to at that moment. As the lesson's `bonus = score`
   example showed, rebinding `reading` afterwards moves only the label `reading`; `previous` keeps
   referring to the first reading.
2. **Print the units used.** At the end, print `Used this month:` followed by the new reading
   minus the previous one. Give `print` the text and the calculation separated by a comma, as the
   two lines above it do, so that one space appears between them.

Example: when the tests type `4127` and then `4398`, the script prints:

```text
Previous reading: 4127
New reading: 4398
Used this month: 271
```

The hidden tests type other readings, so the numbers must come from the names, never be written
into the script.

**Tip:** if **Run** reports `NameError: name 'previous' is not defined`, the line that binds
`previous` is missing, or it comes after the line that uses it. Python runs the lines from top to
bottom.
