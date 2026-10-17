The source arrives as one string; its lines are split at `"\n"` and numbered from 1. Real lint
rules work on the syntax tree and the types; these work line by line, by the exact rules below,
and the tests compare your reports with them. Keep the types and `RULES` as they are.

1. **`lint(source: string, config: LintConfig): Report[]`** runs every rule whose severity is
   not `"off"` and reports `{ line, rule, severity }`, with the severity from `config`. A line
   gets at most one report per rule. Order the reports by line, and on one line in the order of
   `RULES`.
   - **`no-floating-promises`**. The async functions are those the source declares as
     `async function name(` anywhere in the file (any spaces between the words; the name is made
     of letters, digits, `_` and `$`), even below the call. A line reports when its trimmed text
     **starts with** a call `name(` of one of them and does not contain `.catch(`. So
     `save(id);` and `save(id).then(done);` float, while `await save(id);`,
     `void save(id);`, `return save(id);` and `save(id).catch(log);` do not.
   - **`ban-ts-ignore`**. A line that contains `@ts-ignore`.
   - **`require-disable-reason`**. A line that contains `eslint-disable` (which also covers
     `eslint-disable-line` and `eslint-disable-next-line`) without a reason: the reason is the
     text after ` -- ` (two dashes with a space on each side) following `eslint-disable`, with a
     closing `*/` removed and spaces trimmed, and it must not be empty.
2. **`exitCode(reports: readonly Report[], maxWarnings: number): 0 | 1`** is `1` when any report
   is an error or when there are more warnings than `maxWarnings`, and `0` otherwise. A negative
   `maxWarnings` means no limit, like ESLint's default of `-1`.

Example:

```ts
const source = [
  "export async function saveHomework(id: string): Promise<void> {}",
  "function onSubmit(id: string): void {",
  "  saveHomework(id);",
  "  saveHomework(id).catch(console.error);",
  "  // @ts-ignore",
  "  // eslint-disable-next-line no-console",
  "  console.log(id); // eslint-disable-line no-console -- the planner's audit log",
  "}",
].join("\n");
const config = { "no-floating-promises": "error", "ban-ts-ignore": "error", "require-disable-reason": "warn" } as const;

lint(source, config)
// [{ line: 3, rule: "no-floating-promises", severity: "error" },
//  { line: 5, rule: "ban-ts-ignore", severity: "error" },
//  { line: 6, rule: "require-disable-reason", severity: "warn" }]
exitCode(lint(source, config), -1)                                      // 1: errors always fail
const warning = { line: 6, rule: "require-disable-reason", severity: "warn" } as const;
exitCode([warning], 0)                                                  // 1: --max-warnings 0
exitCode([warning], 1)                                                  // 0
```

**Tip:** collect the async function names first, then walk the lines. A small object that maps
each rule name to a function `(line: string) => boolean` keeps `lint` short.
