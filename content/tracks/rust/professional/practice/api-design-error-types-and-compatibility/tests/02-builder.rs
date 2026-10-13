use std::num::NonZeroU32;

let light = NonZeroU32::new(1).expect("1 is not zero");
let heavy = NonZeroU32::new(31_500).expect("31500 is not zero");

// Defaults.
let plain = Parcel::builder("Noor", light).build();
assert!(
    plain.recipient() == "Noor" && plain.weight() == light,
    "the two required settings reach the parcel"
);
assert!(
    plain.service() == Service::Standard,
    "a parcel that did not choose a service gets the default service"
);
assert!(plain.insured_cents() == 0, "a parcel that did not set an insured value is insured for nothing");
assert!(plain.note().is_none(), "a parcel that did not set a note has none, not an empty one");

// Each setter changes its own setting and leaves the others at their defaults.
let express = Parcel::builder("Noor", light).service(Service::Express).build();
assert!(
    express.service() == Service::Express && express.insured_cents() == 0 && express.note().is_none(),
    "the service setter stores the service and changes nothing else"
);
let insured = Parcel::builder("Noor", light).insured_cents(125_000).build();
assert!(
    insured.insured_cents() == 125_000 && insured.service() == Service::Standard && insured.note().is_none(),
    "the insured_cents setter stores the value and changes nothing else"
);
let noted = Parcel::builder("Noor", light).note("leave with the neighbour").build();
assert!(
    noted.note() == Some("leave with the neighbour")
        && noted.service() == Service::Standard
        && noted.insured_cents() == 0,
    "the note setter stores the note and changes nothing else"
);
assert!(
    Parcel::builder("Noor", light).note("").build().note() == Some(""),
    "an empty note that was set is still a note"
);

// The order of the calls does not matter, and the last value of a setting wins.
let one_order = Parcel::builder("Sam", heavy)
    .note("fragile")
    .insured_cents(5)
    .service(Service::Express)
    .build();
let other_order = Parcel::builder("Sam", heavy)
    .service(Service::Express)
    .insured_cents(5)
    .note("fragile")
    .build();
assert!(one_order == other_order, "the order of the builder calls does not change the parcel");

let repeated = Parcel::builder("Sam", heavy)
    .insured_cents(1)
    .insured_cents(2)
    .note("first")
    .note("second")
    .service(Service::Express)
    .service(Service::Standard)
    .build();
assert!(
    repeated.insured_cents() == 2 && repeated.note() == Some("second") && repeated.service() == Service::Standard,
    "when a setting is given twice, the last value wins"
);

// Owned and borrowed text are both accepted.
let name = String::from("Grace Hopper");
let from_owned = Parcel::builder(name.clone(), heavy).note(String::from("back door")).build();
let from_borrowed = Parcel::builder(name.as_str(), heavy).note("back door").build();
assert!(
    from_owned == from_borrowed && from_owned.recipient() == "Grace Hopper",
    "a String and a &str with the same text build the same parcel"
);

// A builder is a value, so a clone of it can serve as a template.
let template = Parcel::builder("Depot 7", heavy).service(Service::Express);
let first = template.clone().note("pallet 1").build();
let second = template.clone().insured_cents(900).build();
let third = template.build();
assert!(
    first.note() == Some("pallet 1") && first.insured_cents() == 0 && first.service() == Service::Express,
    "a parcel built from a cloned builder has the clone's settings and the template's"
);
assert!(
    second.note().is_none() && second.insured_cents() == 900,
    "a parcel built from one clone does not see what another clone was given"
);
assert!(
    third.recipient() == "Depot 7"
        && third.weight() == heavy
        && third.service() == Service::Express
        && third.note().is_none()
        && third.insured_cents() == 0,
    "the template keeps exactly what it was given before it was cloned"
);
