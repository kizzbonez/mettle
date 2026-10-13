---
title: Strings and Slices
summary: The owned String and the borrowed str slice, slices of text and of arrays, why UTF-8 text cannot be indexed by position, and the string methods used every day.
minutes: 30
objectives:
  - Choose between `String` and `&str` for variables, parameters and return values
  - Build text with `push_str`, `format!` and `+`
  - Explain why a string cannot be indexed by position and use `chars` instead
  - Take slices of strings and arrays and apply the common string methods
---

## Outline

1. Two string types
2. Building text
3. Text is UTF-8
4. Slices
5. Methods worth knowing

## Two string types

- A **`String`** owns its text. The text lives on the heap and can grow. Use it when you
  build, change or keep text.
- A **`&str`**, called a *string slice*, is a borrowed view of text that lives somewhere
  else. It is a pointer and a length, nothing more. A string literal is a `&str` whose text
  is built into the executable.

```rust
fn shout(text: &str) -> String {
    let mut loud = text.to_uppercase();
    loud.push('!');
    loud
}

fn main() {
    let literal = "dock";
    let mut owned = String::from("north");
    owned.push(' ');
    owned.push_str(literal);
    println!("{owned}");

    let view: &str = &owned;
    println!("{} {} {}", shout(view), shout(literal), shout(&owned));

    let sign = format!("{owned}, bay {}", 7);
    let sign = sign + " (open)";
    println!("{sign}");
}
```

```text
north dock
NORTH DOCK! DOCK! NORTH DOCK!
north dock, bay 7 (open)
```

`String::from("north")` and `"north".to_string()` both turn a slice into an owned `String`.
Borrowing goes the other way: `&owned` is a `&String`, and Rust converts that to a `&str`
automatically wherever a `&str` is expected, as in `let view: &str = &owned;`.

That gives a rule of thumb. **Parameters take `&str`**, because then a caller can pass a
literal, a slice or a borrowed `String`, as the three calls of `shout` show. **Return a
`String`** when the function creates new text, as `shout` does.

## Building text

- `push` appends one `char`, and `push_str` appends a slice.
- `format!` works like `println!` but returns the text as a `String` instead of printing it.
  It only borrows its arguments.
- `+` joins a `String` on the left with a `&str` on the right. It takes ownership of the left
  side, which is why the example shadows `sign`. For more than two pieces, `format!` is
  easier to read.

## Text is UTF-8

Rust text is always stored as *UTF-8*, an encoding in which one character takes from one to
four bytes. *ASCII* is the basic set of 128 characters that covers the English letters, the
digits and common punctuation. Each of those takes one byte, `é` takes two, and the crab
emoji `🦀` takes four.

```rust
fn main() {
    let plain = "cafe";
    let accented = "café";
    println!("{} {}", plain.len(), accented.len());
    println!("{}", accented.chars().count());

    for letter in accented.chars() {
        print!("[{letter}]");
    }
    println!();
    for byte in accented.bytes() {
        print!("{byte} ");
    }
    println!();
}
```

```text
4 5
4
[c][a][f][é]
99 97 102 195 169 
```

`len()` counts **bytes**, not characters. `chars()` walks through the text one `char` at a
time, and `bytes()` one byte at a time. The last two numbers are the two bytes of `é`. (A
`char` held in a variable always takes four bytes. Inside a string, the same character is
stored in its shorter UTF-8 form.)

This is why a string cannot be indexed with a position:

```rust
fn main() {
    let word = String::from("café");
    let first = word[0];
    println!("{first}");
}
```

```text
error[E0277]: the type `str` cannot be indexed by `{integer}`
 --> src/main.rs:3:22
  |
3 |     let first = word[0];
  |                      ^ string indices are ranges of `usize`
  |
  = help: the trait `SliceIndex<str>` is not implemented for `{integer}`
  = note: you can use `.chars().nth()` or `.bytes().nth()`
```

The message continues with more notes, but these lines hold the answer. A position could
land in the middle of a character, and finding the fifth character means reading the four
before it, so Rust makes you choose: `word.chars().nth(3)` for a character, or a range of
bytes for a slice. `nth` answers with an `Option`, the type of lesson 11, because the text
may be shorter than the position asked for.

## Slices

A *slice* is a reference to a run of neighboring elements inside a collection. The range in
the brackets counts bytes for text and elements for arrays.

```rust
fn total(values: &[i32]) -> i32 {
    let mut sum = 0;
    for value in values {
        sum += value;
    }
    sum
}

fn main() {
    let code = String::from("KB-204-NORTH");
    let prefix = &code[0..2];
    let number = &code[3..6];
    let area = &code[7..];
    println!("{prefix} {number} {area}");

    let weights = [12, 7, 31, 4];
    let middle = &weights[1..3];
    println!("{middle:?} has {} items", middle.len());
    println!("{} {}", total(&weights), total(middle));
}
```

```text
KB 204 NORTH
[7, 31] has 2 items
54 38
```

`&code[3..6]` is a `&str` that points into `code`. Nothing is copied. Leaving out a bound
means "from the start" or "to the end". `&weights[1..3]` has the type `&[i32]`, a slice of
integers, and a parameter of that type accepts a whole array as well as a part of one. A
`for` loop over a slice hands out a reference to each element, which `+=` accepts directly.

Two cautions. A text range must begin and end between characters, otherwise the program
panics: `&"café"[0..4]` stops with "byte index 4 is not a char boundary". And a slice is a
borrow, so the borrowing rules apply: while `prefix` is in use, `code` cannot be changed.

## Methods worth knowing

```rust
fn all_digits(text: &str) -> bool {
    for letter in text.chars() {
        if !letter.is_ascii_digit() {
            return false;
        }
    }
    !text.is_empty()
}

fn main() {
    let line = "  KB-204, in ,40  ";
    let clean = line.trim();
    println!("[{clean}]");
    println!("{} {}", clean.contains("204"), clean.starts_with("KB"));
    println!("{}", clean.replace(" ", ""));

    for field in clean.split(',') {
        print!("[{}]", field.trim());
    }
    println!();

    for row in "first\nsecond\r\nthird".lines() {
        print!("<{row}>");
    }
    println!();

    println!("{} {}", all_digits("204"), all_digits("2O4"));
    println!("{}", clean == String::from("KB-204, in ,40"));
}
```

```text
[KB-204, in ,40]
true true
KB-204,in,40
[KB-204][in][40]
<first><second><third>
true false
true
```

| Method | Result |
| --- | --- |
| `len()`, `is_empty()` | Length in bytes, and whether it is zero |
| `trim()` | The text without whitespace (spaces, tabs, line endings) at either end |
| `to_uppercase()`, `to_lowercase()` | A new `String` in the other case |
| `contains(x)`, `starts_with(x)`, `ends_with(x)` | A `bool` |
| `replace(from, to)` | A new `String` with every match replaced |
| `split(',')` | The pieces between the separators |
| `split_whitespace()` | The words |
| `lines()` | The lines, without their line endings |
| `chars()` | The characters |

Methods that pick out a part, such as `trim`, `split` and `lines`, return `&str` slices of
the original. Methods that change the content return a new `String`. None of them changes
the text they are called on.

`==` compares content, and a `String` can be compared directly with a `&str`. A `char` has
tests of its own, among them `is_ascii_digit()`, `is_ascii_uppercase()` and `is_alphabetic()`.
Turning text into a number is the job of `parse`, which lesson 13 covers.

## Common mistakes

- **Passing a literal where a `String` is expected.** The error is "expected `String`, found
  `&str`". Add `.to_string()`, or better, change the parameter to `&str`.
- **Indexing with `word[0]`.** Loop over `chars()`, or take a byte range.
- **Using `len()` as the number of characters.** It is the number of bytes. Count characters
  with `chars().count()`.
- **Slicing through the middle of a character.** That is a panic at run time. Fixed byte
  positions are only safe for text you know to be plain ASCII.
- **Adding two `String` values.** `a + b` fails with "expected `&str`, found `String`".
  Write `a + &b`, and remember that `a` is moved.
- **Ignoring the result.** `line.trim();` alone does nothing, and the compiler warns about
  the unused value. Write `let line = line.trim();`.

## Practice

1. Write `count_vowels(text: &str) -> usize`, which counts the letters a, e, i, o and u, and
   call it with `"loading dock"`.
2. What are `"été".len()` and `"été".chars().count()`, and why do they differ?
3. Given `let line = "  north , 12 ,open ";`, print each comma-separated field on its own
   line, trimmed and in upper case.

### Answers

**1.** and **3.** in one program:

```rust
fn count_vowels(text: &str) -> usize {
    let mut count = 0;
    for letter in text.chars() {
        if letter == 'a' || letter == 'e' || letter == 'i' || letter == 'o' || letter == 'u' {
            count += 1;
        }
    }
    count
}

fn main() {
    println!("{}", count_vowels("loading dock"));

    let line = "  north , 12 ,open ";
    for field in line.split(',') {
        println!("{}", field.trim().to_uppercase());
    }
}
```

```text
4
NORTH
12
OPEN
```

**2.** 5 and 3. Each `é` takes two bytes in UTF-8 and `t` takes one, so the three characters
occupy five bytes.

## Key takeaways

- `String` owns growable text, and `&str` borrows text. Take `&str` as a parameter and
  return `String` for new text.
- Text is UTF-8. `len()` is in bytes, and there is no indexing by position. Use `chars()`.
- A slice such as `&text[a..b]` or `&array[a..b]` borrows part of a collection without
  copying it.
- String methods return new values or slices and leave the original untouched.

## Further reading

- [The Rust Programming Language: The Slice Type](https://doc.rust-lang.org/book/ch04-03-slices.html)
- [The Rust Programming Language: Storing UTF-8 Encoded Text with Strings](https://doc.rust-lang.org/book/ch08-02-strings.html)
- [Standard library: the str primitive type](https://doc.rust-lang.org/std/primitive.str.html)
- [Standard library: String](https://doc.rust-lang.org/std/string/struct.String.html)
