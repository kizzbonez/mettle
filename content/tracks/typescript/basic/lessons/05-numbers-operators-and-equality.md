---
title: Numbers, Operators and Equality
summary: Work with JavaScript's one number type and its limits, the arithmetic, comparison and logical operators and their precedence, Math and bigint, strict equality, truthy and falsy values, and turning text into numbers safely.
minutes: 30
objectives:
  - Explain what `number` can and cannot represent exactly, including `NaN`, `Infinity` and safe integers
  - Use arithmetic, comparison and logical operators and predict results from precedence
  - Use `===` instead of `==`, test for `NaN` with `Number.isNaN`, and list the falsy values
  - Convert text to a number with `Number` or `parseInt` and check the result before using it
---

## Outline

1. One type for all numbers
2. Arithmetic operators and precedence
3. `Math` and rounding
4. `bigint` for very large integers
5. Comparison, logic and equality
6. Truthy and falsy
7. Parsing numbers safely

## One type for all numbers

JavaScript has a single type, `number`, for whole numbers and fractions alike. Every number is
stored as a 64-bit **floating-point** value in the IEEE 754 format: a binary fraction with about
15 to 17 significant decimal digits. Most of the time you never notice. Sometimes you do:

```ts
const total = 0.1 + 0.2;
console.log(total, total === 0.3);
console.log(7 / 2, 7 % 2, -7 % 2, 2 ** 10);
console.log(Number.isInteger(7 / 2), Number.isInteger(8 / 2));
console.log(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 2);
console.log(1 / 0, 0 / 0);
```

```text
0.30000000000000004 false
3.5 1 -1 1024
false true
9007199254740991 9007199254740992
Infinity NaN
```

- `0.1` and `0.2` have no exact binary form, so their sum is a hair off. Never compare money or
  measurements with `===`; round them, or count in whole units such as cents.
- `/` always divides exactly: `7 / 2` is `3.5`, not 3. `%` is the **remainder** (it keeps the sign
  of the left side) and `**` raises to a power.
- `Number.isInteger` tells whether a number is whole.
- Integers are exact only up to `Number.MAX_SAFE_INTEGER`, 2^53 - 1. Beyond it, numbers skip:
  adding 2 gave a result 1 too small.
- Dividing by zero gives `Infinity`, and a result that is not a number at all, such as `0 / 0` or
  `Number("abc")`, is `NaN`. Both are values of type `number`, so the compiler cannot warn you
  about them.

## Arithmetic operators and precedence

An **operator** is a symbol that combines values: `+`, `-`, `*`, `/`, `%`, `**`. Shortcuts change
a variable in place: `score += 5` means `score = score + 5`, and `score++` adds 1.

```ts
let score = 10;
score += 5;
score *= 2;
score++;
console.log(score);
console.log(2 + 3 * 4, (2 + 3) * 4, 2 ** 3 ** 2, 10 - 4 - 3);
console.log(score > 30 && score < 40, score === 31 || score === 0, !(score > 30));
```

```text
31
14 20 512 3
true true false
```

**Precedence** decides which operator goes first, as in school arithmetic: `**` before `*`, `/`
and `%`, which go before `+` and `-`. Operators of equal rank run left to right (`10 - 4 - 3` is
3), except `**`, which runs right to left: `2 ** 3 ** 2` is `2 ** 9`. Parentheses override
everything, so add them whenever a reader might hesitate.

## `Math` and rounding

`Math` holds mathematical functions and constants such as `Math.PI`:

```ts
const average = 17 / 3;
console.log(average);
console.log(Math.round(average), Math.floor(average), Math.ceil(average), Math.trunc(-5.7));
console.log(Math.round(2.5), Math.round(-2.5), Math.max(3, 9, 4), Math.abs(-8), Math.sqrt(81));
console.log(average.toFixed(2), Math.round(average * 100) / 100);
```

```text
5.666666666666667
6 5 6 -5
3 -2 9 8 9
5.67 5.67
```

`floor` rounds down, `ceil` up, `trunc` drops the fraction, and `round` goes to the nearest whole
number, with halves going up (so `-2.5` becomes `-2`). `toFixed(2)` returns a **string** with two
decimals, for display; `Math.round(x * 100) / 100` returns a number rounded to two decimals.

## `bigint` for very large integers

A `bigint` is a whole number of any size, written with an `n` at the end:

```ts
const big = 2n ** 64n;
console.log(big, typeof big, 7n / 2n);
console.log(big + 1n, Number(10n) + 1);
```

```text
18446744073709551616n bigint 3n
18446744073709551617n 11
```

Division drops the fraction (`7n / 2n` is `3n`). You cannot mix `bigint` and `number` in one
calculation; the compiler rejects `big + 1`:

```text
main.ts(2,13): error TS2365: Operator '+' cannot be applied to types 'bigint' and '1'.
```

Write `big + 1n`, or convert with `Number(...)` or `BigInt(...)`. Use `bigint` for identifiers or
counts beyond 2^53; everyday arithmetic uses `number`.

## Comparison, logic and equality

Comparison operators produce a `boolean`: `<`, `<=`, `>`, `>=`, `===` (equal) and `!==` (not
equal). The **logical operators** combine booleans: `a && b` is true when both are, `a || b` when
at least one is, and `!a` reverses `a`.

JavaScript has two equality operators. `===`, **strict equality**, is true only for two values of
the same type with the same value. `==`, **loose equality**, first converts values to a common type
by complicated rules, so that `"" == 0` and `"1" == 1` are both true. MDN calls `===` "almost always
the correct comparison operation to use". TypeScript already refuses most comparisons between
different types:

```ts
const typed: string = "1";
console.log(typed == 1);
```

```text
main.ts(2,13): error TS2367: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap.
```

With values of type `unknown`, nothing stops `==`, and the difference shows:

```ts
const input: unknown = "1";
console.log(input == 1, input === 1, null == undefined, null === undefined);
const nothing = 0 / 0;
console.log(nothing === nothing, Number.isNaN(nothing));
```

```text
true false true false
false true
```

`NaN` is the one value not equal to itself, so `x === NaN` is always false; the compiler reports
it as `error TS2845: This condition will always return 'false'.` Test with `Number.isNaN(x)`.

## Truthy and falsy

Wherever JavaScript expects a boolean, such as in an `if` (lesson 6) or with `&&` and `||`, any
value is accepted and treated as true or false. The **falsy** values are `false`, `0`, `-0`, `0n`,
`""`, `null`, `undefined` and `NaN`. Every other value is **truthy**, including `"0"`, `" "` and
`"false"`. `Boolean(x)` shows which:

```ts
console.log(Boolean(0), Boolean(""), Boolean(NaN), Boolean(null), Boolean(undefined), Boolean(0n));
console.log(Boolean("0"), Boolean(" "), Boolean(-1), Boolean("false"));
const nickname: string = "";
const fullName: string = "Ada";
const stock: number = 0;
console.log(nickname || "guest", fullName || "guest", stock || 10);
```

```text
false false false false false false
true true true true
guest Ada 10
```

`a || b` gives `a` if it is truthy and `b` otherwise, which is handy for defaults. But it treats
`0` and `""` as missing: a stock of 0 became 10. Lesson 10's `??` fixes that.

## Parsing numbers safely

Input arrives as text, and `"12" + 3` joins strings. Convert text to a number first:

```ts
console.log(Number("42"), Number(" 42 "), Number(""), Number("12px"), Number("4.5"));
console.log(parseInt("12px", 10), parseInt("4.9", 10), parseFloat("4.5kg"), parseInt("abc", 10));
const text = " 15 ";
const count = Number(text);
const valid = text.trim() !== "" && Number.isInteger(count) && count >= 0;
console.log(count, valid);
```

```text
42 42 0 NaN 4.5
12 4 4.5 NaN
15 true
```

- `Number(text)` converts the whole string, ignoring spaces at the ends, or gives `NaN`. Beware:
  an empty string becomes `0`.
- `parseInt(text, 10)` reads digits from the start and stops at the first non-digit, so `"12px"`
  gives 12 and `"4.9"` gives 4. Always pass 10, the number base. `parseFloat` also reads a
  fraction. Both accept text with junk at the end, which is rarely what you want.
- After converting, **check**: not empty, not `NaN`, a whole number if you need one, in range. The
  `valid` line does all of that; lesson 6 uses such a check in an `if`.

## Common mistakes

- **Mixing up a minus sign and `**`.** `-2 ** 2` is ambiguous, and the compiler refuses it:

  ```text
  main.ts(1,13): error TS17006: An unary expression with the '-' operator is not allowed in the left-hand side of an exponentiation expression. Consider enclosing the expression in parentheses.
  ```

  Write `(-2) ** 2` (4) or `-(2 ** 2)` (-4).
- **Passing text to `Math`.** `Math.round("2.5")` is
  `error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`
  Convert with `Number` first.
- **Trusting `Number("")`.** It is `0`, not `NaN`. Check for empty text before converting.
- **Comparing fractions with `===`.** `0.1 + 0.2 === 0.3` is false. Compare rounded values.

## Practice

1. Convert 21.5 degrees Celsius to Fahrenheit (`c * 9 / 5 + 32`), and print it unrounded and
   rounded.
2. Print 135 minutes as `2 h 15 min` using `/`, `Math.floor` and `%`.
3. Predict `Number("3.0")`, `Number.isInteger(Number("3.0"))`, `parseInt("08", 10)` and
   `Number("0x1A")`.

### Answers

1. ```ts
   const celsius = 21.5;
   const fahrenheit = celsius * 9 / 5 + 32;
   console.log(fahrenheit, Math.round(fahrenheit));
   ```

   ```text
   70.7 71
   ```
2. `` console.log(`${Math.floor(minutes / 60)} h ${minutes % 60} min`); `` with
   `const minutes = 135;` prints `2 h 15 min`.
3. `3`, `true` (3.0 is a whole number), `8`, and `26`: `Number` understands the `0x` prefix of
   hexadecimal numbers.

## Key takeaways

- `number` is a 64-bit float: fractions can be slightly off, and integers are exact up to 2^53 - 1.
- `NaN` and `Infinity` are numbers; test for `NaN` with `Number.isNaN`, never `=== NaN`.
- Use `===` and `!==`. TypeScript rejects most comparisons between different types.
- The falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN`.
- Convert text with `Number` or `parseInt(text, 10)`, then check the result before you use it.

## Further reading

- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [MDN: Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)
- [MDN: Falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
- [MDN: Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence)
