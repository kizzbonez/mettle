Write `solution.ts` as a module that is also a program. Keep the four `export`ed names, which the
tests import, and keep the program part in `main`, which the starter runs only under
`if (import.meta.main)`. The tests also run your file as `node solution.js`, typing a log into
its standard input and sometimes passing an argument.

1. **`parseReading(line: string): Reading | string`** reads one line such as `07:30,3.5`. Split
   it at `","` and remove spaces around each field. Return the first problem found, as a message
   exactly like these:
   - not exactly 2 fields: `expected "time,celsius" but found 1 field(s)` (with the real count);
   - a time that is not 5 characters long with `:` as its third character:
     `"7:30" is not a time like 07:30` (the trimmed time);
   - a temperature that is empty or not a number: `"cold" is not a temperature`.

   Otherwise return the reading. Temperatures may be 0 or below.
2. **`parseLimit(text: string | undefined): number | undefined`** reads the program's first
   argument. With no argument (`undefined`) the limit is 5. Otherwise convert it with `Number`,
   and return `undefined` when the text is empty or not a number.
3. **`tooWarm(readings: readonly Reading[], limit: number): Reading[]`** returns the readings
   **above** the limit, in their order. A reading equal to the limit is fine.
4. **`main`**:
   - Read the limit with `parseLimit(process.argv.at(2))`. If it is `undefined`, print
     `the limit must be a number, got "<argument>"` to standard error, set
     `process.exitCode = 2`, and stop without reading the log.
   - Read the whole log with `readFileSync(0, "utf8")` and split it into lines, numbered from 1.
     `trim()` each line, and skip it when it is then empty or starts with `#`.
   - Give every other line to `parseReading`. For a message, print `line N: <message>` to
     standard error and set `process.exitCode = 1`.
   - Print `<count> readings, <warm> above <limit> C` to standard output, then one line
     `too warm at <time>: <celsius> C` for each reading above the limit.

Example log, typed into the program with no argument:

```text
# Walk-in fridge, Tuesday
07:30,3.5
10:00,4
12:30,6.5
14:00,warm
1600,4.5
18:30,5
21:00,7
```

Standard output:

```text
5 readings, 2 above 5 C
too warm at 12:30: 6.5 C
too warm at 21:00: 7 C
```

Standard error, with exit code 1:

```text
line 5: "warm" is not a temperature
line 6: "1600" is not a time like 07:30
```

The reading of exactly 5 at 18:30 is not above the limit. With the argument `6`, the same log
prints `5 readings, 2 above 6 C` and the same two lines; with `7`, it prints
`5 readings, 0 above 7 C` and nothing else.
