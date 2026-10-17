In this lab you read compiler errors and fix a program until `tsc` accepts it, as lesson 2 did
with `toUppercase`. The lab compiles your file with the same strict settings as the course's
`tsconfig.json`; when there is a type error, Run stops and shows you the compiler's message
instead of running the program.

1. Press **Run** once as the file is. It type-checks and runs, and the visible test shows that
   two lines of the banner are missing.
2. Remove the `//` from the start of the line `const kioskNumber: number = "12";` and press
   **Run**. Read the error in four parts: the file, the position as (line,column), the code
   (`TS2322`) and the message. Two halves of that line disagree: the annotation says `number`,
   the value is a string. A kiosk number is a number, and the next line adds 1 to it, so decide
   which half to fix.
3. Remove the `//` from the next line, the one that prints `Kiosk ...`, and press **Run**.
4. Remove the `//` from the `Platform: ...` line and press **Run**. Read the error, which ends
   with a suggestion, and fix the line.
5. Press **Run** until the visible test passes, then **Submit**.

The banner should look like this. The last two values are `process.platform` and
`process.version`, so the platform and the exact version depend on the computer that runs the
program; the lab's computer runs Linux and Node.js 26:

```text
Library kiosk starting
Kiosk 12, next kiosk 13
Platform: linux
Node.js: v26.12.0
Ready
```

If the second line says `next kiosk 121`, you fixed the wrong half of the first line: `+` with a
string on either side joins text instead of adding numbers.
