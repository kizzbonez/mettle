---
title: Reading Input and Putting It Together
summary: Read command-line arguments and standard input, split input into lines and validate each one by narrowing, report problems on standard error with an exit code, split a program into modules with export and import, and build a complete command-line program.
minutes: 40
objectives:
  - Read command-line arguments with `process.argv` and all of standard input with `readFileSync(0, "utf8")`
  - Split input into lines, skip blank and comment lines, and validate each line into a typed value or an error message
  - Write results to standard output, problems to standard error, and set `process.exitCode`
  - Export functions from one file, import them in another, and use `import.meta.main` to run a file's main part only when it is the program
---

## Outline

1. A program's inputs and outputs
2. Command-line arguments
3. Reading standard input
4. Validating each line
5. Output, errors and exit codes
6. Modules: `export` and `import`
7. The complete program

## A program's inputs and outputs

A command-line program talks to the world through a few channels:

- **arguments**, the words typed after the program's name;
- **standard input** (stdin), text typed at the keyboard or fed in from a file;
- **standard output** (stdout), where results go, normally the terminal;
- **standard error** (stderr), a second output for problems, so they never mix with results;
- the **exit code**, a number the program leaves behind: 0 for success, anything else for failure.

This lesson builds a program that reads a log of walks, checks every line, and prints a report.

## Command-line arguments

`process.argv` is an array of strings: the path of the `node` program, the path of the script,
then every argument. `slice(2)` keeps just the arguments:

```ts
console.log(process.argv.slice(2));
const walker = process.argv.at(2) ?? "walker";
console.log(`Hello, ${walker}!`);
```

```console
$ node dist/args.js Ada --loud
[ 'Ada', '--loud' ]
Hello, Ada!
$ node dist/args.js
[]
Hello, walker!
```

Arguments are always strings; convert and check them like any other input. `at(2)` has the type
`string | undefined`, which honestly says that the argument may be missing, so `??` supplies a
default.

## Reading standard input

Every running program has standard input open as **file descriptor** 0, a number the operating
system uses to name an open file. `readFileSync` from Node's `node:fs` module accepts a file
descriptor as well as a file name, so this reads everything on stdin as one string:

```ts
import { readFileSync } from "node:fs";

const lines = readFileSync(0, "utf8").split("\n");
```

The `import` line brings in a function from one of Node's built-in modules; the `node:` prefix
marks them. `"utf8"` asks for text rather than raw bytes. The call waits until the input ends. The
reliable way to give a program its input is to feed it a file, with `<` in a Unix shell or a pipe
in PowerShell:

```console
$ node dist/trails.js < hikes.txt
> Get-Content hikes.txt | node dist/trails.js
```

Splitting on `"\n"` gives one string per line. Files written on Windows end lines with `"\r\n"`,
so `trim()` each line before you use it, and expect an empty string after the final line break.

## Validating each line

Every line is untrusted text. The types of lesson 1 cannot check it; your code must. A good shape
is a function that takes the line and returns **either** the typed value **or** a message that
says what is wrong, a union the caller narrows:

```ts
export interface Hike {
  trail: string;
  km: number;
}

export function parseHike(line: string): Hike | string {
  const fields = line.split(",");
  if (fields.length !== 2) {
    return `expected "trail,km" but found ${fields.length} field(s)`;
  }
  const trail = fields[0].trim();
  const kmText = fields[1].trim();
  if (trail === "") {
    return "the trail name is empty";
  }
  const km = Number(kmText);
  if (kmText === "" || Number.isNaN(km) || km <= 0) {
    return `"${kmText}" is not a positive distance`;
  }
  return { trail, km };
}
```

Each check rules out one problem, in order, and the last line is reached only by a valid hike.
`{ trail, km }` is shorthand for `{ trail: trail, km: km }`. A bad line is an expected outcome,
not a bug, so `parseHike` returns a message instead of throwing (lesson 12). The caller tells the
two apart with `typeof result === "string"`.

## Output, errors and exit codes

`console.log` writes to stdout and `console.error` to stderr. Someone who saves the report with
`node dist/trails.js < hikes.txt > report.txt` still sees the problems on the screen, and the
report file holds only results.

To fail, set `process.exitCode = 1` and let the program finish normally. Node's documentation
advises this over `process.exit(1)`, which stops the program at once, possibly before everything
written to stdout has been delivered. Scripts and build tools read the exit code: in a Unix shell,
`echo $?` prints it.

## Modules: `export` and `import`

A **module** is a file that shares some of its names with other files. `export` before a
declaration shares it; `import { ... } from "..."` uses it. In a project with
`"type": "module"`, every file is a module, which is why lesson 1's compiled output ended with
`export {};`.

The functions above live in `src/trails.ts`. A second file can use them:

```ts
import { parseHike, totalKm } from "./trails.js";

console.log(parseHike("Ridge Loop, 12.5"));
console.log(parseHike("Lake Path, far"));
console.log(totalKm([{ trail: "A", km: 2 }, { trail: "B", km: 3.5 }]));
```

```console
$ node dist/try-trails.js
{ trail: 'Ridge Loop', km: 12.5 }
"far" is not a positive distance
5.5
```

The import names `./trails.js`, the file `tsc` will write into `dist`, although you edit
`trails.ts`: with `"module": "nodenext"`, TypeScript follows Node's rule that relative imports
include the extension of the file that will actually run. The medium level covers modules in
depth.

`trails.ts` is also a program with a `main` function that reads stdin. Importing it must not run
that, or `try-trails.js` would sit waiting for input. `import.meta.main` is `true` only in the file
Node.js was started with, the same idea as Python's `__name__ == "__main__"`, so the program part
goes under it:

```ts
if (import.meta.main) {
  main();
}
```

Node's documentation still marks `import.meta.main` as early development, but it works in Node.js
26 and is the simplest way to write a file that is both a program and a module.

## The complete program

Here is the rest of `src/trails.ts`, after `parseHike`:

```ts
export function totalKm(hikes: readonly Hike[]): number {
  return hikes.reduce((sum, hike) => sum + hike.km, 0);
}

function main(): void {
  const lines = readFileSync(0, "utf8").split("\n");
  const hikes: Hike[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const result = parseHike(line);
    if (typeof result === "string") {
      console.error(`line ${i + 1}: ${result}`);
      process.exitCode = 1;
    } else {
      hikes.push(result);
    }
  }
  console.log(`${hikes.length} hikes, ${totalKm(hikes).toFixed(1)} km`);
  const longest = hikes.toSorted((a, b) => b.km - a.km).at(0);
  if (longest !== undefined) {
    console.log(`Longest: ${longest.trail} (${longest.km} km)`);
  }
}

if (import.meta.main) {
  main();
}
```

With this `hikes.txt`:

```text
# October walks
Ridge Loop, 12.5
Pine Walk,4
Lake Path, far
Old Mill Lane
Summit Trail, 18.2
```

compile and run:

```console
$ npx tsc
$ node dist/trails.js < hikes.txt
line 4: "far" is not a positive distance
line 5: expected "trail,km" but found 1 field(s)
3 hikes, 34.7 km
Longest: Summit Trail (18.2 km)
$ echo $?
1
```

Lines are numbered from 1 and the comment counts, so a reader can find line 4 in the file. Every
earlier lesson is here: strings and numbers checked before use, a loop with `continue`, a union
narrowed with `typeof`, an array sorted with a copy, `undefined` handled, and the output split
between stdout and stderr.

## Common mistakes

- **Leaving out the extension.** `import { double } from "./math";` is refused:

  ```text
  main.ts(1,24): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './math.js'?
  ```

- **Running the importing file with type stripping.** `node src/try-trails.ts` fails with
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/tmp/trails/src/trails.js'`, because `src`
  holds only `.ts` files. Compile with `npx tsc` and run `dist`.
- **Forgetting `\r`.** Without `trim()`, a Windows file leaves `"4\r"` in the last field. `Number`
  happens to ignore it, but `=== "IN"` and similar comparisons fail.
- **`process.exit(1)` right after printing.** Output may be cut off. Set `process.exitCode`.
- **Top-level code in a module others import.** It runs on every import. Put it in `main` under
  `if (import.meta.main)`.

## Practice

1. Change `main` so that an empty log (no valid hikes) prints `No hikes` instead of the summary.
2. What exit code does the program leave for a file with only valid lines, and for an empty file?
3. Write `parseKm(text: string): number | undefined` and use it inside `parseHike`.

### Answers

1. Before the summary, add:

   ```ts
   if (hikes.length === 0) {
     console.log("No hikes");
     return;
   }
   ```
2. 0 in both cases: only a rejected line sets `process.exitCode`. An empty file prints
   `0 hikes, 0.0 km` with the original code.
3. ```ts
   function parseKm(text: string): number | undefined {
     const km = Number(text);
     return text === "" || Number.isNaN(km) || km <= 0 ? undefined : km;
   }
   ```

   In `parseHike`, call `const km = parseKm(kmText);` and return the message when it is
   `undefined`.

## Key takeaways

- `process.argv.slice(2)` holds the arguments; `readFileSync(0, "utf8")` reads all of stdin.
- Split input into lines, `trim()` each, skip blanks and comments, and validate every line.
- Return a typed value or a message from a parser, and narrow the union in the caller.
- Results go to stdout with `console.log`, problems to stderr with `console.error`; set
  `process.exitCode` to report failure.
- `export` and `import` connect modules; relative imports name the `.js` file; `import.meta.main`
  guards the program part.

## Further reading

- [Node.js 26 documentation: process.argv and process.exitCode](https://nodejs.org/docs/latest-v26.x/api/process.html#processargv)
- [Node.js 26 documentation: fs.readFileSync](https://nodejs.org/docs/latest-v26.x/api/fs.html#fsreadfilesyncpath-options)
- [Node.js 26 documentation: ECMAScript modules, import.meta.main](https://nodejs.org/docs/latest-v26.x/api/esm.html#importmetamain)
- [TypeScript handbook: Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
