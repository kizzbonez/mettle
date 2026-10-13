---
title: Variables, Mutability and Printing Values
summary: Give values names with let, decide which of them may change, reuse a name by shadowing it, and print values with println.
minutes: 20
objectives:
  - Declare variables with `let` and explain why they are immutable by default
  - Choose between `mut`, shadowing and `const` for a given need
  - Print values with `{}`, `{:?}`, inline names and named arguments
  - Read the compiler errors for a second assignment and for a changed type
---

## Outline

1. Naming a value with `let`
2. Immutable by default
3. Allowing change with `mut`
4. Shadowing
5. Constants
6. Printing values

## Naming a value with `let`

A *variable* is a name for a value. The line `let boxes = 5;` *binds* the value 5 to the
name `boxes`. The compiler works out the type from the value, which is called *type
inference*. You may also state the type yourself with an *annotation*: `let boxes: i32 = 5;`.
`i32` is Rust's everyday whole-number type, and the next lesson covers the others.

Names are written in *snake case*: lower-case words joined by underscores, as in
`boxes_per_pallet`.

## Immutable by default

Once a value is bound, the variable cannot be given another one. It is *immutable*.

```rust
fn main() {
    let boxes = 5;
    println!("boxes: {boxes}");
    boxes = 6;
    println!("boxes: {boxes}");
}
```

```text
error[E0384]: cannot assign twice to immutable variable `boxes`
 --> src/main.rs:4:5
  |
2 |     let boxes = 5;
  |         ----- first assignment to `boxes`
3 |     println!("boxes: {boxes}");
4 |     boxes = 6;
  |     ^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut boxes = 5;
  |         +++
```

The `^^^` marks the second assignment, the `---` marks the first, and `help` shows the fix.

Why this default? If a name cannot change, then wherever you read it you know its value
without searching the code in between. The few places where something does change are marked,
so they stand out.

## Allowing change with `mut`

Write `mut` after `let` to make a variable *mutable*, meaning changeable.

```rust
fn main() {
    let mut boxes = 5;
    println!("boxes: {boxes}");
    boxes = 6;
    boxes += 10;
    println!("boxes: {boxes}");
}
```

```text
boxes: 5
boxes: 16
```

`boxes += 10` is short for `boxes = boxes + 10`. The same shorthand exists for `-=`, `*=` and
`/=`. Rust has no `++` operator.

## Shadowing

You can declare a new variable with the name of an old one. The new one *shadows* the old
one: from that line on, the name refers to the new variable.

```rust
fn main() {
    let seconds = 200;
    let seconds = seconds % 60;
    println!("seconds left over: {seconds}");

    let ready = "yes";
    let ready = ready == "yes";
    println!("ready: {ready}");

    let price = 10;
    {
        let price = price * 2;
        println!("inside the block: {price}");
    }
    println!("after the block: {price}");
}
```

```text
seconds left over: 20
ready: true
inside the block: 20
after the block: 10
```

Three things to notice:

- `%` gives the remainder of a division, so `200 % 60` is 20.
- The second `ready` has a different type from the first. The first is text, the second is a
  true-or-false value, because `==` compares two values. Shadowing may change the type,
  because it creates a new variable.
- A pair of braces creates a *block* with its own *scope*, the region in which a name is
  valid. The `price` made inside the block disappears at the closing brace, and the outer
  `price` is visible again, unchanged.

Shadowing is not `mut`. A `mut` variable keeps one type for its whole life, and without the
word `let` an assignment to an immutable variable is still an error.

## Constants

A *constant* is a named value that is fixed for the whole program.

- It is declared with `const`, never `let`, and can never be `mut`.
- Its type must be written out. In the next example it is `u32`, a whole number that cannot
  be negative.
- Its value must be something the compiler can calculate, such as `60 * 60`.
- Its name is in capitals with underscores, and it may be declared outside any function.

## Printing values

`println!` takes a *format string* followed by the values to print, which are called its
*arguments*. Each pair of braces in the string is a placeholder for one of them.

```rust
const BOXES_PER_PALLET: u32 = 24;

fn main() {
    let pallets = 3;
    let total = pallets * BOXES_PER_PALLET;
    let dock = "north";
    let price = 4.5;

    println!("{} pallets on the {} dock", pallets, dock);
    println!("{pallets} pallets hold {total} boxes");
    println!("{count} boxes, checked by {name}", count = total + 1, name = "Ada");
    println!("price: {price:.2}");
    println!("debug view: {dock:?} and {:?}", (pallets, total));
    println!("width 6: [{total:>6}] [{dock:<6}]");
    println!("braces: {{}}");
}
```

```text
3 pallets on the north dock
3 pallets hold 72 boxes
73 boxes, checked by Ada
price: 4.50
debug view: "north" and (3, 72)
width 6: [    72] [north ]
braces: {}
```

| Placeholder | Meaning |
| --- | --- |
| `{}` | The next value in the list, in its normal form |
| `{name}` | A variable that is in scope, or a *named argument* given as `name = value` |
| `{:?}` | The *debug* form, meant for programmers. Text is shown in quotes |
| `{:.2}` | Two digits after the decimal point |
| `{:>6}` and `{:<6}` | At least six characters wide, aligned right or left |
| `{{` and `}}` | A literal brace |

The parts combine, with the name before the colon: `{price:.2}`. The debug form matters
because many values, such as the pair `(pallets, total)`, have no normal form and can only be
printed with `{:?}`.

Only a plain name may appear inside the braces. To print a calculation, pass it as an
argument, as `count = total + 1` does above.

## Common mistakes

- **Forgetting `mut`.** Error `E0384` names the variable and shows where to add the word.
- **Adding `mut` to everything.** The compiler warns that a variable "does not need to be
  mutable". Remove the word, and keep the information that the value never changes.
- **Using `mut` to change a type.** Writing `let mut ready = "yes";` and then
  `ready = ready == "yes";` fails with `E0308`, "mismatched types": the compiler expected text
  and found a true-or-false value. Shadow the name with a new `let` instead.
- **Shadowing inside a block by accident.** A `let` inside braces creates a new variable that
  ends with the block. To change the outer variable, assign to it without `let`.
- **Putting a calculation in the braces.** `println!("{total + 1}")` is rejected as an invalid
  format string.
- **Leaving the type off a constant.** `const LIMIT = 10;` fails with "missing type for
  `const` item".

## Practice

1. Write a program with a variable `stock` that starts at 40. Subtract 15, then add 3, and
   print `stock: 28`.
2. Without running it, work out what this prints:

```rust
fn main() {
    let level = 3;
    let level = level * 2;
    {
        let level = level + 10;
        println!("{level}");
    }
    println!("{level}");
}
```

3. Print the number 3.14159 with two decimals and the text `dock` in debug form, using one
   `println!` and a named argument called `label`.

### Answers

**1.** The variable changes, so it needs `mut`.

```rust
fn main() {
    let mut stock = 40;
    stock -= 15;
    stock += 3;
    println!("stock: {stock}");
}
```

```text
stock: 28
```

**2.** It prints `16`, then `6`. The second `let` makes `level` 6. Inside the block a third
`level` is 16, and it ends at the closing brace, so the last line sees 6 again.

**3.** One way:

```rust
fn main() {
    let pi = 3.14159;
    println!("{pi:.2} {label:?}", label = "dock");
}
```

```text
3.14 "dock"
```

## Key takeaways

- `let` binds a value to a name, and the name is immutable unless you write `mut`.
- Shadowing creates a new variable with an old name. It may change the type and it respects
  block scope.
- `const` is for fixed values with a written type and a capitalized name.
- `{}` prints the normal form, `{:?}` the debug form, and `{name}` reads a variable directly.

## Further reading

- [The Rust Programming Language: Variables and Mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)
- [Standard library: std::fmt, the format string syntax](https://doc.rust-lang.org/std/fmt/index.html)
- [Rust by Example: Formatted print](https://doc.rust-lang.org/rust-by-example/hello/print.html)
