// The example from the instructions. The field of `Die` is private, so the
// tests read a die through `sides()`.
assert_eq!(Die::try_from(20).map(|die| die.sides()), Ok(20), "a die made from the number 20");
assert_eq!(Die::try_from(7), Err(DieError::Sides(7)), "a die made from the number 7");

assert_eq!("d6".parse::<Die>().map(|die| die.sides()), Ok(6), "the text d6 parsed as a die");
assert_eq!("6".parse::<Die>(), Err(DieError::Format), "the text 6, which has no d, parsed as a die");
assert!(
    matches!("dx".parse::<Die>(), Err(DieError::Number(_))),
    "the text dx, where no number follows the d, gives the Number variant"
);
assert_eq!("d7".parse::<Die>(), Err(DieError::Sides(7)), "the text d7 parsed as a die");

assert_eq!(
    DieError::Format.to_string(),
    "a die is written as d and a number",
    "the message of the Format error"
);
assert_eq!(DieError::Sides(7).to_string(), "no die has 7 sides", "the message of the Sides error for 7");

let dice = open_bag("d6 d20 d6").expect("a label of three good dice opens");
let sides: Vec<u32> = dice.iter().map(|die| die.sides()).collect();
assert_eq!(sides, [6, 20, 6], "the sides of the three dice on the label d6 d20 d6");

assert_eq!(
    open_bag("d6 d7").unwrap_err().to_string(),
    "no die has 7 sides",
    "the message of the error for a label with a d7 on it"
);
assert_eq!(
    open_bag("").unwrap_err().to_string(),
    "the bag is empty",
    "the message of the error for an empty label"
);
