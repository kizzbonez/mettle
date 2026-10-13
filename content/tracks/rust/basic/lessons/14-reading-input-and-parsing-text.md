---
title: "Putting It Together: Reading and Parsing Input"
summary: Read text from standard input, turn each line into a validated struct, report the first bad line by its number, and check your functions with assert_eq.
minutes: 30
objectives:
  - Read one line, and then a whole input, from standard input with `read_line`
  - Parse a line of text into a struct and return a typed error when it is malformed
  - Process many lines with `lines` and `enumerate`, skipping blanks and keeping line numbers
  - Check a function's result with `assert_eq!`
---

## Outline

1. Reading a line of input
2. From a line to a typed value
3. Checking with `assert_eq!`
4. Many lines, with line numbers
5. From here to the lab

## Reading a line of input

Every lesson so far had its data written into the program. Real programs receive text from
outside. *Standard input* is the stream of text that reaches a program from the terminal: what
you type, or a file sent to it with `<`.

```rust
use std::io;

fn main() {
    println!("How many boxes?");

    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("standard input should be readable");
    println!("raw input: {input:?}");

    match input.trim().parse::<u32>() {
        Ok(boxes) => println!("{boxes} boxes fill {} pallets", boxes / 24),
        Err(error) => println!("{:?} is not a count: {error}", input.trim()),
    }
}
```

After you type `100` and press Enter, the program prints:

```text
How many boxes?
raw input: "100\n"
100 boxes fill 4 pallets
```

- `use std::io;` brings the input and output part of the standard library into scope.
- `read_line(&mut input)` waits for a line and **appends** it to `input`. It takes a mutable
  reference, because it has to change your `String`.
- It returns a `Result` holding the number of bytes read, which is 0 when the input has
  ended. Failing to read the terminal at all is not something this program can recover
  from, so `expect` is reasonable here.
- The line ending is part of what was read: `\n`, or `\r\n` on Windows. That is why the text
  is trimmed before `parse`. Typing `lots` instead prints
  `"lots" is not a count: invalid digit found in string`, and the program ends normally.

## From a line to a typed value

Raw text is awkward to work with. The reliable pattern is to convert it once, at the edge of
the program, into a struct that can only hold valid data. Suppose each line of a file looks
like `ada: 91`, a player's name and points.

```rust
#[derive(Debug, PartialEq)]
struct Score {
    name: String,
    points: u32,
}

#[derive(Debug, PartialEq)]
enum ScoreError {
    MissingColon,
    EmptyName,
    BadPoints(String),
}

fn parse_score(line: &str) -> Result<Score, ScoreError> {
    let Some((name, points)) = line.split_once(':') else {
        return Err(ScoreError::MissingColon);
    };
    let name = name.trim();
    if name.is_empty() {
        return Err(ScoreError::EmptyName);
    }
    let points = points.trim();
    let Ok(points) = points.parse::<u32>() else {
        return Err(ScoreError::BadPoints(points.to_string()));
    };
    Ok(Score { name: name.to_string(), points })
}

fn main() {
    println!("{:?}", parse_score("ada: 91"));
    println!("{:?}", parse_score("ada 91"));
    println!("{:?}", parse_score(": 12"));
    println!("{:?}", parse_score("grace: ninety"));

    let expected = Score { name: String::from("lin"), points: 7 };
    assert_eq!(parse_score(" lin :7 "), Ok(expected));
    println!("all checks passed");
}
```

```text
Ok(Score { name: "ada", points: 91 })
Err(MissingColon)
Err(EmptyName)
Err(BadPoints("ninety"))
all checks passed
```

Follow `parse_score` from top to bottom. Each step either produces a cleaner value or leaves
with a specific error:

1. `split_once(':')` returns an `Option`. Without a colon there is nothing to split, so the
   `let ... else` returns `MissingColon`.
2. The name is trimmed, and an empty name is rejected.
3. The points are trimmed and parsed. The error carries the text that could not be parsed,
   so that whoever reads the report can see what was wrong.
4. Only when everything has passed is a `Score` built, with an owned `String` for the name.

The function never panics. Every way the line can be wrong is a value the caller can inspect.

## Checking with `assert_eq!`

`assert_eq!(left, right)` does nothing when the two values are equal. When they differ, it
panics and prints both. Its sibling `assert!(condition)` panics when the condition is false.
They are how you state what a function *should* return, and Rust's tests are built from
them, as are the tests that mark this level's lab. `assert_eq!` needs to compare the values
and to print them, which is why `Score` and `ScoreError` derive `PartialEq` and `Debug`.

## Many lines, with line numbers

A whole file is many lines, and a useful error report says which line was wrong. Add two
pieces to the program above: a function for the whole text, and a `main` that reads all of
standard input.

```rust
use std::io;

fn parse_scores(text: &str) -> Result<Vec<Score>, (usize, ScoreError)> {
    let mut scores = Vec::new();
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        match parse_score(line) {
            Ok(score) => scores.push(score),
            Err(error) => return Err((index + 1, error)),
        }
    }
    Ok(scores)
}

fn main() {
    let mut text = String::new();
    loop {
        let bytes = io::stdin()
            .read_line(&mut text)
            .expect("standard input should be readable");
        if bytes == 0 {
            break;
        }
    }

    match parse_scores(&text) {
        Ok(scores) => {
            let mut total = 0;
            for score in &scores {
                println!("{:<8}{:>4}", score.name, score.points);
                total += score.points;
            }
            println!("{} players, {total} points", scores.len());
        }
        Err((line, error)) => println!("line {line}: {error:?}"),
    }
}
```

Given a file with the four lines `ada: 91`, an empty line, `grace: 78` and `lin: 100`, sent in
with `cargo run < scores.txt`, it prints:

```text
ada       91
grace     78
lin      100
3 players, 269 points
```

Change the third line to `grace: seventy` and the whole output becomes
`line 3: BadPoints("seventy")`.

- `lines()` yields each line without its line ending, and `enumerate()` numbers them from 0.
  People count from 1, hence `index + 1`.
- The empty line is skipped with `continue`, yet it was still counted, because the numbering
  happens before the skipping. That is why the bad line is reported as line 3.
- On the first error the function returns at once. Its error type is a tuple of the line
  number and the problem. A struct with named fields would do the same job more readably.
- In `main`, the loop relies on `read_line` appending: `text` collects the entire input, and
  a result of 0 bytes means there is no more.

## From here to the lab

The lab of this level asks for this same skeleton with stricter rules: one function that
parses a line, one that parses a whole text, typed errors that carry the offending field, the
number of the first bad line, and no panics whatever the input. Read its instructions slowly.
They say exactly which lines to skip, in which order to check the fields and what each error
must contain, and the tests check each of those statements.

## Common mistakes

- **Parsing without trimming.** `"100\n".parse::<u32>()` is an `Err`, because of the line
  ending.
- **Forgetting that `read_line` appends.** To read one line at a time into the same variable,
  call `input.clear()` before each read.
- **Reporting `index` as the line number.** `enumerate` starts at 0. Add 1.
- **Skipping lines before numbering them.** Number every line first, then decide which to
  skip. Otherwise the reported numbers do not match the file.
- **Taking a line apart before deciding whether to skip it.** Decide first. A line you mean
  to ignore may contain the very separator you split on.
- **Using `unwrap` inside a parsing function.** One malformed line then stops the program.
  Return an `Err` and let the caller decide.

## Practice

1. Add a variant `TooHigh(u32)` to `ScoreError` and make `parse_score` return it for more than
   100 points.
2. Write `best_points(scores: &[Score]) -> Option<u32>`, the highest number of points, or
   `None` for an empty slice.
3. Which line number does `parse_scores` report for the text `"ada: 1\n\n\nbob\n"`?

### Answers

**1.** Add the variant to the enum, then check after parsing and before building the struct:

```rust
if points > 100 {
    return Err(ScoreError::TooHigh(points));
}
```

**2.** Deal with the empty slice first, then keep the larger value:

```rust
fn best_points(scores: &[Score]) -> Option<u32> {
    if scores.is_empty() {
        return None;
    }
    let mut best = scores[0].points;
    for score in scores {
        if score.points > best {
            best = score.points;
        }
    }
    Some(best)
}
```

For the three scores in the example it returns `Some(100)`.

**3.** Line 4. The two empty lines are skipped, but they are still counted. The error is
`MissingColon`.

## Key takeaways

- `read_line` appends one line, line ending included, and returns how many bytes it read.
  Trim before parsing.
- Convert text into a struct once, at the edge of the program, and report every problem as a
  typed error.
- `lines().enumerate()` gives each line with its position. Add 1 for a human line number.
- `assert_eq!` states what a function must return, and it is what the lab's tests use.

## Further reading

- [The Rust Programming Language: Programming a Guessing Game](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html)
- [Standard library: Stdin and read_line](https://doc.rust-lang.org/std/io/struct.Stdin.html)
- [Standard library: the str primitive type](https://doc.rust-lang.org/std/primitive.str.html)
