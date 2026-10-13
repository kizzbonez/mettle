The enum `DieError` and the struct `Die` are declared in the starter. Do not change them or
their `derive` lines. The field of `Die` is private, so the only ways to get a die are the two
conversions you write, and no impossible die can exist.

1. Implement `Display` for `DieError`. By convention the messages are lower case and have no
   full stop.
   - `Format`: `a die is written as d and a number`
   - `Number(inner)`: `not a number of sides: ` followed by the message of the wrapped error
   - `Sides(n)`: `no die has n sides`, with the number in place of `n`
2. Write two `impl` blocks that the starter does not have: `Error` for `DieError`, and
   `From<ParseIntError>` for `DieError`, which wraps the error in `DieError::Number`. Tasks 4
   and 5 use `?` in a way that builds only with them.
3. Implement `TryFrom<u32>` for `Die`. A die has 4, 6, 8, 10, 12 or 20 sides. Any other number
   is `Err(DieError::Sides(number))`.
4. Implement `FromStr` for `Die`, so that `"d6".parse::<Die>()` works. Make the checks in
   this order, without trimming the text:
   - If it does not start with a lower-case `d`, return `DieError::Format`.
   - Parse what follows the `d` as a `u32`, and let `?` turn a failure into
     `DieError::Number`.
   - Hand the number to `Die::try_from`.
5. `open_bag(text: &str) -> Result<Vec<Die>, Box<dyn Error>>` reads a label: dice separated
   by whitespace. It returns the dice in order. The first die that does not parse ends the
   work: pass its `DieError` on with `?`. A label with no dice at all is an error with the
   message `the bag is empty`.

Example:

```rust
Die::try_from(20).map(|die| die.sides())      // Ok(20)
Die::try_from(7)                              // Err(DieError::Sides(7))

"d6".parse::<Die>().map(|die| die.sides())    // Ok(6)
"6".parse::<Die>()                            // Err(DieError::Format)
"dx".parse::<Die>()                           // Err(DieError::Number(..))
"d7".parse::<Die>()                           // Err(DieError::Sides(7))

DieError::Format.to_string()                  // "a die is written as d and a number"
DieError::Sides(7).to_string()                // "no die has 7 sides"

open_bag("d6 d20 d6")                         // Ok: three dice with 6, 20 and 6 sides
open_bag("d6 d7").unwrap_err().to_string()    // "no die has 7 sides"
open_bag("").unwrap_err().to_string()         // "the bag is empty"
```
