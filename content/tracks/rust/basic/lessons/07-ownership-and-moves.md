---
title: Ownership and Moves
summary: Every value has exactly one owner, assigning or passing a value moves that ownership, and the value is freed when its owner goes out of scope.
minutes: 30
objectives:
  - State the three ownership rules and say where a value is dropped
  - Explain why assigning a `String` moves it while assigning an integer copies it
  - Read error E0382 and choose between restructuring, `clone` and giving the value back
  - Predict what happens to a value that is passed to a function or returned from one
---

## Outline

1. The stack and the heap
2. The `String` type
3. The three rules
4. Scope and drop
5. Moves
6. `clone` and `Copy`
7. Ownership and functions

## The stack and the heap

A running program keeps its data in two areas of memory.

- The **stack** is fast and orderly. Values are placed on top when a function starts and
  removed when it ends. Everything on it must have a size known at compile time: an `i32`, a
  `bool`, an array such as `[u8; 4]`.
- The **heap** is for data whose size is unknown at compile time or can change, such as text
  that grows. The program asks for a block of memory of the size it needs and receives a
  *pointer*, which is the address of that block. This is called *allocating*. It is slower
  than using the stack, and every block must be handed back exactly once.

Ownership is the set of rules that decides when heap memory is handed back.

## The `String` type

A string literal such as `"crate"` is fixed and built into the program. `String` is the type
for text that can change. `String::from("crate")` creates one from a literal, and `push_str`
appends to it. A `String` has two parts: three small numbers on the stack (a pointer, a
length and a capacity) and the characters themselves on the heap.

## The three rules

1. Each value has an **owner**, the variable that holds it.
2. There is only one owner at a time.
3. When the owner goes out of scope, the value is **dropped**.

## Scope and drop

```rust
fn main() {
    let outer = String::from("pallet");
    {
        let inner = String::from("box");
        println!("{outer} and {inner}");
    } // `inner` goes out of scope: its heap memory is freed here
    println!("{outer} only");
}
```

```text
pallet and box
pallet only
```

*Dropping* a value means running its cleanup. For a `String`, that returns the heap block.
Rust inserts the cleanup at the closing brace of the owner's scope. You never write a `free`,
and nothing has to search for unused memory at run time.

## Moves

What happens when a `String` is assigned to a second variable?

```rust
fn main() {
    let original = String::from("north dock");
    let renamed = original;
    println!("{original} {renamed}");
}
```

```text
error[E0382]: borrow of moved value: `original`
 --> src/main.rs:4:16
  |
2 |     let original = String::from("north dock");
  |         -------- move occurs because `original` has type `String`, which does not implement the `Copy` trait
3 |     let renamed = original;
  |                   -------- value moved here
4 |     println!("{original} {renamed}");
  |                ^^^^^^^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let renamed = original.clone();
  |                           ++++++++
```

`let renamed = original;` copies only the three numbers on the stack. The text on the heap is
not duplicated, so both variables would point at the same block. If both were owners, both
would free it at the end of `main`: a double free. Rule 2 prevents that. Ownership **moves**
to `renamed`, and `original` may not be used again.

The error tells the story in three marks: where the value was created and why it moves,
where it moved, and where it was used afterwards. A *trait*, in the first mark, is a named
ability of a type, and `Copy` is explained below. A move is cheap, because nothing on the
heap is touched.

## `clone` and `Copy`

```rust
fn main() {
    let original = String::from("north dock");
    let duplicate = original.clone();
    println!("{original} and {duplicate}");

    let boxes = 12;
    let same = boxes;
    println!("{boxes} and {same}");

    let pair = (3, true);
    let other = pair;
    println!("{pair:?} and {other:?}");
}
```

```text
north dock and north dock
12 and 12
(3, true) and (3, true)
```

- `clone()` makes a complete second value, heap data included. Each `String` then has its own
  owner. It can be costly for large data, and it is always visible in the code.
- The simple built-in types that live entirely on the stack are **`Copy`**: assigning them
  duplicates the value and both variables stay usable. All integer and float types, `bool`
  and `char` are `Copy`. A tuple or an array is `Copy` when everything in it is.
- A type that owns heap memory, such as `String`, is never `Copy`.

## Ownership and functions

Passing a value to a function follows the same rules as assignment: it moves or it copies.
Returning a value moves it out to the caller.

```rust
fn double(count: u32) -> u32 {
    count * 2
}

fn add_stamp(mut label: String) -> String {
    label.push_str(" [checked]");
    label
}

fn print_label(label: String) {
    println!("label: {label}");
} // `label` is dropped here

fn main() {
    let count = 21;
    println!("{} from {count}", double(count));

    let label = String::from("crate 9");
    let label = add_stamp(label);
    print_label(label);
}
```

```text
42 from 21
label: crate 9 [checked]
```

- `double(count)` receives a copy, so `count` is still usable in `main`.
- `add_stamp(label)` takes ownership, changes the text and returns it. The `mut` in front of
  the parameter makes it changeable inside the function, as `let mut` would. `main` catches
  the returned value in a new `label`.
- `print_label(label)` takes ownership and never gives it back. The text is dropped when
  that function ends, and `main` cannot use `label` after the call.

Handing a value in and getting it back works, but it is clumsy. The next lesson shows how a
function can use a value without owning it.

## Common mistakes

- **Using a value after moving it.** This is error `E0382`. Decide which variable should own
  the value and use only that one.
- **Passing a `String` to a function and then using it again.** The call moved it. Calling
  `print_label(label)` twice in a row fails with "use of moved value".
- **Cloning to silence every error.** It compiles, and it allocates memory each time. Clone
  when you need two independent values, not as a reflex.
- **Believing a move copies the text.** A move copies three numbers. Only `clone` copies the
  heap data.
- **Expecting integers to move.** They are `Copy`, so the original always stays usable.

## Practice

1. For each second line, say whether it is a move or a copy:

```rust
let count = 3;
let copy = count;

let name = String::from("Ada");
let other = name;

let pair = (1, String::from("x"));
let second = pair;
```

2. Write `swap(first: String, second: String) -> (String, String)`, which returns the two
   strings in the opposite order, and call it.
3. Where is each of the three strings dropped?

```rust
fn consume(text: String) {
    println!("{text}");
}

fn main() {
    let a = String::from("a");
    {
        let b = String::from("b");
        consume(a);
        println!("{b}");
    }
    let c = String::from("c");
    println!("{c}");
}
```

### Answers

**1.** `copy` is a copy, because integers are `Copy`. `other` is a move, because `String` owns
heap memory. `second` is a move too: a tuple is `Copy` only if every part is, and this one
contains a `String`.

**2.** Both parameters are moved in, and both are moved out again inside one tuple.

```rust
fn swap(first: String, second: String) -> (String, String) {
    (second, first)
}

fn main() {
    let (a, b) = swap(String::from("left"), String::from("right"));
    println!("{a} {b}");
}
```

```text
right left
```

**3.** `a` is moved into `consume` and dropped at the end of that function. `b` is dropped at
the closing brace of the inner block. `c` is dropped at the end of `main`.

## Key takeaways

- One owner per value. The value is dropped when the owner's scope ends.
- Assigning or passing a non-`Copy` value moves it, and the old name becomes unusable.
- `clone` duplicates heap data on request. Simple stack values are `Copy` and duplicate
  silently.
- A function that takes a `String` owns it. Return it if the caller needs it back.

## Further reading

- [The Rust Programming Language: What Is Ownership?](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)
- [Rust by Example: Ownership and moves](https://doc.rust-lang.org/rust-by-example/scope/move.html)
- [Standard library: String](https://doc.rust-lang.org/std/string/struct.String.html)
