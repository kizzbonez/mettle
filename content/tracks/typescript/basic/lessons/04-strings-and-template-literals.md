---
title: Strings and Template Literals
summary: Write string literals with escapes, build text with template literals, use the everyday string methods, understand why strings never change and what length really counts, and compare and convert strings correctly.
minutes: 25
objectives:
  - Write string literals with escape sequences and build strings with template literals
  - Use `trim`, `split`, `slice`, `includes`, `replaceAll`, `padStart` and `at` and predict their results
  - Explain why strings are immutable and why `length` can differ from the number of characters you see
  - Compare strings exactly and alphabetically, and convert other values to strings
---

## Outline

1. String literals and escapes
2. Template literals
3. Everyday string methods
4. Strings never change
5. Unicode and `length`
6. Comparing and converting

## String literals and escapes

A **string** is a sequence of characters: text. Written directly in code it is a **string
literal**, between double quotes `"..."` or single quotes `'...'`, which mean the same; this course
uses double quotes. Some characters cannot be typed between quotes as they are, so you write an
**escape sequence**, a backslash followed by a code:

```ts
const quoted = "She said \"go\" and left.";
const twoLines = "Line one\nLine two";
const folder = "C:\\maps\\trails";
console.log(quoted);
console.log(twoLines);
console.log(folder);
console.log("Name:\tRidge Loop");
```

```text
She said "go" and left.
Line one
Line two
C:\maps\trails
Name:	Ridge Loop
```

`\"` is a double quote inside a double-quoted string, `\n` a new line, `\t` a tab and `\\` one
backslash. `\u{...}` writes any character by its Unicode number, as you will see below.

## Template literals

A **template literal** is written between backticks. Inside it, `${...}` holds an **expression**,
any piece of code that produces a value; the expression is worked out, turned into text and put
in its place. A template literal can also run over several lines:

```ts
const trail = "Ridge Loop";
const km = 12.5;
const hours = 4;
console.log(`${trail}: ${km} km in ${hours} hours, ${km / hours} km per hour`);
const card = `Trail: ${trail}
Length: ${km} km`;
console.log(card);
```

```text
Ridge Loop: 12.5 km in 4 hours, 3.125 km per hour
Trail: Ridge Loop
Length: 12.5 km
```

Joining strings with `+`, as in lesson 2, also works, but template literals are easier to read as
soon as more than one value goes in. The type of a template literal is `string`.

## Everyday string methods

A **method** is a function that belongs to a value, called with a dot: `text.trim()`. Strings have
dozens; these are the ones you will use most:

```ts
const raw = "  Ridge Loop,Pine Walk,Lake Path  ";
const cleaned = raw.trim();
console.log(`[${cleaned}]`);
console.log(cleaned.split(","));
console.log(cleaned.slice(0, 5), "|", cleaned.slice(-9));
console.log(cleaned.includes("Pine"), cleaned.startsWith("Lake"), cleaned.indexOf("Pine"), cleaned.indexOf("Oak"));
console.log(cleaned.toUpperCase());
console.log(cleaned.replaceAll(" ", "_"));
console.log("7".padStart(3, "0"), cleaned.at(0), cleaned.at(-1));
```

```text
[Ridge Loop,Pine Walk,Lake Path]
[ 'Ridge Loop', 'Pine Walk', 'Lake Path' ]
Ridge | Lake Path
true false 11 -1
RIDGE LOOP,PINE WALK,LAKE PATH
Ridge_Loop,Pine_Walk,Lake_Path
007 R h
```

- `trim()` removes spaces, tabs and line breaks at both ends (`trimStart` and `trimEnd` do one
  end).
- `split(",")` cuts the string at every comma and returns the pieces as an **array**, a list of
  values, which lesson 8 covers. Node prints arrays in square brackets.
- `slice(start, end)` returns the characters from position `start` up to, but not including,
  `end`. Positions are counted from 0, so `slice(0, 5)` is the first five characters. A negative
  number counts from the end: `slice(-9)` is the last nine.
- `includes` and `startsWith` answer `true` or `false`. `indexOf` gives the position where the text
  starts, or `-1` when it is not there.
- `toUpperCase` and `toLowerCase` change the case.
- `replaceAll(a, b)` replaces every `a` with `b`.
- `padStart(3, "0")` adds `"0"` at the start until the string is 3 characters long: useful for
  numbers such as `007`.
- `at(0)` is the first character and `at(-1)` the last. `cleaned[0]` also reads the first
  character, but square brackets do not accept negative positions.

## Strings never change

No method changes the string it is called on. Each one returns a **new** string, and the original
stays as it was:

```ts
const trail = "ridge";
const shouted = trail.toUpperCase();
console.log(trail, shouted);
```

```text
ridge RIDGE
```

Strings are **immutable**: they cannot be modified at all. Trying to change one character is a
compiler error:

```ts
const trail = "ridge";
trail[0] = "R";
```

```text
main.ts(2,1): error TS2542: Index signature in type 'String' only permits reading.
```

To get `"Ridge"`, build a new string from pieces of the old one:
`trail.slice(0, 1).toUpperCase() + trail.slice(1)`.

## Unicode and `length`

`length` is the number of **UTF-16 code units** in a string, the 16-bit pieces JavaScript stores
text in. For most text that is the number of characters, but not always:

```ts
const composed: string = "café";
const decomposed: string = "cafe\u0301";
console.log(composed, decomposed, composed.length, decomposed.length);
console.log(composed === decomposed, composed === decomposed.normalize());
const tree = "🌲";
console.log(tree.length);
```

```text
café café 4 5
false true
2
```

The two words look the same, but the second is spelled with a plain `e` followed by
`\u0301`, a combining accent, so it is five code units long and not equal to the first.
`normalize()` rewrites such sequences into one standard form, after which they compare equal.
The tree emoji lies outside the range one code unit can hold, so it takes two. Keep this in mind
before using `length` to limit what a user may type. (The `: string` annotations stop the compiler
from noticing that two different fixed texts can never be equal; lesson 11 explains that check.)

## Comparing and converting

`===` compares two strings exactly, letter for letter and case included. `<` and `>` compare
code unit by code unit, which puts every capital letter before every lower-case letter.
`localeCompare` compares the way a dictionary does, returning a negative number, 0 or a positive
number:

```ts
const lower: string = "apple";
const capital: string = "Apple";
console.log(lower === capital, lower === capital.toLowerCase());
console.log(lower < "banana", "Zebra" < lower);
console.log("Zebra".localeCompare(lower), lower.localeCompare("Zebra"));
console.log(String(42) + "!", (3.14159).toFixed(2), `${true}`);
console.log("4" + 2, Number("4") + 2);
```

```text
false true
true true
1 -1
42! 3.14 true
42 6
```

To compare without regard to case, convert both sides first. To turn a value into a string, use
`String(value)`, a template literal, or for numbers `toFixed(digits)`, which rounds to a number of
decimals. The last line shows a trap: `+` with a string on either side joins text, so `"4" + 2`
is `"42"`. `Number("4")` converts text to a number first; lesson 5 shows how to do that safely.

## Common mistakes

- **Adding to text that holds a number.** The result is text, and the compiler says so:

  ```ts
  const stock = "12";
  const total: number = stock + 3;
  ```

  ```text
  main.ts(2,7): error TS2322: Type 'string' is not assignable to type 'number'.
  ```

  Convert first: `Number(stock) + 3`.
- **`${}` in ordinary quotes.** `console.log("Walking ${trail} today");` prints
  `Walking ${trail} today` with no error. Only backticks substitute.
- **Calling a string method on an array.** `line.split(",").trim()` is
  `error TS2339: Property 'trim' does not exist on type 'string[]'.` `split` returns an array;
  trim each piece instead (lesson 8 shows how).
- **Expecting a method to change the string.** `trail.toUpperCase();` on its own line does
  nothing useful. Keep the result: `const shouted = trail.toUpperCase();`.

## Practice

1. From `"  ada lovelace  "`, print the trimmed name in capitals followed by its length in
   parentheses.
2. Print the order number 42 as `ORD-00042`.
3. Predict `"abc".at(-1)`, `"abc".slice(1)` and `"a,b,,c".split(",")`.

### Answers

1. ```ts
   const fullName = "  ada lovelace  ";
   const tidy = fullName.trim();
   console.log(`${tidy.toUpperCase()} (${tidy.length})`);
   ```

   ```text
   ADA LOVELACE (12)
   ```
2. `` console.log(`ORD-${String(42).padStart(5, "0")}`); `` prints `ORD-00042`. `padStart` is a
   string method, so the number is converted first.
3. `"c"`, `"bc"` and `[ 'a', 'b', '', 'c' ]`: two commas in a row leave an empty string between
   them.

## Key takeaways

- String literals use quotes and escapes such as `\n`, `\"` and `\\`; template literals use
  backticks, `${}` and may span lines.
- `trim`, `split`, `slice`, `includes`, `replaceAll`, `padStart` and `at` cover most daily work.
- Strings are immutable: every method returns a new string.
- `length` counts UTF-16 code units, so accents and emoji can make it larger than you expect.
- `===` compares exactly, `localeCompare` alphabetically, and `+` with a string joins text.

## Further reading

- [MDN: String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN: Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [TypeScript handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
