---
title: Security in TypeScript
summary: See why types protect nothing at run time, validate every input at the boundary, and defend against prototype pollution, regular expression denial of service, SQL and command injection, risky dependencies and leaked secrets.
minutes: 35
objectives:
  - Explain why a type assertion on outside data is a security hole, and validate at the boundary instead
  - Recognize and prevent prototype pollution and catastrophic regular expressions
  - Prevent SQL and command injection with parameters and argument arrays
  - Reduce dependency risk with lockfiles, npm ci and npm audit, and keep secrets out of code and logs
---

## Outline

1. Types are not runtime checks
2. Validate at the boundary
3. Prototype pollution
4. Regular expression denial of service
5. Injection
6. Dependencies
7. Secrets

## Types are not runtime checks

Every type in this course is erased before the program runs (lesson 3). A type describes what you *expect*; it checks nothing about what *arrives*. The dangerous line is a type assertion on outside data:

```ts
interface Order {
  item: string;
  totalCents: number;
}

const body = '{ "item": "lamp", "totalCents": "4000" }';
const order = JSON.parse(body) as Order;
const withShipping = order.totalCents + 500;
console.log(withShipping, typeof withShipping);
```

```text
4000500 string
```

The compiler believed `as Order`, so `totalCents + 500` type-checked as a number. At run time `totalCents` was a string, `+` joined text, and a $40 lamp cost $40,005. An attacker controls every byte of a request, an upload or a queued message, and any of them can carry the wrong type, a missing or extra field, or a huge value.

## Validate at the boundary

The rule: data from outside is `unknown` until a runtime check has proved its shape, at the **boundary** where it enters the program. Lesson 6's `checkReading` and the level lab's `validateBooking` are this rule in code; in larger systems a schema library such as Zod does the same and derives the TypeScript type from the schema, so the check and the type cannot drift apart. Good validation is an **allow list**: accept known fields with known types and sizes, and reject everything else, including unknown keys, which stops a client from setting `isAdmin: true` on a record you then save.

## Prototype pollution

Every ordinary object inherits from `Object.prototype`. A property added there appears on *every* object in the process. **Prototype pollution** is an attack that gets attacker-controlled keys such as `__proto__` into code that copies properties, typically a recursive merge of user settings:

```ts
type Settings = Record<string, unknown>;

function merge(target: Settings, source: Settings): Settings {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "object" && value !== null) {
      const existing = target[key];
      target[key] = merge(typeof existing === "object" && existing !== null ? (existing as Settings) : {}, value as Settings);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const defaults: Settings = { theme: "light" };
const fromUser = JSON.parse('{ "theme": "dark", "__proto__": { "isAdmin": true } }') as Settings;
merge(defaults, fromUser);

const visitor: Settings = {};
console.log("visitor.isAdmin:", visitor["isAdmin"]);
```

```text
visitor.isAdmin: true
```

`JSON.parse` creates an ordinary key named `__proto__`. When `merge` reads `target["__proto__"]`, it gets `Object.prototype` itself, and copies `isAdmin: true` onto it. A brand-new, empty object now claims to be an admin. The defenses, from best to simplest:

- Validate with an allow list, so `__proto__` never reaches the merge.
- Keep user-supplied keys in a `Map`, or in objects made with `Object.create(null)`, which have no prototype.
- Skip the keys `__proto__`, `constructor` and `prototype` when copying. With `if (UNSAFE_KEYS.has(key)) continue;` at the top of the loop, the program prints `visitor.isAdmin: undefined`.
- Start Node with `--disable-proto=delete`, which removes the `__proto__` accessor; the unchanged program then also prints `undefined`.

## Regular expression denial of service

JavaScript's regular expression engine **backtracks**: when a match fails, it goes back and tries every other way to split the input. A pattern with a quantifier inside a quantifier, such as `([a-z]+-?)*`, has a number of ways that grows exponentially with the input. One request with a crafted string then occupies the single main thread (lesson 8) for seconds or years: **ReDoS**, regular expression denial of service.

```ts
const slowTag = /^([a-z]+-?)*$/;
const fastTag = /^[a-z]+(-[a-z]+)*$/;

for (const length of [20, 22, 24, 26]) {
  const input = "a".repeat(length) + "!";
  for (const [name, pattern] of [["slow", slowTag], ["fast", fastTag]] as const) {
    const start = performance.now();
    const ok = pattern.test(input);
    console.log(`${name} ${length}: ${ok} in ${(performance.now() - start).toFixed(1)} ms`);
  }
}
```

```text
slow 20: false in 67.4 ms
fast 20: false in 0.1 ms
slow 22: false in 31.4 ms
fast 22: false in 0.0 ms
slow 24: false in 135.2 ms
fast 24: false in 0.0 ms
slow 26: false in 541.2 ms
fast 26: false in 0.0 ms
```

Both patterns accept the same tags (`kiln`, `low-fire`), but every two extra characters multiply the slow one's time by about four; 40 characters would take hours. The fast pattern can split the input only one way. Avoid nested quantifiers and overlapping alternatives, cap input length *before* matching, and use a linting rule or a ReDoS checker on patterns that see user input.

## Injection

**Injection** happens when data is pasted into code that another interpreter runs: SQL for a database, a command line for a shell. Node's built-in `node:sqlite` module (a release candidate in Node.js 26) shows the classic SQL case:

```ts
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE parcels (code TEXT, owner TEXT)");
db.exec("INSERT INTO parcels VALUES ('P-100', 'ana'), ('P-200', 'bo'), ('P-300', 'cy')");

function findUnsafe(owner: string): unknown[] {
  return db.prepare(`SELECT code FROM parcels WHERE owner = '${owner}'`).all();
}

function findSafe(owner: string): unknown[] {
  return db.prepare("SELECT code FROM parcels WHERE owner = ?").all(owner);
}

const attack = "nobody' OR '1'='1";
console.log("unsafe:", findUnsafe(attack).length, "rows");
console.log("safe:  ", findSafe(attack).length, "rows");
```

```text
unsafe: 3 rows
safe:   0 rows
```

The template literal turned the input into SQL, `WHERE owner = 'nobody' OR '1'='1'`, which matches every row. The `?` **placeholder** sends the value separately from the statement, so it is only ever data. Every database driver offers placeholders; use them always, even for values you believe are safe.

Shell commands have the same flaw. `exec` runs a string through a shell, where `;` starts a new command:

```ts
const filename = "report.txt; echo INJECTED: the shell ran this";

const { stdout } = await run(`ls -l ${filename}`);
console.log("exec:", stdout.trim());

try {
  await runFile("ls", ["-l", filename]);
} catch (error) {
  console.log("execFile:", (error as { stderr: string }).stderr.trim());
}
```

```text
exec: INJECTED: the shell ran this
execFile: ls: cannot access 'report.txt; echo INJECTED: the shell ran this': No such file or directory
```

(`run` and `runFile` are `promisify(exec)` and `promisify(execFile)`.) `execFile` starts the program directly with an array of arguments and no shell, so the whole string is one file name. Prefer `execFile` or `spawn` with argument arrays, and never pass `shell: true` with outside data.

## Dependencies

A typical project runs code from hundreds of packages, and installing them can run their install scripts. Reduce the risk:

- Commit the **lockfile** (`package-lock.json`) and install in CI with **`npm ci`**, which installs exactly the locked versions, fails if `package.json` and the lockfile disagree, and never rewrites either.
- Run **`npm audit`** to list dependencies with known vulnerabilities; `npm audit --audit-level=high` exits non-zero only from high severity up, which suits a CI gate. `npm audit fix --force` may install breaking major versions, so read before using it.
- Consider `npm ci --ignore-scripts` (or `ignore-scripts=true` in `.npmrc`) so dependencies' install scripts do not run.
- Add dependencies deliberately: check the exact name (typosquatting is common), the maintainers and the activity. `npm audit signatures` verifies registry signatures and provenance.

## Secrets

Keys, passwords and tokens never go in source code or in git history, which keeps them forever. Load them from environment variables or a secret manager (lesson 6), keep `.env` in `.gitignore`, and never log the configuration object or a request's `authorization` header. Compare tokens with `crypto.timingSafeEqual` on equal-length buffers (for example two SHA-256 digests), because `===` returns sooner the earlier the strings differ, which leaks information through timing. If a secret leaks, rotate it: deleting the commit does not unpublish it.

## Common mistakes

- **`as` on outside data.** It silences the compiler and checks nothing. Validate `unknown`.
- **Deep-merging user JSON** without a key allow list: prototype pollution.
- **Template literals in SQL or shell commands.** Use placeholders and argument arrays.
- **`npm install` in CI**, which can pick up versions nobody tested. Use `npm ci`.

## Practice

1. A handler does `const { limit } = request.query as { limit: number }`. What can go wrong, and what should it do?
2. Why does `node:sqlite` return rows printed as `[Object: null prototype]`, and why is that safer?
3. Rewrite `/^(\d+,?)+$/`, meant to match comma-separated numbers such as `1,22,333`, so it cannot backtrack catastrophically.

### Answers

1. `limit` arrives as a string (or an array, or nothing), so arithmetic or comparisons misbehave and a huge value may load everything. Parse it with `Number`, check `Number.isInteger` and a range such as 1 to 100, and answer 400 otherwise.
2. The rows are created with no prototype, so a column named `__proto__` or `constructor` is an ordinary key and cannot reach `Object.prototype`.
3. `/^\d+(,\d+)*$/`: every comma must be followed by digits, so each input splits only one way.

## Key takeaways

- Types are erased; outside data is `unknown` until a runtime check at the boundary proves its shape.
- Prototype pollution comes from copying keys like `__proto__`; allow lists, `Map` and null-prototype objects stop it.
- Nested quantifiers make regular expressions exponential; cap input and write unambiguous patterns.
- Placeholders stop SQL injection; `execFile` with an argument array stops shell injection.
- Lockfiles, `npm ci`, `npm audit` and care with secrets close the remaining doors.

## Further reading

- [Node.js 26: SQLite](https://nodejs.org/docs/latest-v26.x/api/sqlite.html)
- [Node.js 26: Child process, execFile](https://nodejs.org/docs/latest-v26.x/api/child_process.html#child_processexecfilefile-args-options-callback)
- [MDN: Object prototypes](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Advanced_JavaScript_objects/Object_prototypes)
- [npm docs: npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit)
