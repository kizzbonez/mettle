use solution::counter::{Parcel, rates};

assert!(rates::postage(&Parcel::new("card", 1)) == 350, "the lightest parcel is in band 1");
assert!(rates::postage(&Parcel::new("card", 20)) == 350, "a light letter is in band 1");
assert!(
    rates::postage(&Parcel::new("mug", 500)) == 350,
    "a parcel of exactly 500 g still belongs to band 1"
);
assert!(
    rates::postage(&Parcel::new("mug", 501)) == 590,
    "one gram above 500 g is the first weight of band 2"
);
assert!(rates::postage(&Parcel::new("shoes", 1999)) == 590, "a weight just below 2000 g is in band 2");
assert!(
    rates::postage(&Parcel::new("shoes", 2000)) == 590,
    "a parcel of exactly 2000 g still belongs to band 2"
);
assert!(
    rates::postage(&Parcel::new("lamp", 2001)) == 990,
    "one gram above 2000 g is the first weight of band 3"
);
assert!(rates::postage(&Parcel::new("chair", 30_000)) == 990, "a very heavy parcel is in band 3");

// The parcel keeps what it was given.
let parcel = Parcel::new("tea set", 760);
assert!(parcel.label == "tea set", "new stores the label it was given");
assert!(parcel.grams() == 760, "new stores the weight it was given, and grams returns it");
assert!(
    parcel.grams() == 760 && rates::postage(&parcel) == 590,
    "reading the weight and the postage does not change the parcel"
);
