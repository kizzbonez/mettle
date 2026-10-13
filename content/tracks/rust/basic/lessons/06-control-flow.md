---
title: Control Flow
summary: Make decisions with if, repeat work with loop, while and for, and steer loops with break, continue and labels.
minutes: 25
objectives:
  - Write conditions with comparison and logical operators and branch with `if` and `else`
  - Use `if` as an expression that produces a value
  - Choose between `loop`, `while` and `for`, and iterate over ranges and arrays
  - Steer loops with `break`, `continue`, a `break` value and loop labels
---

## Outline

1. Conditions
2. Branching with `if`
3. `if` is an expression
4. Leaving a function early
5. `loop` and `while`
6. `for` and ranges
7. Loop labels

## Conditions

*Control flow* is the order in which a program runs its lines. Decisions rest on a
*condition*, an expression whose type is `bool`.

- Comparisons: `==` (equal), `!=` (not equal), `<`, `>`, `<=`, `>=`.
- Logic: `&&` (and), `||` (or), `!` (not).

## Branching with `if`

```rust
fn main() {
    let kilos = 23;
    let fragile = false;

    if kilos > 30 {
        println!("too heavy");
    } else if kilos > 20 {
        println!("heavy");
    } else {
        println!("standard");
    }

    if kilos > 20 && !fragile {
        println!("use the forklift");
    }

    let fee = if kilos > 20 { 900 } else { 500 };
    println!("fee: {fee}");
}
```

```text
heavy
use the forklift
fee: 900
```

The conditions are tried from the top, the block of the first true one runs, and the rest are
skipped. The braces are required. Parentheses around the condition are not.

The condition must be a `bool`. Rust does not treat numbers as true or false:

```rust
fn main() {
    let kilos = 23;
    if kilos {
        println!("there is something to ship");
    }
}
```

```text
error[E0308]: mismatched types
 --> src/main.rs:3:8
  |
3 |     if kilos {
  |        ^^^^^ expected `bool`, found integer
```

Say what you mean instead: `if kilos != 0`.

## `if` is an expression

Look again at `let fee = if kilos > 20 { 900 } else { 500 };`. An `if` produces a value: the
value of the block that ran. This replaces the `? :` operator of other languages. Two rules
follow:

- Both blocks must produce the same type, because `fee` can have only one type.
- There must be an `else`. Without it the `if` would have no value when the condition is
  false.

## Leaving a function early

`return` ends a function at once and hands back a value. It suits special cases that should
be dealt with first.

```rust
fn shipping_cost(kilos: u32) -> u32 {
    if kilos >= 30 {
        return 0;
    }
    500 + kilos * 120
}

fn main() {
    println!("{} {}", shipping_cost(3), shipping_cost(45));
}
```

```text
860 0
```

## `loop` and `while`

`loop` repeats its block until a `break`. `while` repeats as long as a condition holds, and
checks it before every round.

```rust
fn main() {
    let mut boxes = 100;
    let mut trips = 0;
    let trips_needed = loop {
        boxes -= 40;
        trips += 1;
        if boxes <= 0 {
            break trips;
        }
    };
    println!("trips: {trips_needed}");

    let mut countdown = 3;
    while countdown > 0 {
        println!("{countdown}");
        countdown -= 1;
    }
    println!("go");
}
```

```text
trips: 3
3
2
1
go
```

A `loop` is an expression too: the value written after `break` becomes the value of the whole
loop. Of the three loops, only `loop` can do this. A `while` or `for` always evaluates to `()`.

## `for` and ranges

`for` runs its block once for each item of an array, a range or another sequence of values.
It is the loop you will use most.

```rust
fn main() {
    let weights = [12, 0, 7, 31];
    let mut total = 0;
    for weight in weights {
        if weight == 0 {
            continue;
        }
        total += weight;
    }
    println!("total: {total}");

    for number in 1..4 {
        print!("{number} ");
    }
    for number in (1..=3).rev() {
        print!("{number} ");
    }
    println!();
}
```

```text
total: 50
1 2 3 3 2 1 
```

- `continue` skips the rest of the current round and moves on to the next item.
- `1..4` is a *range* that starts at 1 and stops **before** 4. `1..=3` includes its end.
  `.rev()` walks a range backwards.

Prefer `for` over a `while` loop with a counter. A `for` loop cannot step past the end of the
array, and a hand-written counter can.

## Loop labels

`break` and `continue` act on the innermost loop. To reach an outer loop, give it a *label*,
a name that starts with a single quote, and mention the label.

```rust
fn main() {
    let mut checked = 0;
    'shelves: for shelf in 1..=3 {
        for slot in 1..=3 {
            checked += 1;
            if shelf * slot == 4 {
                println!("found it at shelf {shelf}, slot {slot}");
                break 'shelves;
            }
        }
    }
    println!("slots checked: {checked}");
}
```

```text
found it at shelf 2, slot 2
slots checked: 5
```

A plain `break` would only have ended the loop over slots, and the search would have carried
on with shelf 3.

## Common mistakes

- **Using a number as a condition.** `if kilos { ... }` is error `E0308`, "expected `bool`,
  found integer".
- **Writing `=` where `==` was meant.** `if kilos = 20` is also `E0308`, and the compiler
  adds "you might have meant to compare for equality".
- **Giving the two blocks different types.** `if kilos > 20 { 900 } else { "standard" }` fails
  with "`if` and `else` have incompatible types".
- **Forgetting that `..` excludes its end.** `1..10` stops at 9. Write `1..=10` to include 10.
- **Counting past the end.** A loop such as `while index <= weights.len()` reads one position
  too many and panics with "index out of bounds".
- **Counting an unsigned number down past zero.** With a `u32` counter, `while count >= 0` is
  always true, and the subtraction at zero panics in a debug build.

## Practice

1. Print the numbers from 10 down to 1 that are divisible by 3, on one line.
2. Add up the numbers from 1 to 100 with a `for` loop and print the sum.
3. Use `loop` with a `break` value to find the first power of 2 that is greater than 1000.

### Answers

All three in one program:

```rust
fn main() {
    for number in (1..=10).rev() {
        if number % 3 == 0 {
            print!("{number} ");
        }
    }
    println!();

    let mut sum = 0;
    for number in 1..=100 {
        sum += number;
    }
    println!("{sum}");

    let mut power = 1;
    let first = loop {
        power *= 2;
        if power > 1000 {
            break power;
        }
    };
    println!("{first}");
}
```

```text
9 6 3 
5050
1024
```

1. `(1..=10).rev()` counts down, and `%` tests divisibility.
2. `sum` must be `mut`, and the range needs `..=` to include 100.
3. The loop doubles `power` until it passes 1000, then `break power` hands the value out.

## Key takeaways

- A condition must be a `bool`. Nothing converts to one automatically.
- `if` is an expression, so it can sit on the right of `let` when both blocks have one type.
- `loop` repeats until `break` and can produce a value, `while` tests first, and `for` walks
  a collection or a range.
- `continue` skips a round, `break` ends a loop, and a label lets either one reach an outer
  loop.

## Further reading

- [The Rust Programming Language: Control Flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html)
- [The Rust Reference: Loops and other breakable expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html)
- [Rust by Example: for and range](https://doc.rust-lang.org/rust-by-example/flow_control/for.html)
