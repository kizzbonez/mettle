let mut roster = String::from("");
sign_up(&mut roster, "Night Owls");
assert!(
    roster == "Night Owls",
    "the first name goes into an empty roster without a separator in front of it"
);
sign_up(&mut roster, "Foxes");
sign_up(&mut roster, "Quizzly Bears");
assert!(
    roster == "Night Owls, Foxes, Quizzly Bears",
    "every later name is separated from the one before by a comma and a space, with nothing after the last"
);

let mut started = String::from("Hawks");
sign_up(&mut started, "Wrens");
assert!(
    started == "Hawks, Wrens",
    "a roster that already holds a name gets the separator before the new one"
);

// The banner is four wider than what len() reports for the name.
assert!(banner_width(&String::from("Foxes")) == 9, "the banner of a five-letter name");
assert!(banner_width(&String::from("")) == 4, "the banner of an empty name is only the border");
assert!(
    banner_width(&String::from("Night Owls")) == 14,
    "a space in the name counts toward the width like any other character"
);
let hawks = String::from("Hawks");
let width = banner_width(&hawks);
assert!(
    width == 9 && hawks == "Hawks",
    "the name is only read, so the caller still has it unchanged after the call"
);
