// Defaults.
assert!(Size::default() == Size::Regular, "the default size is the variant marked with #[default]");
assert!(
    Cone::default() == Cone { size: Size::Regular, flavour: String::new() },
    "a default cone takes the default of every field: the default size and an empty flavour"
);

// `..Default::default()` fills the fields that are not named.
let big = Cone { flavour: String::from("mango"), size: Size::Large };
let plain = Cone { flavour: String::from("mango"), ..Default::default() };
assert!(plain.size == Size::Regular, "a field that is left to the default gets the default size");
assert!(big != plain, "two cones of one flavour and different sizes are not equal");

// From, and the Into that comes with it.
assert!(
    Cone::from("pistachio") == Cone { size: Size::Regular, flavour: String::from("pistachio") },
    "a cone made from a flavour has that flavour and the default size"
);
assert!(
    Cone::from("Rum and Raisin").flavour == "Rum and Raisin",
    "the flavour is stored exactly as it was given"
);
let lemon: Cone = "lemon".into();
assert!(
    lemon == Cone::from("lemon"),
    "into gives the same cone as from, because Into comes with From"
);
assert!(
    lemon.to_string() == "regular cone, lemon",
    "a cone made from a flavour prints with the default size"
);

// The fields in the order the till compares them.
assert!(
    format!("{:?}", Cone::from("lemon")) == "Cone { size: Regular, flavour: \"lemon\" }",
    "the debug form lists size before flavour, the order the fields are declared in"
);

// `Size` is Copy, so using it twice does not move it.
let size = Size::Kids;
let first = Cone { size, flavour: String::from("mint") };
let second = Cone { size, flavour: String::from("mint") };
assert!(first == second, "a size can be used for two cones");
