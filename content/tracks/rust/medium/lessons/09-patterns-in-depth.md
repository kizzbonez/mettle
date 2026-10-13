---
title: Patterns in Depth
summary: Use patterns everywhere Rust accepts them, take values apart in one step, and add ranges, guards and bindings to say exactly which values you mean.
minutes: 25
objectives:
  - List the places where a pattern can appear and say which of them accept refutable patterns
  - Destructure structs, enums, tuples and slices, including nested ones
  - Combine alternatives, ranges, guards and `@` bindings in `match` arms
  - Explain the difference between `_`, a name that starts with an underscore, and `..`
---

## Outline

1. Patterns are everywhere
2. Refutable and irrefutable patterns
3. Destructuring
4. Alternatives, ranges, guards and `@`
5. Ignoring values

## Patterns are everywhere

A **pattern** describes the shape of a value and gives names to its parts. The Basic level used
patterns in `match`, `if let` and `let else`. The left side of every `let`, the variable of a
`for` loop, and the parameters of functions and closures are patterns too.

```rust
fn describe((name, age): (&str, u32)) -> String { // function parameter
    format!("{name} is {age}")
}

fn main() {
    let (x, y) = (3, 4); // let
    println!("{x} {y} {}", describe(("ada", 36)));

    for (index, letter) in ['a', 'b'].iter().enumerate() { // for
        print!("{index}{letter} ");
    }

    let mut stack = vec![1, 2];
    while let Some(top) = stack.pop() { // while let
        print!("{top} ");
    }

    let pairs = [(1, "one"), (2, "two")];
    let names: Vec<&str> = pairs.iter().map(|(_, name)| *name).collect(); // closure
    println!("{names:?}");
}
```

```text
3 4 ada is 36
0a 1b 2 1 ["one", "two"]
```

`while let` loops until the pattern stops matching, here when `pop` returns `None`.

## Refutable and irrefutable patterns

A pattern is **irrefutable** if it matches every possible value of its type, as `x` and
`(a, b)` do. It is **refutable** if some value does not match: `Some(n)` fails for `None`.

`let`, `for` and parameters have nowhere to go when a match fails, so they accept only
irrefutable patterns. `if let`, `while let`, `let else` and `match` arms exist to handle
failure, so they accept refutable ones.

```rust
fn main() {
    let input: Option<u32> = Some(5);
    let Some(n) = input;
    println!("{n}");
}
```

```text
error[E0005]: refutable pattern in local binding
 --> src/main.rs:3:9
  |
3 |     let Some(n) = input;
  |         ^^^^^^^ pattern `None` not covered
```

"Pattern `None` not covered" names the value with nowhere to go. Write
`let Some(n) = input else { return; };`, or use `if let` or `match`.

In the 2024 edition, one `if` can chain several `let` patterns and ordinary conditions with
`&&`. Each name is available to the conditions after it.

```rust
fn main() {
    let limit: Option<u32> = Some(10);
    let text = "7";

    if let Some(max) = limit
        && let Ok(value) = text.parse::<u32>()
        && value <= max
    {
        println!("{value} is within {max}");
    }
}
```

```text
7 is within 10
```

## Destructuring

To **destructure** is to take a value apart with a pattern that mirrors how it was built.

```rust
enum Shape {
    Circle { radius: f64 },
    Rect { width: f64, height: f64 },
}

struct Item {
    id: u32,
    shape: Shape,
}

fn summary(item: &Item) -> String {
    match item {
        Item { id: 0, .. } => String::from("placeholder"),
        Item { shape: Shape::Circle { radius }, .. } => format!("circle r={radius}"),
        Item { id, shape: Shape::Rect { width, height } } if width == height => {
            format!("square #{id}")
        }
        Item { shape: Shape::Rect { width, .. }, .. } => format!("rect w={width}"),
    }
}

fn ends(values: &[i32]) -> String {
    match values {
        [] => String::from("empty"),
        [one] => format!("just {one}"),
        [first, .., last] => format!("{first} to {last}"),
    }
}

fn main() {
    let round = Item { id: 1, shape: Shape::Circle { radius: 2.0 } };
    let square = Item { id: 2, shape: Shape::Rect { width: 3.0, height: 3.0 } };
    let wide = Item { id: 3, shape: Shape::Rect { width: 3.0, height: 5.0 } };
    println!("{} / {} / {}", summary(&round), summary(&square), summary(&wide));
    println!("{} / {}", ends(&[7]), ends(&[4, 9, 1]));
}
```

```text
circle r=2 / square #2 / rect w=3
just 7 / 4 to 1
```

- `Item { id: 0, .. }` tests a field against a literal. `..` means "and the remaining fields".
- A slice pattern matches by length. `[first, .., last]` accepts any slice of two or more
  items, and `[first, rest @ ..]` would bind the remainder as a slice.
- `item` is a reference, so the names bound inside are references as well. The match borrows
  the fields and moves nothing out of the `Item`.

Arms are tried from top to bottom and the first match wins, so put specific arms above general
ones. The compiler also checks that the arms are **exhaustive**: delete the last arm of
`summary` and error E0004, "non-exhaustive patterns", names the missing case.

## Alternatives, ranges, guards and `@`

```rust
fn grade(score: u32) -> String {
    match score {
        0 => String::from("absent"),
        1..=49 => String::from("fail"),
        50 | 51 => String::from("bare pass"),
        n @ 52..=100 if n % 2 == 0 => format!("pass, even ({n})"),
        n @ 52..=100 => format!("pass ({n})"),
        _ => String::from("invalid"),
    }
}

fn main() {
    for score in [0, 30, 51, 64, 77, 140] {
        println!("{}", grade(score));
    }
}
```

```text
absent
fail
bare pass
pass, even (64)
pass (77)
invalid
```

- `|` separates alternatives: "50 or 51".
- `1..=49` is an inclusive **range pattern**. Ranges work for numbers and `char`.
- A **guard** is an `if` after the pattern: the arm is chosen only when the condition is also
  true. Exhaustiveness checking ignores guarded arms, so one needs a fallback such as the
  second `52..=100` arm.
- `name @ pattern` tests a value against the pattern *and* binds it. Without `n @`, the arm
  would know the score was in range but have no name for it.

## Ignoring values

- `_` matches anything and binds nothing, so nothing is moved.
- A name starting with an underscore, such as `_unused`, is a real variable. The underscore
  only silences the "unused variable" warning; the value is still moved into it.
- `..` skips the remaining fields of a struct, or the middle of a tuple or slice, once per
  pattern.

## Common mistakes

A name in a pattern always creates a *new* variable. It never compares with an existing one.

```rust
fn main() {
    let target = 10;
    let reading = Some(3);

    match reading {
        Some(target) => println!("matched {target}"),
        None => println!("nothing"),
    }
}
```

```text
matched 3
```

`Some(target)` matches any `Some` and shadows the outer `target`, which the compiler now
reports as an unused variable. To compare, use a guard: `Some(n) if n == target`.

- **Thinking a guard belongs to the last alternative.** In `4 | 5 if ready`, the guard applies
  to both 4 and 5.
- **Using `_name` to "ignore" a value you need later.** `if let Some(_n) = name` moves the
  `String` out of `name`. Use `Some(_)`.

## Practice

1. Write a `match` on a `u8` named `hour` that returns `"night"` for 0 to 5 and 22 to 23,
   `"morning"` for 6 to 11, and `"day"` otherwise.
2. Write one `let` that takes `first` and `last` out of the tuple `(1, 2, 3, 4)`.
3. Does `let (a, b) = (1, 2, 3);` compile?

### Answers

1. `match hour { 0..=5 | 22..=23 => "night", 6..=11 => "morning", _ => "day" }`.
2. `let (first, .., last) = (1, 2, 3, 4);` binds `first` to 1 and `last` to 4.
3. No. Without `..`, a tuple pattern must have as many elements as the value. The compiler
   reports E0308: "expected a tuple with 3 elements, found one with 2 elements".

## Key takeaways

- `let`, `for` and parameters take irrefutable patterns; `if let`, `while let`, `let else` and
  `match` handle patterns that can fail.
- Patterns mirror construction and nest, so one arm can test and bind several levels at once.
- `|` gives alternatives, `a..=b` a range, `if` a guard, and `name @` a binding for the tested
  value.
- `_` binds nothing, `_name` still binds, and a plain name in a pattern is always new.

## Further reading

- [The Rust Programming Language: Pattern Syntax](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html)
- [The Rust Programming Language: Refutability](https://doc.rust-lang.org/book/ch19-02-refutability.html)
- [The Rust Reference: Patterns](https://doc.rust-lang.org/reference/patterns.html)
- [Rust by Example: Binding](https://doc.rust-lang.org/rust-by-example/flow_control/match/binding.html)
