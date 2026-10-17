---
title: Conditions and Loops
summary: Make a program choose with if, else, switch and the conditional operator, and repeat work with for, for...of, while and do...while, steering loops with break and continue, while the compiler checks scopes and comparisons.
minutes: 30
objectives:
  - Choose between paths with `if`/`else if`/`else`, `switch` and the conditional operator
  - Explain block scope and fix "Cannot find name" errors caused by it
  - Repeat work with `for`, `for...of`, `while` and `do...while`, over ranges of numbers and the characters of a string
  - Use `break` and `continue`, and avoid fall-through, off-by-one and infinite loops
---

## Outline

1. Making a choice with `if`
2. Blocks and scope
3. `switch`
4. The conditional operator
5. Counting with `for`
6. `for...of` over a string
7. `while` and `do...while`
8. `break` and `continue`

## Making a choice with `if`

So far every program ran each line once, top to bottom. **Control flow** statements change that:
they choose which lines run, and how often. The first is `if`:

```ts
const temperature = Number("31");
if (temperature >= 30) {
  console.log("Hot: water the seedlings twice");
} else if (temperature >= 15) {
  console.log("Mild: water once");
} else {
  console.log("Cold: skip watering");
}
```

```text
Hot: water the seedlings twice
```

The **condition** in parentheses is worked out; if it is true, the block after it runs. Otherwise
each `else if` is tried in order, and the `else` block runs when none matched. Only one block
ever runs, so the order matters: test `>= 30` before `>= 15`, or 31 would count as mild. The
condition may be any value; it is treated as true or false by the truthy and falsy rules of lesson
5.

## Blocks and scope

A **block** is code between `{` and `}`. A name declared with `const` or `let` inside a block
exists only until the block ends; that region is the name's **scope**:

```ts
const temperature = Number("31");
if (temperature >= 30) {
  const advice = "water twice";
}
console.log(advice);
```

```text
main.ts(5,13): error TS2304: Cannot find name 'advice'.
```

To use a value after the block, declare it before: `let advice = "water once";`, then assign
inside the `if`. Small scopes are a feature: a name used in one place cannot be changed by
mistake anywhere else.

## `switch`

`switch` compares one value against several cases, using `===`:

```ts
const day = "SAT".toLowerCase();
switch (day) {
  case "sat":
  case "sun":
    console.log("Weekend: the market opens at 8");
    break;
  case "mon":
    console.log("Closed");
    break;
  default:
    console.log("Weekday: the market opens at 7");
}
```

```text
Weekend: the market opens at 8
```

Execution jumps to the first matching `case` and runs **until a `break`**, so the empty
`case "sat":` shares the code below it. `default` runs when nothing matched. Forgetting a `break`
lets execution *fall through* into the next case, which is a classic bug (see Common mistakes).
The compiler checks that each case can match: in a `switch` on a number, `case "4":` is
`error TS2678: Type 'string' is not comparable to type 'number'.`

## The conditional operator

`condition ? a : b` is an expression: it gives `a` when the condition is true and `b` otherwise.
It is the right tool for choosing between two *values*, as in the next example, while `if` is for
choosing between two *actions*.

## Counting with `for`

A **loop** repeats a block. The `for` loop has three parts in its parentheses: a start
(`let day = 1`), a condition checked before every round (`day <= 3`), and a step run after every
round (`day++`):

```ts
for (let day = 1; day <= 3; day++) {
  const millilitres = day * 250;
  console.log(`Day ${day}: ${millilitres} ml, ${day === 1 ? "first watering" : "top-up"}`);
}
```

```text
Day 1: 250 ml, first watering
Day 2: 500 ml, top-up
Day 3: 750 ml, top-up
```

Each round of a loop is an **iteration**. `day` lives only inside the loop, and `millilitres` is
a fresh `const` in every iteration, so `const` is right for it even though its value differs each
time.

## `for...of` over a string

`for...of` visits each item of a sequence in turn. A string is a sequence of characters:

```ts
const code = "B7-x9";
let digits = 0;
for (const char of code) {
  if (char >= "0" && char <= "9") {
    digits++;
  }
}
console.log(`${code} has ${digits} digits`);
```

```text
B7-x9 has 2 digits
```

`for...of` walks a string by Unicode code points, so the tree emoji of lesson 4, two code units
long, is visited once. There is also a `for...in` loop, which visits property *names*; do not use it for strings
or arrays.

## `while` and `do...while`

`while` repeats as long as its condition is true. Use it when you do not know in advance how many
rounds you need:

```ts
let level = 100;
let days = 0;
while (level > 20) {
  level -= 15;
  days++;
}
console.log(days, level);
```

```text
6 10
```

The water tank starts at 100 and loses 15 a day; after 6 days it is at 10, and the condition is
false for the first time. Something in the body must eventually make the condition false, or the
loop never ends: an **infinite loop**. `do { ... } while (condition);` checks the condition after
the body, so the body always runs at least once.

## `break` and `continue`

`continue` skips the rest of the current iteration and goes on with the next one. `break` leaves
the loop altogether:

```ts
const readings = "12,7,,40,abc,3";
let total = 0;
for (const piece of readings.split(",")) {
  if (piece === "") {
    continue;
  }
  const value = Number(piece);
  if (Number.isNaN(value)) {
    console.log(`Stopping at the bad reading "${piece}"`);
    break;
  }
  total += value;
}
console.log(total);
```

```text
Stopping at the bad reading "abc"
59
```

`split` gives the pieces of the text (lesson 8 covers the array it returns). The empty piece
between the two commas is skipped, 12 + 7 + 40 is added, and the loop stops at `"abc"`, so the 3
after it is never read. Checking each piece before using it, as here, is how the programs in this
course treat input.

## Common mistakes

- **A `const` loop counter.** The step `i++` assigns to it:

  ```ts
  for (const i = 0; i < 3; i++) {
    console.log(i);
  }
  ```

  ```text
  main.ts(1,26): error TS2588: Cannot assign to 'i' because it is a constant.
  ```

  Use `let` in a counting `for`; `const` is right in `for...of`.
- **A forgotten `break`.** With `size` equal to `"M"`, this prints `medium` and then `large`:

  ```ts
  switch (size) {
    case "S":
      console.log("small");
    case "M":
      console.log("medium");
    case "L":
      console.log("large");
  }
  ```

  End every case with `break` unless it is deliberately empty.
- **Off by one.** `for (let i = 0; i <= word.length; i++)` reads one position past the end.
  The compiler cannot see it; the program prints `A`, `B`, `C` and then fails with
  `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`. Use `<`, or
  `for...of`.
- **`=` instead of `===`.** `if (count = 5)` assigns 5 and is always true, and it compiles. Read
  conditions twice.

## Practice

1. Print the numbers 1 to 15, but `Fizz` for multiples of 3, `Buzz` for multiples of 5 and
   `FizzBuzz` for multiples of both.
2. Count the vowels in `"Ripe tomatoes and basil"` with `for...of`.
3. Add up the digits of 4096 using `while`, `%` and `Math.floor`.

### Answers

1. Test 15 first, or a multiple of 15 would stop at `Fizz`:

   ```ts
   for (let n = 1; n <= 15; n++) {
     if (n % 15 === 0) {
       console.log("FizzBuzz");
     } else if (n % 3 === 0) {
       console.log("Fizz");
     } else if (n % 5 === 0) {
       console.log("Buzz");
     } else {
       console.log(n);
     }
   }
   ```

   The output starts `1`, `2`, `Fizz`, `4`, `Buzz` and ends `13`, `14`, `FizzBuzz`.
2. Lower-case the sentence, then for each `char` test `"aeiou".includes(char)` and add 1. The
   count is 9.
3. ```ts
   let number = 4096;
   let digitSum = 0;
   while (number > 0) {
     digitSum += number % 10;
     number = Math.floor(number / 10);
   }
   console.log(digitSum);
   ```

   It prints 19: `% 10` takes the last digit, and dividing by 10 drops it.

## Key takeaways

- `if`/`else if`/`else` runs the first matching block; `switch` jumps to a matching `case` and runs
  until `break`.
- `const` and `let` live only inside their block.
- `cond ? a : b` chooses between two values.
- `for` counts, `for...of` visits each character or item, `while` repeats until a condition
  fails.
- `continue` skips to the next iteration, `break` leaves the loop. Watch for `<=` past the end.

## Further reading

- [MDN: Control flow and error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [MDN: Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration)
- [MDN: switch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch)
