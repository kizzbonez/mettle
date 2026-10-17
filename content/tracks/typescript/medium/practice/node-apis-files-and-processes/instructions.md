Use the promise APIs from `node:fs/promises` (already imported) and `process`. Relative paths are
resolved against the working folder, where the tests also run.

1. **`readJournal(file: string): Promise<string[]>`** reads the file as UTF-8 and returns its
   lines, leaving out lines that are empty or only spaces. A file that does not exist (`ENOENT`)
   is an empty journal: return `[]`. Any other error, such as `EISDIR` for a folder, is
   rethrown. Use `isNodeError` to read the error's `code`.
2. **`saveSchedule(file: string, schedule: Record<string, number>): Promise<void>`** replaces the
   file atomically with `JSON.stringify(schedule, null, 2)` followed by `"\n"`: write
   `<file>.tmp`, then `rename` it over `<file>`. No `.tmp` file is left behind.
3. **`intervalDays(env: NodeJS.ProcessEnv): number`** reads `env.WATER_EVERY`, the days between
   waterings: 7 when it is missing. It throws a `RangeError` unless the value, converted with
   `Number`, is a whole number from 1 to 60.
4. **The program**, `main`, run as `node solution.js <journal> <plant> <YYYY-MM-DD>`:
   - Without exactly three arguments, it prints a line starting with `usage:` to standard error
     (`console.error`) and sets `process.exitCode = 2`.
   - It reads the interval with `intervalDays(process.env)`. On a `RangeError`, it prints the
     error's message to standard error, sets `process.exitCode = 2`, and writes nothing.
   - Otherwise it creates the journal's folder if needed (`mkdir` of `path.dirname(journal)`
     with `recursive: true`), appends the line `<YYYY-MM-DD> <plant>` and a newline, and prints
     `<plant> watered, entry <number of entries now>, next in <days> days`.

Example:

```console
$ node solution.js journal.txt fern 2026-10-17
fern watered, entry 1, next in 7 days
$ WATER_EVERY=3 node solution.js journal.txt "string of pearls" 2026-10-18
string of pearls watered, entry 2, next in 3 days
$ node solution.js journal.txt fern
usage: node solution.js <journal> <plant> <YYYY-MM-DD>
$ echo $?
2
```

```ts
await readJournal("journal.txt")     // ["2026-10-17 fern", "2026-10-18 string of pearls"]
await readJournal("missing.txt")     // []
await saveSchedule("schedule.json", { fern: 7, cactus: 21 })
intervalDays({ WATER_EVERY: "0" })   // throws a RangeError
```
