---
title: Structs and Methods
summary: Group related values into a type of your own, print it with a derived Debug format, and give it behavior with methods and associated functions.
minutes: 25
objectives:
  - Define a struct, create instances and read or change their fields
  - Use field init shorthand, struct update syntax and tuple structs
  - Derive `Debug` and print a struct with `{:?}` and `{:#?}`
  - Write methods that take `&self`, `&mut self` or `self`, and associated functions such as `new`
---

## Outline

1. Defining and creating a struct
2. Shorthand and update syntax
3. Printing with `derive(Debug)`
4. Tuple structs
5. Methods
6. Associated functions

## Defining and creating a struct

A tuple groups values, but its parts have no names. A *struct* is a type that you define
yourself, with a named *field* for each value. Type names are written in camel case with a
capital first letter: `Parcel`, `LineError`.

```rust
struct Parcel {
    code: String,
    kilos: u32,
    fragile: bool,
}

fn new_parcel(code: String, kilos: u32) -> Parcel {
    Parcel { code, kilos, fragile: false }
}

fn main() {
    let mut first = Parcel {
        code: String::from("KB-204"),
        kilos: 12,
        fragile: true,
    };
    first.kilos += 3;
    println!("{} weighs {} kg, fragile: {}", first.code, first.kilos, first.fragile);

    let second = new_parcel(String::from("CBL-9"), 40);
    let third = Parcel { code: String::from("ZX-1"), ..second };
    println!("{} {} {}", third.code, third.kilos, third.fragile);
    println!("{} is still usable", second.code);
}
```

```text
KB-204 weighs 15 kg, fragile: true
ZX-1 40 false
CBL-9 is still usable
```

The definition lists each field with its type. A value of the type is called an *instance*,
and it is created by naming the struct and giving every field a value. A field is read and
changed with a dot. To change any field, the whole instance must be `mut`. Rust has no way to
make single fields mutable.

The `code` field is a `String`, not a `&str`, so that each parcel owns its text. A struct
that stores a reference needs a lifetime annotation, which is a Medium topic.

## Shorthand and update syntax

Two conveniences appear in the example.

- **Field init shorthand.** In `new_parcel`, the parameters have the same names as the fields,
  so `code` stands for `code: code`.
- **Struct update syntax.** `..second` means "take every field I have not listed from
  `second`". It must come last.

Update syntax follows the ownership rules for each field it takes. Here it took `kilos` and
`fragile`, which are `Copy`, so `second` stays whole. Had it taken the `String` field, that
field would have moved out of `second`.

## Printing with `derive(Debug)`

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let origin = Point { x: 0, y: 0 };
    println!("{origin:?}");
}
```

```text
error[E0277]: `Point` doesn't implement `Debug`
 --> src/main.rs:8:15
  |
8 |     println!("{origin:?}");
  |               ^^^^^^^^^^ `Point` cannot be formatted using `{:?}` because it doesn't implement `Debug`
  |
  = help: the trait `Debug` is not implemented for `Point`
help: consider annotating `Point` with `#[derive(Debug)]`
  |
1 + #[derive(Debug)]
2 | struct Point {
  |
```

A new type cannot be printed until something says how. The compiler can write the debug
format for you, and the `help` shows the way: an *attribute*, a line starting with `#`, placed
above the definition. A *trait* is a named ability that a type can have. Traits are a Medium
topic, and for now it is enough to know how to ask for three common ones.

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

#[derive(Debug)]
struct Grams(u32);

fn main() {
    let start = Point { x: 3, y: -1 };
    let copy = start.clone();
    println!("{start:?}");
    println!("{start:#?}");
    println!("equal: {}, x + y = {}", start == copy, start.x + start.y);

    let weight = Grams(1500);
    println!("{weight:?} holds {}", weight.0);
}
```

```text
Point { x: 3, y: -1 }
Point {
    x: 3,
    y: -1,
}
equal: true, x + y = 2
Grams(1500) holds 1500
```

`Debug` enables `{:?}` and the multi-line `{:#?}`. `Clone` provides `.clone()`. `PartialEq`
makes `==` and `!=` work by comparing every field. A derive only works when every field has
the ability too. Note that a struct of your own is moved on assignment, like a `String`, even
when all its fields are numbers. It is only copied if you also derive `Copy`.

## Tuple structs

`Grams` is a *tuple struct*: its fields have positions instead of names, and they are read
with `.0`, `.1` and so on. Wrapping a single number this way creates a distinct type, so a
weight in grams cannot be passed where some other `u32` is expected.

## Methods

A *method* is a function that belongs to a type. Methods are written in an `impl` block, and
their first parameter is `self`, the instance the method is called on.

```rust
#[derive(Debug)]
struct Parcel {
    code: String,
    kilos: u32,
}

impl Parcel {
    fn new(code: &str, kilos: u32) -> Self {
        Self { code: code.to_string(), kilos }
    }

    fn is_heavy(&self) -> bool {
        self.kilos > 20
    }

    fn add_weight(&mut self, extra: u32) {
        self.kilos += extra;
    }

    fn into_label(self) -> String {
        format!("{} ({} kg)", self.code, self.kilos)
    }
}

fn main() {
    let mut parcel = Parcel::new("KB-204", 12);
    println!("heavy: {}", parcel.is_heavy());
    parcel.add_weight(10);
    println!("heavy: {}, {parcel:?}", parcel.is_heavy());

    let label = parcel.into_label();
    println!("{label}");
}
```

```text
heavy: false
heavy: true, Parcel { code: "KB-204", kilos: 22 }
KB-204 (22 kg)
```

The form of `self` states what the method does with the instance, in the terms of lesson 8:

- `&self` borrows it to read. This is the usual choice.
- `&mut self` borrows it to change it, so the instance must be `mut`.
- `self` takes ownership. After `parcel.into_label()`, `parcel` is gone.

A method is called with a dot, and Rust adds the `&` or `&mut` for you. Inside a method a
field is always written `self.kilos`, never just `kilos`.

## Associated functions

A function in an `impl` block that has no `self` parameter is an *associated function*. It
belongs to the type, not to one instance, and is called with two colons: `Parcel::new(...)`.
`String::from` is another. `new` is only a convention for a function that builds an instance.
It is not a keyword. Inside the block, `Self` is another name for the type.

One more keyword appears in real code and in this level's lab: `pub` in front of a struct,
a field or a function makes it *public*, which means usable from other parts of a program.
How a program is divided into parts, called modules, is a Medium topic.

## Common mistakes

- **Leaving out `self.` in a method.** Writing `kilos > 20` fails with `E0425`, "cannot find
  value `kilos` in this scope", and the compiler suggests `self.kilos`.
- **Writing `Parcel.new(...)`.** Associated functions need two colons: `Parcel::new(...)`.
- **Calling a `&mut self` method on an immutable instance.** Error `E0596`. Declare the
  instance with `let mut`.
- **Using an instance after a `self` method.** The method took ownership, so this is the
  moved-value error `E0382`.
- **Printing a struct without the derive.** Add `#[derive(Debug)]` above the definition.
- **Putting a `&str` in a field.** That fails with "missing lifetime specifier". Use `String`.

## Practice

1. Define `Rectangle` with fields `width` and `height` (both `u32`), a method `area`, and an
   associated function `square(side: u32)`. Print the area of `Rectangle::square(3)`.
2. Add a method `scale(&mut self, factor: u32)` that multiplies both sides. Scale the square
   by 2 and print it with `{:?}`.
3. Why does the last line fail to compile?

```rust
struct Parcel {
    code: String,
    kilos: u32,
}

fn main() {
    let first = Parcel { code: String::from("KB-204"), kilos: 12 };
    let second = Parcel { kilos: 30, ..first };
    println!("{} {}", second.code, second.kilos);
    println!("{}", first.code);
}
```

### Answers

**1.** and **2.** together:

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn square(side: u32) -> Self {
        Self { width: side, height: side }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut tile = Rectangle::square(3);
    println!("{}", tile.area());
    tile.scale(2);
    println!("{tile:?}");
}
```

```text
9
Rectangle { width: 6, height: 6 }
```

**3.** `..first` fills in `code` from `first`, and `code` is a `String`, so it moves into
`second`. Reading `first.code` afterwards is error `E0382`. `first.kilos` would still be
fine, because a `u32` is copied.

## Key takeaways

- A struct groups named fields into a new type. An instance is `mut` as a whole or not at
  all.
- `#[derive(Debug)]` makes a type printable with `{:?}`. `Clone` and `PartialEq` add
  `.clone()` and `==`.
- Methods live in an `impl` block. `&self` reads, `&mut self` changes, and `self` consumes.
- Associated functions such as `new` have no `self` and are called with `Type::name`.

## Further reading

- [The Rust Programming Language: Defining and Instantiating Structs](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)
- [The Rust Programming Language: An Example Program Using Structs](https://doc.rust-lang.org/book/ch05-02-example-structs.html)
- [The Rust Programming Language: Methods](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)
- [Rust by Example: Structures](https://doc.rust-lang.org/rust-by-example/custom_types/structs.html)
