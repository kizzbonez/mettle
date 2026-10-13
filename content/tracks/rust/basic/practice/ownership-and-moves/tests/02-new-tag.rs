assert!(new_tag("MAD") == "To: MAD", "a tag is the text To, a colon, one space and the destination");
assert!(
    new_tag("New York") == "To: New York",
    "a destination of two words is added whole, with its space"
);
assert!(new_tag("") == "To: ", "an empty destination still gets the text in front of it");
assert!(
    new_tag("to: x") == "To: to: x",
    "the destination is added exactly as it was given, whatever it says"
);

// Each call creates a value of its own.
let first = new_tag("CPH");
let second = new_tag("HEL");
assert!(
    first == "To: CPH" && second == "To: HEL",
    "two calls give two separate tags, each with its own destination"
);
