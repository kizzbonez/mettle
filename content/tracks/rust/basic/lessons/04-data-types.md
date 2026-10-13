---
title: Data Types
summary: The built-in types for numbers, truth values and characters, the tuples and arrays that group them, and how to convert between types on purpose.
minutes: 25
objectives:
  - Choose a suitable integer or floating-point type and write its literals
  - Predict what integer overflow does and pick a checked, wrapping or saturating method
  - Group values in tuples and arrays and read them back
  - Convert between number types with `from` and `as`, and state what each can lose
---

## Outline

1. Integers
2. Integer overflow
3. Floating-point numbers, booleans and characters
4. Tuples and arrays
5. Converting between types

## Integers

Rust is *statically typed*: the compiler knows the type of every value before the program
runs. It usually infers the type, and types never change silently.

An *integer* is a whole number. A *signed* integer can be negative, an *unsigned* one cannot.
The number in a type's name is its size in *bits*, the binary digits that memory is made of.

| Bits | Signed | Unsigned |
| --- | --- | --- |
| 8 | `i8` | `u8` |
| 16 | `i16` | `u16` |
| 32 | `i32` | `u32` |
| 64 | `i64` | `u64` |
| 128 | `i128` | `u128` |
| size of a memory address | `isize` | `usize` |

More bits hold bigger numbers: `u8` covers 0 to 255 and `i8` covers -128 to 127. When nothing
says otherwise, an integer is an `i32`. `usize` is the type of every length and every position
in a list.

```rust
fn main() {
    let boxes = 1_000;
    let small: u8 = 255;
    let big: i64 = 9_000_000_000;
    let mask = 0xff;
    println!("{boxes} {small} {big} {mask}");
    println!("i32 holds {} to {}", i32::MIN, i32::MAX);

    println!("7 / 2 = {}", 7 / 2);
    println!("-7 / 2 = {}", -7 / 2);
    println!("7 % 2 = {}", 7 % 2);
    println!("7.0 / 2.0 = {}", 7.0 / 2.0);
    println!("0.1 + 0.2 = {}", 0.1 + 0.2);
}
```

```text
1000 255 9000000000 255
i32 holds -2147483648 to 2147483647
7 / 2 = 3
-7 / 2 = -3
7 % 2 = 1
7.0 / 2.0 = 3.5
0.1 + 0.2 = 0.30000000000000004
```

A value written directly in the code is a *literal*. Underscores in a number literal are only
for readability, `0xff` is hexadecimal (base 16), and a type can be attached as a suffix:
`255u8`. `i32::MIN` and `i32::MAX` are the limits of the type. The two colons mean "the thing
of that name that belongs to this type". Dividing two integers gives an integer: the
fraction is dropped, rounding toward zero. `%` gives the remainder.

## Integer overflow

*Overflow* is a result too big or too small for its type. When the compiler can see it
coming, it refuses:

```rust
fn main() {
    let level: u8 = 255;
    let next = level + 1;
    println!("{next}");
}
```

```text
error: this arithmetic operation will overflow
 --> src/main.rs:3:16
  |
3 |     let next = level + 1;
  |                ^^^^^^^^^ attempt to compute `u8::MAX + 1_u8`, which would overflow
  |
  = note: `#[deny(arithmetic_overflow)]` on by default
```

When the numbers are only known while the program runs, the outcome depends on how it was
built. A debug build, which is what `cargo run` makes, panics with `attempt to add with
overflow`. A `--release` build *wraps around*: in a `u8`, 255 + 1 becomes 0. Neither is
something to rely on. When overflow is possible, say what you want with a *method*, a
function that is called on a value with a dot:

```rust
fn main() {
    let level: u8 = 250;
    println!("{:?}", level.checked_add(3));
    println!("{:?}", level.checked_add(10));
    println!("{}", level.wrapping_add(10));
    println!("{}", level.saturating_add(10));
}
```

```text
Some(253)
None
4
255
```

`checked_add` answers `Some(result)` when the result fits and `None` when it does not. Those
two belong to the `Option` type of lesson 11. `wrapping_add` always wraps and
`saturating_add` stops at the limit. The same families exist for `sub` and `mul`.

## Floating-point numbers, booleans and characters

- A *floating-point number* has a fractional part. `f64` is the default and `f32` uses half
  the memory with less precision. Write a decimal point to get one: `2.0`. Floats are
  approximations, as `0.1 + 0.2` showed above, so do not use them for money.
- A `bool` is `true` or `false`. Comparisons such as `7 > 2` produce one.
- A `char` is one character in **single** quotes: `'A'`. It is not limited to English
  letters: `'é'` and `'🦀'` are each one `char`. A `char` always takes four bytes. Double
  quotes make a string, which is a different type.

## Tuples and arrays

A *tuple* groups a fixed number of values that may have different types. An *array* holds a
fixed number of values of one type. Its type is written `[i32; 5]`: element type, then length.

```rust
fn main() {
    let open = true;
    let grade = 'A';
    let crab = '🦀';
    println!("{open} {grade} {crab}");

    let parcel = ("KB-204", 12, 3.5);
    let (code, count, kilos) = parcel;
    println!("{code}: {count} boxes, {kilos} kg, again {}", parcel.1);

    let week = [4, 8, 15, 16, 23];
    let zeros = [0; 3];
    println!("first {}, last {}, length {}", week[0], week[4], week.len());
    println!("{week:?} {zeros:?}");
}
```

```text
true A 🦀
KB-204: 12 boxes, 3.5 kg, again 12
first 4, last 23, length 5
[4, 8, 15, 16, 23] [0, 0, 0]
```

`let (code, count, kilos) = parcel;` *destructures* the tuple into three variables. A single
part is reached with a dot and its position, counting from zero. The empty tuple `()` is
called *unit* and stands for "no value".

Array positions also count from zero, and `[0; 3]` means three zeros. An array cannot grow.
The growable list, `Vec`, comes in lesson 12. Reading past the end is never allowed: the
compiler rejects it when it can see the position, and otherwise the program panics.

## Converting between types

```rust
fn main() {
    let boxes: i32 = 40;
    let total: i64 = boxes;
    println!("{total}");
}
```

```text
error[E0308]: mismatched types
 --> src/main.rs:3:22
  |
3 |     let total: i64 = boxes;
  |                ---   ^^^^^ expected `i64`, found `i32`
  |                |
  |                expected due to this
  |
help: you can convert an `i32` to an `i64`
  |
3 |     let total: i64 = boxes.into();
  |                           +++++++
```

"Expected X, found Y" is the wording of every type mismatch. There are two ways to convert:

```rust
fn main() {
    let boxes: i32 = 40;
    let extra: i64 = 2;
    let total = i64::from(boxes) + extra;
    println!("{total}");

    let big = 300;
    let negative = -1;
    println!("{}", 7 as f64 / 2.0);
    println!("{} {}", 3.99 as i32, -3.99 as i32);
    println!("{} {}", big as u8, negative as u8);
    println!("{}", 9_000_000_000.0 as i32);
}
```

```text
42
3.5
3 -3
44 255
2147483647
```

- `i64::from(boxes)` exists only where every value fits, so it cannot lose anything. The
  `.into()` in the hint is the same conversion written the other way round.
- `as` is a *cast*. It works between all number types and may change the value. A number
  too large for the target keeps only its low bits (300 becomes 44, the remainder after
  dividing by 256), a negative number cast to an unsigned type wraps to a large one, and a
  float cast to an integer loses its fraction and is clamped to the integer's range.

Prefer `from`. Use `as` when you know the value fits, or when you want the fraction dropped.

## Common mistakes

- **Mixing number types.** `count / 2.0` with an integer `count` does not compile. Convert
  one side: `count as f64 / 2.0`.
- **Expecting `7 / 2` to be 3.5.** Integer division drops the fraction. Use floats for a
  fractional result.
- **Subtracting below zero in an unsigned type.** Taking 1 from 0 in a `u32` is an overflow,
  so it panics in a debug build.
- **Narrowing with `as` without checking.** When `big` holds 300, `big as u8` quietly gives
  44. The compiler only objects when the number is written out as a literal.

## Practice

1. Put a name, an age as a `u8` and a height in meters in one tuple. Destructure it and print
   `Ada is 36 and 1.7 m tall`.
2. Three test scores are the integers 7, 8 and 8. Print their average with two decimals.
3. Predict each result: `200u8.checked_add(100)`, `200u8.wrapping_add(100)`,
   `200u8.saturating_add(100)`, `-7 / 2` and `2.9 as i32`.

### Answers

**1.** The suffix on the literal makes the age a `u8`.

```rust
fn main() {
    let person = ("Ada", 36u8, 1.7);
    let (name, age, height) = person;
    println!("{name} is {age} and {height} m tall");
}
```

```text
Ada is 36 and 1.7 m tall
```

**2.** Convert before dividing, or the fraction is lost: `(7 + 8 + 8) as f64 / 3.0`, printed
with `{:.2}`, gives `7.67`.

**3.** `None`, because 300 does not fit in a `u8`. Then `44` (what is left of 300 after
removing 256), `255` (the limit), `-3` (rounding toward zero) and `2` (the fraction is
dropped).

## Key takeaways

- Integers are `i` or `u` plus a bit count, `i32` by default, and `usize` for lengths and
  positions.
- Overflow panics in debug builds and wraps in release builds. The `checked_`, `wrapping_`
  and `saturating_` methods make the choice explicit.
- Tuples group mixed types, arrays repeat one type, and both have a fixed length.
- Nothing converts by itself: use `from` for conversions that cannot lose data and `as` for
  casts that can.

## Further reading

- [The Rust Programming Language: Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html)
- [The Rust Reference: Type cast expressions and overflow](https://doc.rust-lang.org/reference/expressions/operator-expr.html)
- [Standard library: the i32 primitive type](https://doc.rust-lang.org/std/primitive.i32.html)
- [Rust by Example: Casting](https://doc.rust-lang.org/rust-by-example/types/cast.html)
