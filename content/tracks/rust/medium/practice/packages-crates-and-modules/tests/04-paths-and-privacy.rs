// The re-export and the full path are the same function.
for grams in [1, 500, 501, 2000, 2001, 9000] {
    let parcel = counter::Parcel::new("box", grams);
    assert!(
        postage(&parcel) == counter::rates::postage(&parcel),
        "postage at the top level gives what counter::rates::postage gives, for every band"
    );
}
assert!(
    postage(&counter::Parcel::new("box", 501)) == 590,
    "the price that postage at the top level gives for a parcel in band 2"
);
assert!(
    postage(&counter::Parcel::new("box", 2001)) == 990,
    "the price that postage at the top level gives for a parcel in band 3"
);

// A stand-in named `band`. The import below brings in every public item of
// `counter`. A private `band` is not among them, so the stand-in is called.
fn band(_grams: u32) -> u32 {
    4242
}
let seen_from_outside = {
    use solution::counter::*;
    band(100)
};
assert!(
    seen_from_outside == 4242,
    "the helper band stays private, so code outside counter cannot name it"
);
