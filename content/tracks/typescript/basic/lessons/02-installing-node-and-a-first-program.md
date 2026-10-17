---
title: Installing Node.js and a First Program
summary: Install Node.js 26 with the official installer or a version manager, create a project with TypeScript 7 installed locally, configure a strict tsconfig.json, compile and run a first program, read a compiler error, and run a .ts file directly with Node's type stripping.
minutes: 30
objectives:
  - Install Node.js 26 and check the versions of node, npm and tsc
  - Create a project with `npm init`, install TypeScript and `@types/node` locally, and run them with `npx`
  - Write a strict `tsconfig.json`, compile with `tsc` and run the result with `node`
  - Read a compiler error and explain what Node's type stripping does and does not do
---

## Outline

1. The terminal
2. Installing Node.js 26
3. npm and npx
4. A project with TypeScript in it
5. A strict `tsconfig.json`
6. Compiling and running a first program
7. Reading a compiler error
8. Running a `.ts` file directly

## The terminal

You give the commands in this lesson in a **terminal**: PowerShell or Windows Terminal on Windows,
Terminal on macOS, any shell on Linux. In the examples, a line starting with `$` is a command you
type (without the `$`), and the lines under it are what it prints.

## Installing Node.js 26

Node.js comes in numbered release lines. So far the even-numbered lines have become **LTS** (Long
Term Support) releases, maintained for years; Node.js 26 becomes LTS on 28 October 2026. There are two good ways
to install it.

- **The official installer.** On [nodejs.org/en/download](https://nodejs.org/en/download), choose
  version 26 and the Windows Installer (`.msi`) or macOS Installer (`.pkg`), and accept the defaults.
- **A version manager**, a small tool that installs several Node.js versions side by side and
  switches between them per project. `fnm` works on Windows, macOS and Linux; `nvm` on macOS and
  Linux.

With `fnm` on Windows, install it with `winget`, add the line
`fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression` to the end of your
PowerShell profile as its README says, open a new terminal, and then:

```console
$ fnm install 26
$ fnm use 26
```

With `nvm` on macOS or Linux (check its README for the current version of the script):

```console
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
$ nvm install 26
$ nvm alias default 26
```

Then check, in a new terminal:

```console
$ node --version
v26.12.0
```

Any `v26` version is fine. `npm --version` should print a number as well.

## npm and npx

Installing Node.js also installs **npm**, the Node package manager. A **package** is code that
someone has published for others to use, and npm downloads packages into a folder called
`node_modules` and records them in a file called `package.json`. **npx** runs a command that a
package installed in the current project provides.

## A project with TypeScript in it

A **project** is a folder that holds one program and its `package.json`:

```console
$ mkdir greeter
$ cd greeter
$ npm init -y
$ npm pkg set type=module
$ npm install -D typescript @types/node
$ npx tsc --version
Version 7.0.2
```

- `npm init -y` writes a `package.json` with default values.
- `npm pkg set type=module` changes its `"type"` field from `"commonjs"` to `"module"`, so that
  Node.js treats the project's files as **ES modules**, the module system of modern JavaScript
  (lesson 13 shows what modules do).
- `npm install -D` installs the packages as *development dependencies*: tools needed to build the
  program, not to run it. `typescript` is the compiler; `@types/node` describes Node's built-in
  features, such as `console` and `process`, to the compiler.
- `npx tsc` runs the compiler installed in this project.

The TypeScript site recommends this local install over a global one (`npm install -g`): each
project keeps the compiler version it was written for, and npm's lock file, `package-lock.json`,
makes everyone on a team use exactly the same version.

## A strict `tsconfig.json`

The compiler reads its settings from a file called `tsconfig.json`. `npx tsc --init` writes one:

```console
$ npx tsc --init
Created a new tsconfig.json

You can learn more at https://aka.ms/tsconfig
```

The generated file is a commented list of recommended settings. It sets `"types": []` and notes in
a comment that Node.js projects need `"types": ["node"]`. Replace its contents with the settings
this course uses for every example and lab:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "es2025",
    "lib": ["es2025"],
    "types": ["node"],
    "strict": true,
    "noEmitOnError": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

- `rootDir` and `outDir`: read TypeScript from `src`, write JavaScript to `dist`.
- `module`: follow Node.js's own rules for modules.
- `target` and `lib`: write ES2025 JavaScript, and know the built-in features of ES2025.
- `types`: load `@types/node`. Since TypeScript 6.0 this list is empty by default, and without it
  the compiler does not even know `console`.
- `strict`: the strict checks. They are on by default since TypeScript 6.0; writing the line keeps
  that visible.
- `noEmitOnError`: write no JavaScript while there are errors. Without it, `tsc` reports the errors
  and writes the JavaScript anyway.
- `sourceMap`: write `.js.map` files that connect the JavaScript back to your `.ts` lines.
- `skipLibCheck`: do not re-check the type files of installed packages, which saves time.

The generated file also turns on two extra checks, `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`, which the professional level explains.

## Compiling and running a first program

Create a folder `src` and in it a file `hello.ts`:

```ts
const learner: string = "Ada";
console.log("Hello, " + learner + "!");
console.log("Running on Node.js " + process.version);
```

`const` gives a value a name (lesson 3), `+` joins strings together, and `process.version` is the
version of Node.js running the program. Compile, then run the JavaScript:

```console
$ npx tsc
$ node dist/hello.js
Hello, Ada!
Running on Node.js v26.12.0
```

`npx tsc` with no file names compiles the whole project as `tsconfig.json` describes. It prints
nothing when all is well and leaves `hello.js` and `hello.js.map` in `dist`.

## Reading a compiler error

Change line 2 to call `learner.toUppercase()`, with a lower-case `c`, and compile again:

```text
src/hello.ts(2,33): error TS2551: Property 'toUppercase' does not exist on type 'string'. Did you mean 'toUpperCase'?
```

Read it in four parts: the file, the position as (line,column), the error code `TS2551`, which you
can search for, and the message. When there are several errors, fix the first one first; later
ones are often caused by it. Because of `noEmitOnError`, `dist` was not touched. Editors such as
Visual Studio Code show the same errors underlined while you type.

## Running a `.ts` file directly

Node.js 26 can run a `.ts` file itself. It uses **type stripping**: it replaces the type
annotations with spaces and runs the JavaScript that is left. This is stable and on by default:

```console
$ node src/hello.ts
Hello, Ada!
Running on Node.js v26.12.0
```

Type stripping does **not** check types. With the `toUppercase` mistake still in the file, Node.js
runs it until the bad line fails (the stack trace that follows is cut here):

```text
file:///tmp/greeter/src/hello.ts:2
console.log("Hello, " + learner.toUppercase() + "!");
                                ^

TypeError: learner.toUppercase is not a function
```

Stripping also only works for TypeScript syntax that can be erased. A few TypeScript features
generate JavaScript of their own: `enum`, a `namespace` that contains values, and parameter
properties in classes. Node.js refuses them:

```text
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

Node.js also ignores `tsconfig.json`. A good habit is to let `tsc` check and Node.js run: either
`npx tsc` and `node dist/hello.js`, or `npx tsc --noEmit` (check only, write nothing) and then
`node src/hello.ts`. This course compiles with `tsc`, as the labs do.

## Common mistakes

- **Leaving `"types": []`.** Every use of `console` or `process` fails:

  ```text
  src/hello.ts(2,1): error TS2584: Cannot find name 'console'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.
  ```

  Install `@types/node` and set `"types": ["node"]`; do not add `dom`, which describes browsers.
- **Naming a file on the command line.** `npx tsc src/hello.ts` in a folder with a
  `tsconfig.json` is refused:

  ```text
  error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.
  ```

  Run `npx tsc` alone.
- **Trusting `node file.ts` to catch type errors.** It only strips them. Run `npx tsc --noEmit`.
- **Running old output.** After editing `src/hello.ts`, run `npx tsc` again before
  `node dist/hello.js`, or you run the previous version.

## Practice

1. Write `src/about.ts` that prints `My name is` followed by a name, and `This computer runs`
   followed by `process.platform`. Compile and run it.
2. What does `npx tsc` report for `const year: number = "2026";`?
3. A file with a type error runs without complaint under `node src/about.ts`. Why, and which
   command finds the error without writing any files?

### Answers

1. ```ts
   const myName: string = "Ada";
   console.log("My name is " + myName);
   console.log("This computer runs " + process.platform);
   ```

   ```text
   My name is Ada
   This computer runs linux
   ```

   You see `win32` on Windows and `darwin` on macOS.
2. ```text
   src/year.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.
   ```
3. Node.js strips the types without checking them. `npx tsc --noEmit` checks the whole project
   and writes nothing.

## Key takeaways

- Install Node.js 26 with the official installer or a version manager such as `fnm` or `nvm`.
- Install TypeScript per project with `npm install -D typescript @types/node` and run it with
  `npx tsc`.
- A strict `tsconfig.json` with `"types": ["node"]` and `noEmitOnError` is the course's starting
  point.
- A compiler error gives file, line, column, code and message. Fix the first one first.
- `node file.ts` strips erasable types and runs the file, but checks nothing.

## Further reading

- [Node.js: Download](https://nodejs.org/en/download)
- [TypeScript: How to set up TypeScript](https://www.typescriptlang.org/download/)
- [Node.js 26 documentation: Modules: TypeScript](https://nodejs.org/docs/latest-v26.x/api/typescript.html)
- [TypeScript: TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
