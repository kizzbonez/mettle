Write `solution.ts`. The starter declares every type and function the tests use, with the exact
names, parameters and return types: keep them, and keep them exported. You may add functions of
your own. The tests import your functions, and also run your file as a program with
`node solution.js`, typing a sheet into its standard input. Keep the program part inside `main`,
which the starter calls under `if (import.meta.main)`, so that importing the file runs nothing.

1. **`Result`.** Replace `export type Result = string;` with a union of the four literal types
   `"flash"`, `"top"`, `"zone"` and `"miss"`, in lower case. A test checks that your type rejects
   any other string, such as `"fall"` or `"TOP"`.
2. **`points(result: Result): number`** returns 25 for a flash, 20 for a top, 10 for a zone and 0
   for a miss.
3. **`parseResult(text: string): Result | undefined`** removes spaces around `text`, ignores its
   case, and returns the matching result (`" Top "` gives `"top"`), or `undefined` for anything
   else. Narrow the text with `===` so that the compiler accepts it as a `Result`.
4. **`parseProblem(text: string): number | undefined`** reads a problem such as `P3`: a `P` or
   `p`, followed by one or more digits (`0` to `9`) and nothing else, whose value is from 1 to 99.
   `"P3"` gives 3, `"p12"` gives 12 and `"P07"` gives 7. `"P0"`, `"P100"`, `"P"`, `"3"`, `"Q3"`,
   `"P3.5"`, `"P-2"` and `"P+3"` all give `undefined`. Check the digits one character at a time:
   `Number` alone accepts things like `"+3"` and `"1e1"`.
5. **`parseLine(line: string): Attempt | string`** reads one line of the sheet. Fields are
   separated by one or more spaces, and spaces at either end are ignored. Return the first problem
   found, in this order, as a message string exactly like these:
   - not exactly 3 fields: `expected 3 fields, found 2` (with the real count);
   - the second field is not a problem: `unknown problem "Q3"` (the field as written);
   - the third field is not a result: `unknown result "Lizard"` (the field as written).

   Otherwise return the attempt: `climber` is the first field in lower case, so `Ada` and `ada`
   are the same climber.
6. **`standings(attempts: readonly Attempt[]): Standing[]`** returns one `Standing` for every
   climber who has at least one attempt:
   - only the climber's **best** result on each problem counts (a zone and later a top on P2 is
     worth 20, not 30);
   - `points` is the total of those best results, and `tops` is how many of them are a flash or a
     top;
   - sort by points, highest first; then by tops, most first; then by name in alphabetical order
     (`localeCompare`);
   - do not change the array you were given.
7. **`formatStanding(rank: number, standing: Standing): string`** returns one line of the table,
   with `top` for exactly one top and `tops` otherwise:

   ```text
   1. ada 45 (2 tops)
   3. eli 45 (1 top)
   ```
8. **`main`** reads the whole sheet with `readFileSync(0, "utf8")` and splits it into lines.
   Lines are numbered from 1, and every line counts, including the ones that are skipped.
   - Remove spaces at both ends of each line (this also removes the `\r` of Windows line endings).
     Skip a line that is then empty or starts with `#`.
   - For every other line, call `parseLine`. For a message, print `line N: message` to **standard
     error** with `console.error`, and set `process.exitCode = 1`.
   - Then print the standings to **standard output**, one `formatStanding` line each, with ranks
     counted from 1. If there are no valid attempts at all, print `No attempts` instead.
   - Leave the exit code at 0 when no line was rejected.

The sample round, typed into the program:

```text
# Ridgeline league, round 3
Ada P1 flash
ada P2 zone
Bo  P1 top
bo P2 miss
eli P1 FLASH
Ada P2 top
cy P1 lizard
cy P2
eli P2 zone
Bo P3 flash
eli P3 zone
dee P10 zone
```

Standard output:

```text
1. ada 45 (2 tops)
2. bo 45 (2 tops)
3. eli 45 (1 top)
4. dee 10 (0 tops)
```

Standard error, with exit code 1:

```text
line 8: unknown result "lizard"
line 9: expected 3 fields, found 2
```

Ada's zone on P2 is replaced by her later top, so she has 25 + 20 = 45. Bo has 20 + 0 + 25 = 45
with two tops as well, and comes first by name. Eli also has 45, but only one top.

**Tips.** Write and check the small functions first: `points`, `parseResult`, `parseProblem`. For
`standings`, an object with an index signature works well for remembering the best attempt per
climber and problem (a key such as `` `${climber} ${problem}` ``), and another for the totals per
climber; `Object.values` gives back what you stored. Use `toSorted` with a comparator.
