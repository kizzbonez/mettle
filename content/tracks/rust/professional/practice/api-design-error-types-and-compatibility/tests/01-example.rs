// The example from the instructions, written as a shop would call the SDK.
use std::num::NonZeroU32;

let weight = NonZeroU32::new(750).expect("750 is not zero");

// Only the required settings: everything else has a default.
let parcel = Parcel::builder("Ada Lovelace", weight).build();
assert_eq!(parcel.recipient(), "Ada Lovelace", "the recipient given to the builder");
assert_eq!(parcel.weight(), weight, "the weight given to the builder");
assert_eq!(parcel.service(), Service::Standard, "the service of a parcel that did not choose one");
assert_eq!(parcel.insured_cents(), 0, "the insured value of a parcel that did not set one");
assert_eq!(parcel.note(), None, "the note of a parcel that did not set one");

// Every optional setting, by name, in one chain.
let express = Parcel::builder(String::from("Lin"), weight)
    .service(Service::Express)
    .insured_cents(20_000)
    .note("ring twice")
    .build();
assert_eq!(express.service(), Service::Express, "the service set on the builder");
assert_eq!(express.insured_cents(), 20_000, "the insured value set on the builder");
assert_eq!(express.note(), Some("ring twice"), "the note set on the builder");

// A tracking code can only be made from valid text.
assert!(TrackingCode::parse("px-4217").is_none(), "a text that is not a tracking code");
let code = TrackingCode::parse("PX004217").expect("PX and six digits is a tracking code");
assert_eq!(code.as_str(), "PX004217", "the text of a parsed code");

// The manifest hands back what it replaces and can be searched with a &str.
let mut manifest = Manifest::new();
assert_eq!(
    manifest.add(code.clone(), parcel.clone()),
    None,
    "what add returns for a code that is new"
);
assert_eq!(
    manifest.add(code, express.clone()),
    Some(parcel),
    "what add returns for a code that already had a parcel"
);
assert_eq!(manifest.get("PX004217"), Some(&express), "a lookup with a &str");
