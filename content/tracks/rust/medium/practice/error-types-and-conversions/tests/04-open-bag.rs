fn sides_in(text: &str) -> Vec<u32> {
    let dice = open_bag(text).expect("a label that lists only good dice opens");
    dice.iter().map(|die| die.sides()).collect()
}

fn message_for(text: &str) -> String {
    match open_bag(text) {
        Ok(_) => String::from("(the bag opened)"),
        Err(error) => error.to_string(),
    }
}

// Good labels.
assert!(sides_in("d8") == [8], "a label with one die");
assert!(sides_in("d20 d4 d4 d12") == [20, 4, 4, 12], "the dice come back in the order of the label, repeats included");
assert!(
    sides_in("  d6\td10\n d6  ") == [6, 10, 6],
    "the dice may be separated by any whitespace, with more of it around the label"
);

// No dice at all.
assert!(message_for("") == "the bag is empty", "an empty label is an error with its own message");
assert!(message_for("  \n\t ") == "the bag is empty", "a label of whitespace only holds no dice either");

// A bad die: its DieError is passed on, and its message can be read from the box.
assert!(
    message_for("d6 d7 d8") == DieError::Sides(7).to_string(),
    "a die with a wrong number of sides is passed on as the error of that die"
);
assert!(
    message_for("d6 6") == DieError::Format.to_string(),
    "a die without its d is passed on as the format error"
);
let not_a_number = "six".parse::<u32>().unwrap_err();
assert!(
    message_for("dsix d6") == DieError::Number(not_a_number).to_string(),
    "a die without a number is passed on as the error that wraps what parse reported"
);

// The first bad die ends the work.
assert!(
    message_for("d4 d5 d7 dx") == DieError::Sides(5).to_string(),
    "with several bad dice the error is the one of the first"
);
assert!(
    message_for("20 d5") == DieError::Format.to_string(),
    "with several bad dice the error is the one of the first, whichever kind it is"
);

// One bad die is enough, wherever it stands.
assert!(open_bag("d6 d6 d6 d6 d66").is_err(), "a bad die at the end of a long label is still an error");
assert!(open_bag("d6 d6 d6 d6 d6").is_ok(), "a long label of good dice opens");
