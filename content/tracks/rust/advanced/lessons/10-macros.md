---
title: Macros
summary: Write declarative macros with `macro_rules!` one step at a time, understand repetition and hygiene, and see where procedural macros take over.
minutes: 30
objectives:
  - Say what a macro can do that a function cannot, and when a function is the better choice
  - Write a `macro_rules!` macro with several rules, fragment specifiers and repetition
  - Predict how hygiene treats local variables created inside a macro
  - Name the three kinds of procedural macro and what each one receives and returns
---

## Outline

1. What a macro is
2. A first `macro_rules!`
3. Several rules and repetition
4. Generating items
5. Hygiene and scope
6. Procedural macros

## What a macro is

A **macro** is code that produces code. The compiler *expands* every macro call into ordinary Rust before it checks types, so a macro works on syntax, not on values. You already use several: `println!`, `vec!`, `assert_eq!`. The `!` marks the call as a macro.

A macro can do three things a function cannot:

- accept any number of arguments;
- accept things that are not values, such as a type, a name or a block of code;
- produce items, such as a `struct` or an `impl` block.

The price is code that is harder to read and errors that point into generated code. If a function or a generic can do the job, use that.

## A first `macro_rules!`

`macro_rules!` defines a **declarative macro**: a list of rules of the form `(matcher) => { expansion }`. The matcher is a pattern over the tokens of the call. `$value:expr` captures one expression and names it `$value`. The part after the colon is a **fragment specifier**. The common ones are `expr` (an expression), `ident` (a name), `ty` (a type), `literal`, `pat` (a pattern), `block`, `item` and `tt` (any single token or bracketed group).

```rust
macro_rules! square {
    ($value:expr) => {
        $value * $value
    };
}

fn next() -> i32 {
    println!("next was called");
    3
}

fn main() {
    println!("{}", square!(7));
    println!("{}", square!(2 + 3));
    println!("{}", square!(next()));
}
```

```text
49
25
next was called
next was called
9
```

Two lessons hide in this output. `square!(2 + 3)` is 25 and not `2 + 3 * 2 + 3`, because a captured expression stays one unit. It is not pasted in as text. But the expansion mentions `$value` twice, so the expression is *evaluated* twice, and `next` runs two times. A careful macro stores the argument in a local variable first.

## Several rules and repetition

Rules are tried from top to bottom, and the first one that matches is used. `$( ... ),*` matches whatever is inside the parentheses zero or more times, separated by commas. `+` means one or more, and `?` means optional. In the expansion, `$( ... )*` repeats its contents once per captured item.

```rust
macro_rules! max {
    ($only:expr) => {
        $only
    };
    ($first:expr, $($rest:expr),+ $(,)?) => {{
        let first = $first;
        let rest = max!($($rest),+);
        if first > rest { first } else { rest }
    }};
}

fn main() {
    println!("{}", max!(3));
    println!("{}", max!(3, 9, 4));
    println!("{}", max!(2.5, 1.5,));
}
```

```text
3
9
2.5
```

Reading the second rule piece by piece: one expression, a comma, then one or more comma-separated expressions, then an optional trailing comma. The expansion calls `max!` again on the rest, so macros can be recursive. The double braces make the expansion a single block expression, which lets it hold `let` statements. A call that fits no rule is a compile error:

```text
error: unexpected end of macro invocation
  --> src/main.rs:13:20
   |
 1 | macro_rules! max {
   | ---------------- when calling this macro
...
13 |     println!("{}", max!());
   |                    ^^^^^^ missing tokens in macro arguments
   |
note: while trying to match meta-variable `$only:expr`
```

## Generating items

The most valuable use of a macro is removing repeated *declarations*, which no function can do.

```rust
trait Unit {
    fn unit() -> &'static str;
}

macro_rules! impl_unit {
    ($($type:ty => $name:literal),+ $(,)?) => {
        $(
            impl Unit for $type {
                fn unit() -> &'static str {
                    $name
                }
            }
        )+
    };
}

struct Meters;
struct Seconds;

impl_unit!(Meters => "m", Seconds => "s", f64 => "plain number");

fn main() {
    println!("{} {} {}", Meters::unit(), Seconds::unit(), f64::unit());
}
```

```text
m s plain number
```

One call wrote three `impl` blocks. The `=>` inside the matcher is not special. It is a literal token that the caller must type.

## Hygiene and scope

A local variable created inside a macro cannot collide with a variable of the same name at the call site. This property is called **hygiene**.

```rust
macro_rules! double_it {
    ($value:expr) => {{
        let x = $value * 2;
        x
    }};
}

fn main() {
    let x = 5;
    println!("{}", double_it!(x + 1)); // the macro's `x` is a different variable
    println!("{x}");
}
```

```text
12
5
```

It works in both directions. A `let total = ..;` inside a macro is invisible to the caller:

```text
error[E0425]: cannot find value `total` in this scope
 --> src/main.rs:9:16
  |
9 |     println!("{total}");
  |                ^^^^^ not found in this scope
  |
help: an identifier with the same name is defined here, but is not accessible due to macro hygiene
```

If the caller should see the variable, the caller must supply its name: capture `$name:ident` and write `let $name = ..;`. Hygiene covers local variables and loop labels only. Functions, types and other items named in an expansion are looked up where the macro is *called*, so an exported macro refers to its own crate's items as `$crate::path::item`.

Scope differs from functions too. A `macro_rules!` macro can be used only **after** its definition in the source text. `#[macro_export]` makes it available to other crates.

## Procedural macros

`macro_rules!` can only match token patterns and rearrange them. It cannot compute, and it cannot build a new name such as `get_` plus a field name. A **procedural macro** removes those limits: it is a Rust function that runs inside the compiler, receives the tokens of the code it is applied to, and returns new tokens. There are three kinds:

| Kind | Looks like | Receives | Produces |
| --- | --- | --- | --- |
| Derive | `#[derive(Describe)]` | the struct or enum | extra items placed after it |
| Attribute | `#[tokio::main]` | the attribute's arguments and the item | a replacement for the item |
| Function-like | `make_table!(..)` | the tokens in the parentheses | whatever replaces the call |

They must live in a crate of their own, with `proc-macro = true` under `[lib]` in its `Cargo.toml`. Here is a complete derive macro:

```rust
use proc_macro::TokenStream;

#[proc_macro_derive(Describe)]
pub fn describe(input: TokenStream) -> TokenStream {
    let mut tokens = input.into_iter();
    let mut name = String::new();
    while let Some(token) = tokens.next() {
        if token.to_string() == "struct" {
            name = tokens.next().expect("a struct name").to_string();
        }
    }
    format!("impl {name} {{ pub fn describe() -> &'static str {{ \"a struct called {name}\" }} }}")
        .parse()
        .unwrap()
}
```

A program that depends on that crate can then write:

```rust
use describe_derive::Describe;

#[derive(Describe)]
struct Invoice;

fn main() {
    println!("{}", Invoice::describe());
}
```

```text
a struct called Invoice
```

Real procedural macros parse their input with the `syn` crate and build their output with `quote`, instead of handling strings. They are not hygienic, they lengthen compile times, and they run arbitrary code during the build, so add them deliberately.

## Common mistakes

- **Writing a macro where a function would do.** Generics and closures cover most needs.
- **Evaluating an argument twice.** Bind it with `let` inside the expansion.
- **Calling a macro above its definition.** The compiler says it "cannot find macro" and notes that the definition "appears later".
- **Forgetting the trailing comma.** Add `$(,)?` so that multi-line calls format cleanly.
- **Expecting a macro's `let` to leak out.** Hygiene hides it. Pass the name in.

## Practice

1. Rewrite `square!` so that its argument is evaluated once.
2. Write `sum!`, which adds one or more comma-separated expressions and allows a trailing comma, so that `sum!(1, 2, 3)` is `6`.
3. Write `newtype!(Meters, f64);` so that it defines `struct Meters(f64);` with a method `fn value(&self) -> f64`.

### Answers

1. Bind first, inside a block:

   ```rust
   macro_rules! square {
       ($value:expr) => {{
           let value = $value;
           value * value
       }};
   }
   ```

2. Capture the first term, then repeat `+ term` for the rest:

   ```rust
   macro_rules! sum {
       ($first:expr $(, $rest:expr)* $(,)?) => {
           $first $(+ $rest)*
       };
   }
   ```

3. Capture a name and a type, and generate two items:

   ```rust
   macro_rules! newtype {
       ($name:ident, $inner:ty) => {
           struct $name($inner);

           impl $name {
               fn value(&self) -> $inner {
                   self.0
               }
           }
       };
   }
   ```

## Key takeaways

- Macros are expanded into ordinary code at compile time.
- A `macro_rules!` rule matches tokens with fragment specifiers and repeats with `$( ... )*`.
- A captured expression is one unit, but it runs once for every place it appears.
- Hygiene keeps a macro's local variables apart from the caller's.
- Procedural macros (derive, attribute, function-like) are compiler plug-ins for what patterns cannot express.

## Further reading

- [The Rust Programming Language: Macros](https://doc.rust-lang.org/book/ch20-05-macros.html)
- [The Rust Reference: Macros By Example](https://doc.rust-lang.org/reference/macros-by-example.html)
- [The Rust Reference: Procedural Macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [The Little Book of Rust Macros: Hygiene](https://lukaswirth.dev/tlborm/decl-macros/minutiae/hygiene.html)
