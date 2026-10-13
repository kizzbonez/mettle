---
title: Functions, Statements and Expressions
summary: Define functions with typed parameters and return values, tell a statement from an expression, and document code with comments.
minutes: 20
objectives:
  - Define and call functions with typed parameters and a return type
  - Tell a statement from an expression and say what a trailing semicolon does
  - Use a block as an expression
  - Write line comments, block comments and documentation comments
---

## Outline

1. Defining and calling a function
2. Parameters and return values
3. Statements and expressions
4. The semicolon that breaks a function
5. Comments and documentation

## Defining and calling a function

A *function* is a named piece of code that you can run from elsewhere by *calling* it. You
have used one since lesson 2: `main`. Here are three more.

```rust
fn main() {
    greet("Ada");
    let area = rectangle_area(3, 4);
    println!("area: {area}");
    println!("is 7 even? {}", is_even(7));
}

fn greet(name: &str) {
    println!("Hello, {name}!");
}

fn rectangle_area(width: u32, height: u32) -> u32 {
    width * height
}

fn is_even(number: i32) -> bool {
    number % 2 == 0
}
```

```text
Hello, Ada!
area: 12
is 7 even? false
```

A definition starts with `fn`, then a snake case name, a list of parameters in parentheses,
and a body in braces. The order of definitions does not matter: `main` calls functions that
are written below it.

## Parameters and return values

A *parameter* is a variable that receives a value when the function is called. The value
passed in is an *argument*. In `rectangle_area(3, 4)`, the arguments 3 and 4 become the
parameters `width` and `height`.

- **Every parameter needs a type.** The compiler never guesses here. The first line of a
  function, its *signature*, is a promise to callers, and with complete signatures the
  compiler can infer nearly everything inside the bodies. `&str` is the type of a string
  literal, explained in lesson 9.
- **The return type follows `->`.** A function without an arrow returns the unit value `()`.
- **The last expression is the result.** `width * height` has no `return` and no semicolon.
  Its value becomes the value of the call.

The keyword `return` also exists, for leaving a function before its end. You will see it in
the next lesson, together with `if`.

## Statements and expressions

Rust code is made of two kinds of thing, and the difference explains the missing semicolon.

- An **expression** produces a value: `5`, `width * height`, `is_even(7)`.
- A **statement** does something and produces no value. `let area = 12;` is a statement, and
  so is any expression with a semicolon after it.

A block in braces is itself an expression. Its value is its final expression, the one without
a semicolon.

```rust
fn log(message: &str) {
    println!("log: {message}");
}

fn main() {
    let boxes = 30;
    let pallets = {
        let per_pallet = 12;
        boxes / per_pallet + 1
    };
    println!("pallets needed: {pallets}");

    let result = log("done");
    println!("log returned {result:?}");
}
```

```text
pallets needed: 3
log: done
log returned ()
```

The block computes `30 / 12 + 1`, which is 3 in integer arithmetic, and that becomes
`pallets`. The helper variable `per_pallet` exists only inside the block. A function body is
a block too, which is why its last expression is its result. `log` has no final expression,
so it returns `()`.

## The semicolon that breaks a function

Add a semicolon to the last line and the expression turns into a statement. The body then has
no value to return.

```rust
fn double(number: i32) -> i32 {
    number * 2;
}

fn main() {
    println!("{}", double(21));
}
```

```text
error[E0308]: mismatched types
 --> src/main.rs:1:27
  |
1 | fn double(number: i32) -> i32 {
  |    ------                 ^^^ expected `i32`, found `()`
  |    |
  |    implicitly returns `()` as its body has no tail or `return` expression
2 |     number * 2;
  |               - help: remove this semicolon to return this value
```

Read it in order. The signature promised an `i32`, the body produced `()`, and the `help`
points at the exact semicolon to delete. The "tail" is the compiler's word for a final
expression.

## Comments and documentation

A *comment* is text for people. The compiler ignores it.

```rust
//! Helpers for a parcel service.

/// Returns the shipping cost in cents.
///
/// The cost is a base fee plus a fee for every kilo.
fn shipping_cost(kilos: u32) -> u32 {
    let base = 500; // cents
    /* A block comment
       can span several lines. */
    base + kilos * 120
}

fn main() {
    println!("{}", shipping_cost(3));
}
```

```text
860
```

- `//` starts a comment that runs to the end of the line. This is the usual kind.
- `/* ... */` is a block comment. It is rare in Rust code.
- `///` is a *documentation comment*. It describes the item that follows it. The first line
  should be a one-sentence summary.
- `//!` documents the thing it is inside, so at the top of a file it describes the whole file.

Documentation comments are written in Markdown, and `cargo doc` turns them into web pages
like the ones of the standard library. Use plain comments to say *why* the code does
something. The code already says what it does.

One more tool for unfinished code: the macro `todo!()` stands in for any expression you have
not written yet. It compiles, and it panics with "not yet implemented" if the program reaches
it. The starter file of this level's lab uses it.

## Common mistakes

- **Ending the result with a semicolon.** This is error `E0308` with "expected `i32`, found
  `()`". Remove the semicolon.
- **Leaving out a parameter type.** `fn half(number) -> i32` is a syntax error, and the
  compiler's advice is "if this is a parameter name, give it a type".
- **Passing the wrong number of arguments.** `rectangle_area(3)` fails with `E0061`: "this
  function takes 2 arguments but 1 argument was supplied".
- **Expecting a function to see the caller's variables.** A function sees its parameters,
  its own variables and constants. Pass anything else as an argument.
- **Writing `return` on every last line.** `return width * height;` works, but the plain
  expression is the Rust style.

## Practice

1. Write `celsius_to_fahrenheit(celsius: f64) -> f64` (multiply by 9, divide by 5, add 32) and
   print the result for 100 degrees.
2. This function does not compile. Why, and what is the fix?

```rust
fn perimeter(width: u32, height: u32) -> u32 {
    2 * (width + height);
}
```

3. Without running it, work out what this prints:

```rust
fn main() {
    let x = 4;
    let y = {
        let x = x * 3;
        x + 1
    };
    println!("{x} {y}");
}
```

### Answers

**1.** Every number in the formula is a float, so they are written with a decimal point.

```rust
fn celsius_to_fahrenheit(celsius: f64) -> f64 {
    celsius * 9.0 / 5.0 + 32.0
}

fn main() {
    println!("{}", celsius_to_fahrenheit(100.0));
}
```

```text
212
```

**2.** The semicolon after `2 * (width + height)` makes the line a statement, so the body
returns `()` where a `u32` was promised. Delete the semicolon.

**3.** It prints `4 13`. Inside the block, a new `x` shadows the outer one and is 12, so the
block's value is 13. The inner `x` ends with the block, and the outer `x` is still 4.

## Key takeaways

- A signature lists typed parameters and, after `->`, the return type.
- The last expression of a body, without a semicolon, is the return value.
- Expressions produce values, statements do not, and a block is an expression.
- `//` is for notes, `///` documents the next item, and `//!` documents the enclosing file.

## Further reading

- [The Rust Programming Language: Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)
- [The Rust Programming Language: Comments](https://doc.rust-lang.org/book/ch03-04-comments.html)
- [The Rust Reference: Comments](https://doc.rust-lang.org/reference/comments.html)
- [The rustdoc book: How to write documentation](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html)
