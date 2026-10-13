// Sizes.
assert!(Size::Kids.to_string() == "kids", "the kids size is written in lower case");
assert!(Size::Regular.to_string() == "regular", "the regular size is written in lower case");
assert!(Size::Large.to_string() == "large", "the large size is written in lower case");
assert!(
    format!("one {} and one {}", Size::Kids, Size::Large) == "one kids and one large",
    "a size can be formatted inside a longer text"
);

// Cones.
let cone = Cone { size: Size::Large, flavour: String::from("pistachio") };
assert!(
    cone.to_string() == "large cone, pistachio",
    "a cone reads as its size, the word cone, a comma, and its flavour"
);
assert!(
    Cone { size: Size::Kids, flavour: String::from("vanilla") }.to_string() == "kids cone, vanilla",
    "the size inside a cone is written the way Display for Size writes it"
);
assert!(
    Cone { size: Size::Regular, flavour: String::from("Rum and Raisin") }.to_string()
        == "regular cone, Rum and Raisin",
    "a flavour of several words is printed whole and with its capital letters"
);
assert!(
    format!("Next: {cone}!") == "Next: large cone, pistachio!",
    "a cone can be formatted inside a longer text"
);

// Display and Debug are two different texts.
assert!(
    format!("{:?}", Size::Kids) == "Kids",
    "the derived debug form of a size is still the name of the variant"
);
