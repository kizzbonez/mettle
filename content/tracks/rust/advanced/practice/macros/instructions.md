Write three macros with `macro_rules!`. Each one has a placeholder rule in the starter, which
accepts anything and expands to a `todo!`. Replace that rule with your own.

Keep `#[macro_export]` above every macro. A `macro_rules!` macro is normally visible only in
the file that defines it, below its definition. `#[macro_export]` lets the tests call it by its
plain name, as in `average!(1.0, 2.0)`.

1. `average!` takes any number of comma-separated expressions of type `f64` and gives their
   average as an `f64`.
   - With no arguments, `average!()` is `0.0`. Give that case a rule of its own.
   - A trailing comma is allowed.
   - Every argument is evaluated exactly once.
2. `scoreboard!` takes zero or more pairs written `name => points` and separated by commas,
   and gives a `std::collections::HashMap<String, u32>`.
   - `name` is an expression that gives a `&str`, and `points` is an expression that gives a
     `u32`.
   - A name that appears more than once gets the **sum** of its points.
   - A trailing comma is allowed, and with no pairs the map is empty.
   - Name the map by its full path inside the macro. The tests do not import `HashMap`.
3. `tally!` is written `tally!(name = a, b, c);` and is used as a statement. It declares a
   variable called `name` **in the caller's scope** that holds the sum of the one or more
   expressions after the `=`. A trailing comma is allowed, and every expression is evaluated
   exactly once.

Example:

```rust
average!(12.5, 13.5, 11.5)                // 12.5
average!()                                // 0.0

let board = scoreboard! { "ada" => 3, "lin" => 5, "ada" => 2 };
board["ada"]                              // 5: both entries for ada, added up
board.len()                               // 2

tally!(house_points = 3, 5, 2);
house_points                              // 10
```

**Tip:** a variable that a macro creates under a name of its own is hidden from the caller.
For `tally!`, capture the caller's name with `$name:ident` and use it in the `let`.
