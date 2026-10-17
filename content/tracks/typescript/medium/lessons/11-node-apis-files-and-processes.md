---
title: "Node.js APIs: Files and Processes"
summary: Read, write and list files with `node:fs/promises`, build paths with `node:path`, handle file errors by their `code`, replace files safely, work with raw bytes in a `Buffer`, and use `process` for arguments, environment variables, exit codes and signals.
minutes: 35
objectives:
  - Read, write, append and list files with `node:fs/promises`, and build paths with `node:path`
  - Recognize Node errors such as `ENOENT` and `EEXIST` with a type guard, and replace a file atomically
  - Convert between strings and bytes with `Buffer`
  - Use `process.argv`, `process.env`, `process.exitCode` and signal handlers in a command-line program
---

## Outline

1. Node's built-in modules
2. Files with `node:fs/promises`
3. Paths with `node:path`
4. File errors and safe writes
5. Bytes with `Buffer`
6. `process`: arguments, environment, exit codes and signals

## Node's built-in modules

Node.js ships modules for what a program needs from the operating system. You import them with
the `node:` prefix (lesson 1), and their types come from `@types/node`. The basic level used the
synchronous `readFileSync`, which blocks the whole program while it waits: fine in a short
script, not in a server. This lesson uses the promise versions in `node:fs/promises`.

## Files with `node:fs/promises`

```ts
import { appendFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const logDir = path.join("logs", "2026-10");
console.log(await mkdir(logDir, { recursive: true }));
console.log(await mkdir(logDir, { recursive: true }));

const logFile = path.join(logDir, "kiln.log");
await writeFile(logFile, "08:00 kiln on\n", "utf8");
await appendFile(logFile, "11:30 1200 C reached\n", "utf8");

const text = await readFile(logFile, "utf8");
console.log(text.split("\n").filter((line) => line !== ""));
console.log(await readdir(logDir));
console.log(path.basename(logFile), path.extname(logFile), path.dirname(logFile));
console.log(path.resolve(logFile));
console.log(path.join("logs", "..", "..", "etc", "passwd"));
```

```text
logs
undefined
[ '08:00 kiln on', '11:30 1200 C reached' ]
[ 'kiln.log' ]
kiln.log .log logs/2026-10
/tmp/work/logs/2026-10/kiln.log
../etc/passwd
```

- `mkdir` with `recursive: true` creates missing parent folders and does not fail if the folder
  exists. It returns the first folder it created, or `undefined` when there was nothing to do.
- `writeFile` creates or replaces a file; `appendFile` adds to the end.
- `readFile(file, "utf8")` returns a `string`. Without an encoding it returns a `Buffer` of raw
  bytes, and the compiler's types follow the same rule.
- `readdir` lists the names in a folder.

A relative path such as `logs/2026-10` is resolved against the **current working directory**,
`process.cwd()`, the folder the program was started from, not the folder of the script. To find a
file next to your module, use `import.meta.dirname`, the folder of the current module file:
`path.join(import.meta.dirname, "data", "firings.json")`.

## Paths with `node:path`

Never build paths by gluing strings with `/`. `path.join` uses the right separator for the
operating system (`\` on Windows) and tidies `..` and doubled separators. `path.resolve` turns a
path into an absolute one. `basename`, `extname` and `dirname` take a path apart.

The last line of output is a warning. `path.join` happily walks out of a folder with `..`, so
joining a folder with a name supplied by a user can reach any file on the machine. Check user
supplied names, for instance with `path.basename(name) === name`, before joining them.

## File errors and safe writes

File operations fail for ordinary reasons: a missing file, a missing permission, a full disk.
Node rejects with an `Error` that carries a `code` property, such as `ENOENT` (no such file) or
`EEXIST` (already exists). `@types/node` names that shape `NodeJS.ErrnoException`, and a type guard
gets you there from the `unknown` in `catch`:

```ts
import { readFile, rename, writeFile } from "node:fs/promises";

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function readOptional(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function writeAtomically(file: string, text: string): Promise<void> {
  const temporary = `${file}.tmp`;
  await writeFile(temporary, text, "utf8");
  await rename(temporary, file);
}

console.log(await readOptional("settings.json"));
await writeAtomically("settings.json", '{ "maxTemp": 1260 }\n');
console.log(await readOptional("settings.json"));

try {
  await writeFile("settings.json", "{}", { encoding: "utf8", flag: "wx" });
} catch (error) {
  console.log(isNodeError(error) ? `${error.code}: ${error.message}` : error);
}
```

```text
undefined
{ "maxTemp": 1260 }

EEXIST: EEXIST: file already exists, open 'settings.json'
```

Three habits are on show:

- **Handle only the error you expect.** A missing file means "no settings yet"; anything else is
  rethrown, so a permission problem is not mistaken for an empty file. Note `return await`
  inside `try`: without `await`, a rejection would escape the `catch`.
- **Replace files atomically.** If the program crashes halfway through `writeFile`, the file is
  left half written. Writing a temporary file and then renaming it over the original means a
  reader sees either the old file or the new one, because a rename on the same file system
  happens in one step.
- **Refuse to overwrite** with the flag `"wx"` (write, exclusive), which fails with `EEXIST` if
  the file exists.

The promise APIs are not synchronized: two concurrent writes to the same file can interleave
and corrupt it. Await one before starting the next.

## Bytes with `Buffer`

A `Buffer` is Node's container for raw bytes, a subclass of `Uint8Array`. Text becomes bytes
through an **encoding**, almost always UTF-8, in which some characters take more than one byte:

```ts
const label = "Kiln 3: 1260°C";
const bytes = Buffer.from(label, "utf8");
console.log(label.length, bytes.length);
console.log(bytes);
console.log(bytes.subarray(0, 4).toString("utf8"), bytes.toString("hex").slice(0, 8));
console.log(Buffer.from("cone 10").toString("base64"));
console.log(Buffer.from("Y29uZSAxMA==", "base64").toString("utf8"));
```

```text
14 15
<Buffer 4b 69 6c 6e 20 33 3a 20 31 32 36 30 c2 b0 43>
Kiln 4b696c6e
Y29uZSAxMA==
cone 10
```

The degree sign takes two bytes (`c2 b0`), so the buffer is one longer than the string. `toString`
decodes with any encoding, which is also how you produce hexadecimal or Base64 text.

## `process`: arguments, environment, exit codes and signals

The global `process` connects a program to whoever started it:

- `process.argv` holds the path of `node`, the path of the script, then the arguments, so the
  arguments are `process.argv.slice(2)`.
- `process.env` holds environment variables. Each is a `string | undefined`, and the compiler makes
  you handle both: `const port: number = process.env.PORT` is error TS2322, "Type 'string |
  undefined' is not assignable to type 'number'."
- `process.exitCode = 2` sets the exit status for when the program ends. Prefer it to
  `process.exit(2)`, which stops at once, even before pending output is written.
- `process.on("SIGTERM", handler)` runs code when the operating system asks the program to stop,
  for example to shut down cleanly. Installing a listener replaces Node's default of exiting.

```ts
const [target, ...rest] = process.argv.slice(2);
const units = process.env.KILN_UNITS ?? "C";

if (target === undefined || rest.length > 0 || !/^\d+$/.test(target)) {
  console.error("usage: node main.js <target-temperature>");
  process.exitCode = 2;
} else {
  console.log(`heating to ${target} ${units}`);
  const heating = setInterval(() => console.log("still heating"), 60_000);
  process.once("SIGTERM", (signal) => {
    console.log(`received ${signal}, switching the kiln off`);
    clearInterval(heating);
  });
  process.kill(process.pid, "SIGTERM");
}
```

```console
$ node main.js 1260
heating to 1260 C
received SIGTERM, switching the kiln off
$ KILN_UNITS=F node main.js 2300
heating to 2300 F
received SIGTERM, switching the kiln off
$ node main.js hot
usage: node main.js <target-temperature>
$ echo $?
2
```

The program sends itself `SIGTERM` to show the handler. The interval keeps it alive meanwhile:
signal events arrive asynchronously, and a program with nothing left to do may exit before its
listener runs. Errors go to standard error with `console.error`, so they do not mix with output.

## Common mistakes

- **Assuming the script's folder is the working directory.** Use `import.meta.dirname` for files
  that ship with the code.
- **Swallowing every error** with an empty `catch`. Check `error.code` and rethrow the rest.
- **Using `process.exit()` right after printing.** Set `process.exitCode` and let the program end.
- **Forgetting the encoding**: `readFile(file)` returns a `Buffer`, and `text.split` is then error
  TS2339, "Property 'split' does not exist on type 'NonSharedBuffer'". Pass `"utf8"`.

## Practice

1. Write `countLines(file)` that returns the number of non-blank lines, or 0 if the file does not
   exist.
2. Write `readPort(env)` that returns `env.PORT` as a number, 8080 when it is missing, and throws
   a `RangeError` when it is not a whole number from 1 to 65535.
3. Why write to `settings.json.tmp` and rename it, instead of writing `settings.json` directly?

### Answers

```ts
import { readFile, writeFile } from "node:fs/promises";

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function countLines(file: string): Promise<number> {
  try {
    const text = await readFile(file, "utf8");
    return text.split("\n").filter((line) => line.trim() !== "").length;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

function readPort(env: NodeJS.ProcessEnv): number {
  const text = env.PORT ?? "8080";
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError(`PORT must be a whole number from 1 to 65535, got "${text}"`);
  }
  return port;
}

await writeFile("firings.log", "kiln 1\n\nkiln 2\n", "utf8");
console.log(await countLines("firings.log"), await countLines("missing.log"));
console.log(readPort({}), readPort({ PORT: "3000" }));
try {
  readPort({ PORT: "eighty" });
} catch (error) {
  console.log(error instanceof RangeError ? error.message : error);
}
```

```text
2 0
8080 3000
PORT must be a whole number from 1 to 65535, got "eighty"
```

Taking `env` as a parameter makes `readPort` easy to test. 3: a crash during the write would
leave a half-written file; a rename replaces the file in one step.

## Key takeaways

- Import built-ins with `node:`; use `node:fs/promises` with `await`, and give `readFile` an
  encoding to get a string.
- Build paths with `node:path`; relative paths start from `process.cwd()`.
- Narrow file errors to `NodeJS.ErrnoException` and branch on `code`; replace files by writing a
  temporary file and renaming it.
- `Buffer` holds bytes; `process` gives arguments, environment (`string | undefined`), exit codes
  and signals.

## Further reading

- [Node.js 26: File system (`node:fs/promises`)](https://nodejs.org/docs/latest-v26.x/api/fs.html)
- [Node.js 26: Path](https://nodejs.org/docs/latest-v26.x/api/path.html)
- [Node.js 26: Process](https://nodejs.org/docs/latest-v26.x/api/process.html)
- [Node.js 26: Buffer](https://nodejs.org/docs/latest-v26.x/api/buffer.html)
