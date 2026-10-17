---
title: Null, Undefined and Strict Null Checks
summary: Learn where null and undefined come from, how strictNullChecks makes the compiler track them, and how to handle them safely by checking, with optional chaining and with nullish coalescing, and why the non-null assertion is a last resort.
minutes: 30
objectives:
  - Explain the difference between `null` and `undefined` and where each comes from
  - Read the errors `strictNullChecks` reports and fix them by checking first
  - Use optional chaining `?.` and nullish coalescing `??` and `??=` correctly
  - Explain why the non-null assertion `!` is dangerous and what to write instead
---

## Outline

1. Two kinds of "nothing"
2. What `strictNullChecks` does
3. Narrowing by checking
4. Optional chaining `?.`
5. Nullish coalescing `??` and `??=`
6. The non-null assertion `!`

## Two kinds of "nothing"

JavaScript has two values that mean "no value here":

- `undefined` is what the language gives you when nothing was provided: a variable declared
  without a value, a property that is not there, an array element past the end, a function that
  returns nothing, a `find` that found nothing.
- `null` is a value that programmers write on purpose to say "deliberately empty".

The examples in this lesson use members of a walking club:

```ts
interface Member {
  name: string;
  phone?: string;
  emergencyContact: string | null;
}

const members: Member[] = [
  { name: "Ines", phone: "555-0142", emergencyContact: "Rui" },
  { name: "Tom", emergencyContact: null },
];

let lastSeen: string | undefined;
console.log(members[1].phone, members[1].emergencyContact, lastSeen);
console.log(members.find((member) => member.name === "Zoe"));
```

```text
undefined null undefined
undefined
```

`string | null` is a **union type**, "a string or null"; lesson 11 is about unions. The model says
two different things: Tom's `phone` was never given, while his `emergencyContact` was asked for and
is known to be "none". In your own types, pick one meaning per property and stick to it.

## What `strictNullChecks` does

Reading a property of `undefined` or `null` crashes a program, and it is one of the most common
bugs in JavaScript. With `strictNullChecks`, part of `strict`, `null` and `undefined` are separate
types that are **not** included in `string`, `number` or any other type. Wherever a value might be
missing, its type says so, and the compiler makes you deal with it:

```ts
const tom = members[1];
console.log(tom.phone.length);
console.log(tom.emergencyContact.toUpperCase());
const contact: string = tom.emergencyContact;
```

```text
main.ts(13,13): error TS18048: 'tom.phone' is possibly 'undefined'.
main.ts(14,13): error TS18047: 'tom.emergencyContact' is possibly 'null'.
main.ts(15,7): error TS2322: Type 'string | null' is not assignable to type 'string'.
  Type 'null' is not assignable to type 'string'.
```

(These lines follow the declarations above, hence line 13.) Without this check, all three lines
would compile and the first would crash when it ran.

## Narrowing by checking

The fix is to check. After `if (x === undefined) return ...;`, the compiler knows that in the rest
of the function `x` is not `undefined`. This is **narrowing**, which lesson 3 previewed:

```ts
function phoneLine(member: Member): string {
  if (member.phone === undefined) {
    return `${member.name}: no phone`;
  }
  return `${member.name}: ${member.phone} (${member.phone.length} characters)`;
}

function contactOf(member: Member): string {
  if (member.emergencyContact !== null) {
    return member.emergencyContact.toUpperCase();
  }
  return "NONE";
}

for (const member of members) {
  console.log(phoneLine(member), "|", contactOf(member));
}
```

```text
Ines: 555-0142 (8 characters) | RUI
Tom: no phone | NONE
```

Returning early for the missing case, as `phoneLine` does, keeps the main path of a function
unindented. One use of loose equality is accepted practice: `value == null` is true for both
`null` and `undefined`, and narrows out both.

You can also check by truthiness, `if (member.phone)`, but that treats an empty string (and, for
numbers, `0`) as missing too. Compare with `undefined` or `null` when an empty string or a zero
is a real value.

## Optional chaining `?.`

`a?.b` reads `b` if `a` is an object, and gives `undefined` without crashing if `a` is `null` or
`undefined`. The rest of the chain is then skipped, which is called **short-circuiting**. It works
for calls, `f?.()`, and brackets, `list?.[0]`, too:

```ts
const zoe = members.find((member) => member.name === "Zoe");
console.log(zoe?.name, zoe?.phone?.length, members[0].phone?.length);
console.log(zoe?.name.toUpperCase());
console.log(members[1].phone ?? "no phone", zoe?.name ?? "not a member");
```

```text
undefined undefined 8
undefined
no phone not a member
```

`zoe?.name.toUpperCase()` does not crash: once `zoe` turns out to be `undefined`, the whole chain
stops. The type of `zoe?.name` is `string | undefined`, so the compiler still reminds you that the
result may be missing.

## Nullish coalescing `??` and `??=`

`a ?? b` gives `a`, unless `a` is `null` or `undefined`, in which case it gives `b`. It is the
right way to supply a default, as the last line above does. Lesson 5 used `||` for defaults, but
`||` replaces *every* falsy value, including `0` and `""`:

```ts
interface Settings {
  volume?: number;
  nickname?: string;
}

const settings: Settings = { volume: 0, nickname: "" };
console.log(settings.volume || 50, settings.volume ?? 50);
console.log(`[${settings.nickname || "anon"}] [${settings.nickname ?? "anon"}]`);
let greeting: string | undefined;
greeting ??= "Welcome";
greeting ??= "Hello again";
console.log(greeting);
```

```text
50 0
[anon] []
Welcome
```

A volume of 0 is a real choice that `||` throws away and `??` keeps. `a ??= b` assigns `b` only when
`a` is `null` or `undefined`, so the second `??=` changed nothing. Use `??` for "missing" and keep
`||` for "falsy".

## The non-null assertion `!`

Writing `!` after an expression tells the compiler "trust me, this is not `null` or `undefined`".
It removes them from the type and checks nothing while the program runs:

```ts
const zoe = members.find((member) => member.name === "Zoe")!;
console.log(zoe.name);
```

```text
/tmp/work/main.ts:13
console.log(zoe.name);
                ^

TypeError: Cannot read properties of undefined (reading 'name')
```

The `!` turned a compiler error into a crash. Almost always there is a better choice: check and
handle the missing case, supply a default with `??`, or throw an error with a clear message
(lesson 12). Use `!` only when you can prove the value exists and the compiler cannot see why.

## Common mistakes

- **Silencing the compiler with `!`.** As above, the crash just moves to run time. Check instead.
- **`||` for a default when 0 or `""` are valid.** A volume of 0 becomes 50. Use `??`.
- **Mixing `??` with `||` or `&&`.** With `typed` and `fallback` declared as
  `string | undefined` on lines 1 and 2, the compiler refuses to guess the order:

  ```ts
  console.log(typed || fallback ?? "c");
  ```

  ```text
  main.ts(3,13): error TS5076: '||' and '??' operations cannot be mixed without parentheses.
  ```

  Add parentheses: `(typed || fallback) ?? "c"`.
- **Checking with `typeof x === "object"`.** `typeof null` is `"object"`, so this does not rule out
  `null`. Compare with `null` directly.

## Practice

1. Write `initials(first: string, last?: string): string` that returns the capitalized first
   letters, or only the first one when there is no last name.
2. Print the last element of an empty `number[]`, or `no scores yet`.
3. What does `` `${stock ?? 10} ${stock || 10} [${note ?? "none"}]` `` give when `stock` is 0 and
   `note` is `""`, and when they are `undefined` and `null`?

### Answers

1. ```ts
   function initials(first: string, last?: string): string {
     const lastInitial = last?.at(0) ?? "";
     return `${first.at(0)}${lastInitial}`.toUpperCase();
   }
   console.log(initials("ada", "lovelace"), initials("plato"));
   ```

   ```text
   AL P
   ```
2. `console.log(scores.at(-1) ?? "no scores yet");` prints `no scores yet`, because `at(-1)` on
   an empty array is `undefined`.
3. `0 10 []` and `10 10 [none]`. Only `??` keeps the 0 and the empty string.

## Key takeaways

- `undefined` means "not given"; `null` means "deliberately empty". Both crash a property read.
- With `strictNullChecks`, a type includes `null` or `undefined` only when it says so, and the
  compiler makes you check (TS18047, TS18048).
- Check with `=== undefined`, `!== null` or `== null`, and return early for the missing case.
- `?.` stops at `null` or `undefined`; `??` and `??=` supply defaults only for those two values.
- The non-null assertion `!` checks nothing. Prefer a check, a default, or a clear error.

## Further reading

- [TypeScript handbook: Everyday Types, null and undefined](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#null-and-undefined)
- [TSConfig reference: strictNullChecks](https://www.typescriptlang.org/tsconfig/#strictNullChecks)
- [MDN: Optional chaining (?.)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [MDN: Nullish coalescing operator (??)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
