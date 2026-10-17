Finish `solution.ts`. Some tests check your **types**: lines the compiler must reject are marked
`// @ts-expect-error`, so a type that widens to plain `string` fails a test, and so does an enum
that refuses the plain string `"FULL"`.

1. **`Pass`**: replace the enum with an `as const` object of the same name, with the same three
   names and codes. Derive two types from it with `typeof` and `keyof typeof`: `Pass`, the union of
   its codes (`"AM" | "FULL" | "WEEK"`), and `PassName`, the union of its names
   (`"Morning" | "Day" | "Week"`).
2. **`RUNS` and `Run`**: make `RUNS` an `as const` array and derive `Run`, the union of its values,
   with `(typeof RUNS)[number]`.
3. **`isRun(value: string): value is Run`** is `true` exactly for the five grades, written as they
   are in `RUNS`.
4. **`lessonsRequired(run: Run): number`**, the ski school's lessons needed before skiing a run
   without an instructor: `green` and `blue` are 0, `red` is 3, `black` is 6 and `off-piste` is
   10. Use a `switch` with one case per grade and no `default`.
5. **`passPrice(pass: Pass): number`** in cents: Morning 3800, Day 5600, Week 26500. Use `switch`
   with `case Pass.Morning:` and so on.
6. **`passLabel(name: PassName): string`** returns the name and its code, such as `Day (FULL)`,
   reading the code from the object with `Pass[name]`.

Example:

```ts
passPrice(Pass.Day)           // 5600
passPrice("WEEK")             // 26500: a plain code is accepted, unlike with the enum
passLabel("Morning")          // "Morning (AM)"
isRun("red")                  // true
isRun("double-black")         // false
lessonsRequired("black")      // 6
Object.keys(Pass)             // ["Morning", "Day", "Week"]
passPrice("SEASON")           // compile error: "SEASON" is not a Pass
```
