fn cone(size: Size, flavour: &str) -> Cone {
    Cone { size, flavour: flavour.to_string() }
}

// Sizes: Kids, then Regular, then Large. The flavour is the same, so only the size decides.
assert!(
    smaller(cone(Size::Kids, "mint"), cone(Size::Regular, "mint")) == cone(Size::Kids, "mint"),
    "a kids cone comes before a regular cone"
);
assert!(
    smaller(cone(Size::Regular, "mint"), cone(Size::Large, "mint")) == cone(Size::Regular, "mint"),
    "a regular cone comes before a large cone"
);
assert!(
    smaller(cone(Size::Large, "mint"), cone(Size::Kids, "mint")) == cone(Size::Kids, "mint"),
    "a kids cone comes before a large cone, also when it is the second argument"
);
assert!(
    smaller(cone(Size::Large, "mint"), cone(Size::Regular, "mint")) == cone(Size::Regular, "mint"),
    "a regular cone comes before a large cone, also when it is the second argument"
);

// Size is compared before flavour.
assert!(
    smaller(cone(Size::Large, "apple"), cone(Size::Kids, "zabaione")) == cone(Size::Kids, "zabaione"),
    "the size decides first, even when the larger cone has the earlier flavour"
);
assert!(
    smaller(cone(Size::Regular, "walnut"), cone(Size::Large, "banana")) == cone(Size::Regular, "walnut"),
    "the flavour is not looked at when the sizes differ"
);

// Among cones of one size the flavour decides.
assert!(
    smaller(cone(Size::Regular, "mint"), cone(Size::Regular, "lemon")) == cone(Size::Regular, "lemon"),
    "two cones of one size are ordered by flavour, in alphabetical order"
);
assert!(
    smaller(cone(Size::Kids, "cherry"), cone(Size::Kids, "cocoa")) == cone(Size::Kids, "cherry"),
    "flavours that start alike are compared letter by letter"
);

// Two equal cones.
assert!(
    smaller(cone(Size::Large, "fig"), cone(Size::Large, "fig")) == cone(Size::Large, "fig"),
    "the smaller of two equal cones is that cone"
);
