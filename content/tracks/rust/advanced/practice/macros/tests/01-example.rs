// The example from the instructions. The macros are defined in your file and
// reach this test through `#[macro_export]`.
assert_eq!(average!(12.5, 13.5, 11.5), 12.5, "the average of three times");
assert_eq!(average!(), 0.0, "the average of no times at all");

let board = scoreboard! { "ada" => 3, "lin" => 5, "ada" => 2 };
assert_eq!(board["ada"], 5, "the points of a name that was listed twice");
assert_eq!(board.len(), 2, "the number of names on a board with entries for ada, lin and ada");

tally!(house_points = 3, 5, 2);
assert_eq!(house_points, 10, "the variable that tally! declared for three lots of points");
