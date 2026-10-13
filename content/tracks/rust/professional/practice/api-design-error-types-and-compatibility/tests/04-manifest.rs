use std::num::NonZeroU32;

let grams = |amount: u32| NonZeroU32::new(amount).expect("a weight above zero");
let code = |text: &str| TrackingCode::parse(text).expect("a valid tracking code");

let mut manifest = Manifest::new();
assert!(
    manifest.len() == 0 && manifest.get("PX000001").is_none(),
    "a new manifest holds no parcel"
);

let first = Parcel::builder("Ada", grams(100)).build();
let second = Parcel::builder("Lin", grams(200)).service(Service::Express).build();
let third = Parcel::builder("Sam", grams(300)).note("gift").build();

assert!(
    manifest.add(code("PX000001"), first.clone()).is_none(),
    "adding under a new code replaces nothing"
);
assert!(
    manifest.add(code("PX000002"), second.clone()).is_none(),
    "adding under a second new code replaces nothing"
);
assert!(manifest.len() == 2, "two parcels under two codes are both stored");

// Lookups accept any borrowed form of the key.
assert!(
    manifest.get("PX000001") == Some(&first),
    "a lookup with a &str finds the parcel stored under that code"
);
let key = code("PX000002");
assert!(
    manifest.get(&key) == Some(&second),
    "a lookup with a &TrackingCode finds the parcel stored under that code"
);
let text = String::from("PX000002");
assert!(
    manifest.get(text.as_str()) == Some(&second),
    "a lookup with the &str of a String finds the same parcel"
);
assert!(manifest.get("PX000003").is_none(), "a code that was never added is not found");
assert!(manifest.get("px000001").is_none(), "a lookup compares the whole text of the code");

// Nothing is dropped behind the caller's back.
let replaced = manifest.add(code("PX000001"), third.clone());
assert!(
    replaced == Some(first),
    "adding under a code that is taken hands back the parcel that was there"
);
assert!(
    manifest.get("PX000001") == Some(&third),
    "after a replacement the new parcel is the one that is stored"
);
assert!(manifest.len() == 2, "a replacement does not change the number of parcels");
assert!(
    manifest.get("PX000002") == Some(&second),
    "a replacement leaves the parcels under other codes alone"
);
assert!(
    manifest.add(code("PX000001"), second.clone()) == Some(third),
    "a second replacement hands back the parcel of the first replacement"
);

// A whole pickup.
for number in 100..600_u32 {
    let parcel = Parcel::builder(format!("shop {number}"), grams(number)).build();
    assert!(
        manifest.add(code(&format!("PX{number:06}")), parcel).is_none(),
        "every new code of a large pickup replaces nothing"
    );
}
assert!(manifest.len() == 502, "every parcel of a large pickup is stored");
assert!(
    manifest.get("PX000350").map(Parcel::recipient) == Some("shop 350"),
    "a parcel of a large pickup is found under its own code"
);
assert!(
    manifest.get("PX000350").map(|parcel| parcel.weight().get()) == Some(350),
    "a parcel of a large pickup keeps its own weight"
);
