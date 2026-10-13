Write the body of each function. None of them takes ownership: each one borrows what it needs,
so the caller can go on using its values after the call. Do not change the signatures.

1. `add_points(score: &mut u32, points: u32)` adds `points` to the score that the caller lent
   out. It returns nothing.
2. `sign_up(roster: &mut String, team: &str)` appends a team name to the roster. Names are
   separated by a comma and a space, so there is no separator before the first name and none
   after the last.
3. `banner_width(team: &String) -> usize` is the width of a team's banner: the length of the
   name as `len()` reports it, plus 4 for the border.
4. `leader(first, first_score, second, second_score)` returns a reference to the name of the
   team with more points. On a tie it returns `first`. The signature is written for you: its
   `'a` says that the result borrows from both names, as in the lesson's `shorter`. Return one
   of the two references you were given, not a new `String`.

Example:

```rust
let mut score = 10;
add_points(&mut score, 5);
// score is now 15

let mut roster = String::from("");
sign_up(&mut roster, "Owls");
sign_up(&mut roster, "Foxes");
// roster is now "Owls, Foxes"

let owls = String::from("Owls");
let foxes = String::from("Foxes");
banner_width(&owls)               // 8
leader(&owls, 12, &foxes, 9)      // &owls
leader(&owls, 12, &foxes, 20)     // &foxes
```
