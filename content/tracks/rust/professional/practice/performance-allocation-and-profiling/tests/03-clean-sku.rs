use std::borrow::Cow;

/// Cleans one SKU. Returns the text, whether it was borrowed, and the number
/// of allocations the call made.
fn measure(sku: &str) -> (String, bool, usize) {
    let mut clean = Cow::Borrowed("");
    let count = allocations(|| clean = clean_sku(sku));
    let borrowed = matches!(clean, Cow::Borrowed(_));
    (clean.into_owned(), borrowed, count)
}

// Already clean: the input itself comes back.
for sku in ["AB-12", "ZX-7", "12345", "A", ""] {
    let (clean, borrowed, count) = measure(sku);
    assert!(clean == sku, "a SKU that is already clean comes back unchanged");
    assert!(borrowed, "a SKU that is already clean is borrowed from the input");
    assert!(count == 0, "a SKU that is already clean costs no allocation, and {count} were made");
}

// Only whitespace to remove: a part of the input comes back.
for (sku, expected) in [("  AB-12", "AB-12"), ("AB-12\n", "AB-12"), ("\t ZX-7  ", "ZX-7"), ("   ", "")] {
    let (clean, borrowed, count) = measure(sku);
    assert!(clean == expected, "the whitespace around a SKU is removed");
    assert!(
        borrowed,
        "a SKU that only needs trimming is a borrowed part of the input"
    );
    assert!(count == 0, "a SKU that only needs trimming costs no allocation, and {count} were made");
}

// Lower-case ASCII letters: a new string, made with one allocation.
for (sku, expected) in [("ab-12", "AB-12"), ("Ab-12", "AB-12"), (" zx-7 ", "ZX-7"), ("AB-12x", "AB-12X")] {
    let (clean, _, count) = measure(sku);
    assert!(clean == expected, "lower-case ASCII letters become upper case, and whitespace around them goes");
    assert!(count <= 1, "a SKU that changes costs at most one allocation, and {count} were made");
}

// Letters outside ASCII are not touched.
let (clean, borrowed, count) = measure("\u{e9}CLAIR-9");
assert!(
    clean == "\u{e9}CLAIR-9" && borrowed && count == 0,
    "a SKU whose only lower-case letter is outside ASCII is already clean"
);
let (clean, _, _) = measure("\u{e9}clair-9");
assert!(
    clean == "\u{e9}CLAIR-9",
    "only the ASCII letters of a SKU are changed to upper case"
);

// A long SKU costs no more than a short one.
let long = format!("  {}  ", "ab-".repeat(500));
let (clean, _, count) = measure(&long);
assert!(clean == clean_sku_before(&long), "a long SKU is cleaned exactly as production cleans it");
assert!(count <= 1, "a long SKU that changes costs at most one allocation, and {count} were made");

let long_clean = format!("  {}  ", "AB-".repeat(500));
let (clean, borrowed, count) = measure(&long_clean);
assert!(
    clean == clean_sku_before(&long_clean) && borrowed && count == 0,
    "a long SKU that only needs trimming is borrowed and costs no allocation"
);
