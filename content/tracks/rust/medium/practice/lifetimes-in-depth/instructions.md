The starter builds only because everything in it returns or stores an owned `String`. Change
each signature so that it lends out part of the text it was given, and write the bodies.
Nothing in this lab may build a new string: the tests check that every result points into the
text that was passed in.

Every line of the guide is a time written as `HH:MM`, one space, and a title.

1. `earlier` takes two lines and returns the one whose time comes first. When the times are
   equal it returns `a`. Without lifetimes its signature would be
   `earlier(a: &str, b: &str) -> &str`. The result may be either argument, so both arguments
   and the result share one lifetime.
2. `host` returns the part of `line` that follows the first occurrence of `marker`, or `""`
   when `line` does not contain it. Without lifetimes: `host(line: &str, marker: &str) -> &str`.
   The result never borrows from `marker`. Annotate only what it does borrow from, so that a
   caller may drop the marker and keep the result.
3. `Programme` stores a reference to its line, a `&str`, in place of the `String`. A struct
   that holds a reference needs a lifetime parameter, and so does its `impl` block.
   - `Programme::new(line)` stores the reference.
   - `time(&self)` is the text before the first space, and `title(&self)` is the text after
     it. For a line with no space, the time is the whole line and the title is `""`.
   - Both return a `&str` that is a slice of the line, not of the struct. Give the result the
     lifetime of the struct's reference instead of the one elision would pick, so that a
     result may outlive the `Programme` it came from.

The first test uses each result after the marker or the `Programme` has been dropped. If the
build stops there with error E0597, a signature ties its result to something the result does
not borrow from.

Example:

```rust
let news = "07:00 Morning News with Ada";
let quiz = "06:30 Early Quiz";

earlier(news, quiz)              // "06:30 Early Quiz"
host(news, " with ")             // "Ada"
host(quiz, " with ")             // ""

let programme = Programme::new(news);
programme.time()                 // "07:00"
programme.title()                // "Morning News with Ada"
```
