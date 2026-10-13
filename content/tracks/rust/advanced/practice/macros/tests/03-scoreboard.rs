// This test does not import HashMap: the macro has to name the type itself.
let board = scoreboard! { "ada" => 3, "lin" => 5 };
assert!(board.len() == 2, "two pairs with different names give two entries");
assert!(board.get("ada") == Some(&3) && board.get("lin") == Some(&5), "each name gets its own points");
assert!(board.get("sam").is_none(), "a name that was not listed is not on the board");

// The result is a HashMap<String, u32>.
let typed: std::collections::HashMap<String, u32> = scoreboard!("zoe" => 1);
assert!(typed == std::collections::HashMap::from([(String::from("zoe"), 1)]), "one pair gives a map with one entry");

// No pairs.
let empty: std::collections::HashMap<String, u32> = scoreboard!();
assert!(empty.is_empty(), "with no pairs the board is empty");

// A trailing comma, in a call over several lines.
let relay = scoreboard! {
    "red" => 12,
    "blue" => 9,
    "green" => 14,
};
assert!(relay.len() == 3 && relay["green"] == 14, "a trailing comma after the last pair is allowed");

// A name that appears more than once gets the sum of its points.
let board = scoreboard! { "ada" => 3, "lin" => 5, "ada" => 2, "ada" => 10, "lin" => 1 };
assert!(board.len() == 2, "a name that is listed several times is on the board once");
assert!(board["ada"] == 15, "the points of a name that is listed three times are added up");
assert!(board["lin"] == 6, "the points of a name that is listed twice are added up");

// Names and points are expressions.
let captain = "noor";
let names = ["kim", "lee"];
let bonus = 4;
let board = scoreboard! { captain => bonus * 2, names[1] => bonus + 1, names[0] => 0, captain => 1 };
assert!(board["noor"] == 9, "a name and its points can come from variables and calculations");
assert!(board["lee"] == 5 && board["kim"] == 0, "a name can be any expression that gives a &str, and 0 points still makes an entry");
assert!(bonus == 4 && captain == "noor", "the caller's variables are untouched");
