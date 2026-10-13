---
title: Unsized Types, the Never Type and Function Pointers
summary: Why `str`, slices and `dyn Trait` always sit behind a pointer, what the `Sized` bound and the `!` type do for you, and how to pass and return functions and closures.
minutes: 25
objectives:
  - Explain why a dynamically sized type must be used behind a pointer
  - Relax the implicit `Sized` bound with `?Sized` and say when that is needed
  - Explain why an arm that panics, returns or continues fits in any `match`
  - Pass functions with `fn` pointers and return closures with `impl Fn` or `Box<dyn Fn>`
---

## Outline

1. Dynamically sized types
2. `Sized` and `?Sized`
3. The never type `!`
4. Function pointers
5. Returning closures

## Dynamically sized types

The compiler needs to know how many bytes a value takes in order to store it in a variable, pass it to a function or put it in a struct field. A few types have no single size:

- `str`, text of any length;
- `[T]`, a slice of any number of elements;
- `dyn Trait`, a value of any type that implements the trait.

These are **dynamically sized types** (DSTs, also called unsized types). The rule for them is simple: a DST can only be used behind a pointer, such as `&str`, `Box<[u8]>`, `Rc<str>` or `Box<dyn Trait>`. That pointer is *wide*. It holds the address and one extra word: the length for `str` and slices, the vtable for `dyn Trait`. This is how a `&str` knows where its text ends. A plain `let name: str` is refused because "all local variables must have a statically known size".

## `Sized` and `?Sized`

`Sized` is a marker trait that the compiler implements for every type with a known size. Every generic parameter carries an invisible `T: Sized` bound, because generic code usually moves `T` values around. The bound shows itself when you pass a DST:

```rust
use std::fmt::Debug;

fn show<T: Debug>(value: &T) -> String {
    format!("{value:?}")
}

fn main() {
    println!("{}", show(&5));
    println!("{}", show("text"));
}
```

```text
error[E0277]: the size for values of type `str` cannot be known at compilation time
 --> src/main.rs:9:25
  |
9 |     println!("{}", show("text"));
  |                    ---- ^^^^^^ doesn't have a size known at compile-time
  |                    |
  |                    required by a bound introduced by this call
  |
  = help: the trait `Sized` is not implemented for `str`
note: required by an implicit `Sized` bound in `show`
help: consider relaxing the implicit `Sized` restriction
  |
3 | fn show<T: Debug + ?Sized>(value: &T) -> String {
  |                  ++++++++
```

`"text"` is a `&str`, so `T` would have to be `str`. `?Sized` means "`T` may or may not be `Sized`". It is the only bound with a question mark, and it is safe here because `show` only ever holds a `&T`.

```rust
use std::fmt::Debug;

fn show<T: Debug + ?Sized>(value: &T) -> String {
    format!("{value:?}")
}

fn main() {
    println!("{}", show(&5));
    println!("{}", show("text")); // T = str
    println!("{}", show(&[1, 2, 3][..])); // T = [i32]

    println!("{} {}", size_of::<&u8>(), size_of::<&str>());
    println!("{} {}", size_of::<&[u8]>(), size_of::<Box<dyn Debug>>());
}
```

```text
5
"text"
[1, 2, 3]
8 16
16 16
```

The last two lines show the wide pointers: 16 bytes on a 64-bit machine against 8 for an ordinary reference. You will meet `?Sized` mostly when reading signatures, for example `impl<T: ?Sized> Deref for Box<T>`, which is what allows `Box<str>` and `Box<dyn Trait>`.

## The never type `!`

Some expressions never produce a value: `panic!()`, `return`, `break`, `continue`, a `loop` without `break`. Their type is `!`, the **never type**. A function that cannot return is declared with `-> !`.

Because a value of type `!` can never exist, the compiler lets `!` stand in for *any* type. That is why the arms of a `match` may mix a real value with an exit:

```rust
fn fail(code: u32) -> ! {
    panic!("fatal error {code}");
}

fn parse_port(text: &str) -> u16 {
    match text.parse() {
        Ok(port) => port,
        Err(_) => fail(2),
    }
}

fn main() {
    let mut total = 0u32;
    for text in ["8", "oops", "2"] {
        let n: u32 = match text.parse() {
            Ok(n) => n,
            Err(_) => continue, // type `!`, so the match is still a `u32`
        };
        total += n;
    }
    println!("{total}");
    println!("{}", parse_port("8080"));
    println!("{}", parse_port("http"));
}
```

```text
10
8080

thread 'main' (51) panicked at src/main.rs:2:5:
fatal error 2
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

`Option::unwrap` works the same way: its `None` arm panics, so the whole `match` has the type of the `Some` arm. On stable Rust you can write `!` only as a return type. Using it as an ordinary type, as in `let x: ! = ..`, is still experimental.

## Function pointers

`fn(i32) -> i32`, with a lowercase `fn`, is a type: a pointer to a function. A function's name can be used as a value of that type, and so can a closure that captures nothing.

```rust
fn double(n: i32) -> i32 {
    n * 2
}

fn apply_twice(f: fn(i32) -> i32, n: i32) -> i32 {
    f(f(n))
}

#[derive(Debug)]
struct Celsius(f64);

fn main() {
    println!("{}", apply_twice(double, 5));
    println!("{}", apply_twice(|n| n + 1, 5)); // captures nothing, so it coerces

    let table: [(&str, fn(i32) -> i32); 2] = [("double", double), ("abs", i32::abs)];
    for (name, op) in table {
        println!("{name}: {}", op(-4));
    }

    let temps: Vec<Celsius> = [18.5, 21.0].into_iter().map(Celsius).collect();
    println!("{temps:?}, warmest {}", temps[1].0);
}
```

```text
20
7
double: -8
abs: 4
[Celsius(18.5), Celsius(21.0)], warmest 21
```

Three things to take from this:

- All `fn` pointers with one signature share one type, so they fit in an array. Closures do not, because each closure has a type of its own.
- A `fn` pointer implements the closure traits `Fn`, `FnMut` and `FnOnce`, so it goes wherever a closure is accepted. `.map(Celsius)` works because the name of a tuple struct or an enum variant is also a function.
- A closure that **captures** a variable carries data, which a bare pointer cannot hold. Passing `|n| n + step` to `apply_twice` fails with "expected fn pointer, found closure".

So take `impl Fn(i32) -> i32` when callers may pass closures, and a `fn` pointer when you need one plain type, as in a lookup table.

## Returning closures

A closure's type has no name, so a function cannot spell it in its return type. `impl Fn(..)` says "one particular type that implements this trait" and costs nothing at run time. But it stands for **one** type, so a function declared `-> impl Fn(i32) -> i32` cannot return either of two different closures:

```text
error[E0308]: `if` and `else` have incompatible types
 --> src/main.rs:2:36
  |
2 |     if double { |n| n * 2 } else { move |n| n + amount }
  |                 ---------          ^^^^^^^^^^^^^^^^^^^ expected closure, found a different closure
  |                 |
  |                 expected because of this
  |
  = note: no two closures, even if identical, have the same type
  = help: consider boxing your closure and/or using it as a trait object
```

(Closures that capture nothing are an exception, because they can all turn into the same `fn` pointer.) The help line points to the answer from lesson 3, a trait object:

```rust
fn adder(amount: i32) -> impl Fn(i32) -> i32 {
    move |n| n + amount
}

fn pick(double: bool, amount: i32) -> Box<dyn Fn(i32) -> i32> {
    if double { Box::new(|n| n * 2) } else { Box::new(move |n| n + amount) }
}

fn main() {
    let add_five = adder(5);
    println!("{}", add_five(1));
    println!("{} {}", pick(true, 10)(4), pick(false, 10)(4));
}
```

```text
6
8 14
```

`move` matters in both functions: the closure outlives the call, so it must own `amount` and not borrow it.

## Common mistakes

- **Mixing up `fn` and `Fn`.** Lowercase `fn` is a pointer type. `Fn`, `FnMut` and `FnOnce` are traits.
- **Taking a `fn` pointer when callers have closures.** A capturing closure is rejected. Take `impl Fn(..)` instead.
- **Using a `?Sized` parameter by value.** With `T: ?Sized` you may only handle `&T`, `Box<T>` and other pointers.
- **A `-> !` function that can reach its end.** The compiler reports "expected `!`, found `()`".

## Practice

1. Write `fn apply_all(ops: &[fn(i32) -> i32], start: i32) -> i32` that applies each function in turn. What does it return for `&[double, i32::abs, |n| n - 1]` and `-4`?
2. Write `make_op(name: &str, amount: f64)`, which returns a closure that adds `amount` for `"add"`, multiplies by it for `"scale"` and changes nothing otherwise. Why can its return type not be `impl Fn(f64) -> f64`?
3. Inside a function that returns `Option<u32>`, what is the type of `match text.parse::<u32>() { Ok(n) => n, Err(_) => return None }`?

### Answers

1. `7`: doubling gives `-8`, `abs` gives `8`, and the closure gives `7`.

   ```rust
   fn apply_all(ops: &[fn(i32) -> i32], start: i32) -> i32 {
       ops.iter().fold(start, |value, op| op(value))
   }
   ```

2. Three closures are three types, and `impl Fn` stands for one. Two of them capture `amount`, so they cannot become `fn` pointers either:

   ```rust
   fn make_op(name: &str, amount: f64) -> Box<dyn Fn(f64) -> f64> {
       match name {
           "add" => Box::new(move |x| x + amount),
           "scale" => Box::new(move |x| x * amount),
           _ => Box::new(|x| x),
       }
   }
   ```

3. `u32`. The `return` arm has type `!`, which fits any type, so the `match` takes its type from the `Ok` arm.

## Key takeaways

- `str`, `[T]` and `dyn Trait` have no fixed size and live behind wide pointers.
- Generic parameters are `Sized` unless you write `?Sized`.
- `!` is the type of code that never yields a value, and it fits anywhere.
- `fn` pointers are one plain type per signature. Capturing closures are not `fn` pointers.
- Return one closure with `impl Fn`, and a choice of closures with `Box<dyn Fn>`.

## Further reading

- [The Rust Programming Language: Advanced Types](https://doc.rust-lang.org/book/ch20-03-advanced-types.html)
- [The Rust Programming Language: Advanced Functions and Closures](https://doc.rust-lang.org/book/ch20-04-advanced-functions-and-closures.html)
- [The Rust Reference: Trait object types](https://doc.rust-lang.org/reference/types/trait-object.html)
