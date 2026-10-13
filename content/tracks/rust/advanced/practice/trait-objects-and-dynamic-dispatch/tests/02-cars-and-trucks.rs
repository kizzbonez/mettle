assert!(Car.label() == "car", "the label of a car");
assert!(Car.toll_cents() == 250, "the toll of a car");

assert!(Truck { axles: 2 }.label() == "2-axle truck", "the label of a truck gives its number of axles");
assert!(Truck { axles: 11 }.label() == "11-axle truck", "the label of a truck with a two-digit number of axles");
assert!(Truck { axles: 1 }.toll_cents() == 400, "a truck pays the axle price once for one axle");
assert!(Truck { axles: 2 }.toll_cents() == 800, "a truck pays for each of its two axles");
assert!(Truck { axles: 6 }.toll_cents() == 2400, "a truck pays for each of its six axles");

// The same answers through a trait object, which is all the booth ever sees.
let small = Truck { axles: 2 };
let seen: &dyn Vehicle = &small;
assert!(
    seen.label() == "2-axle truck" && seen.toll_cents() == 800,
    "a truck behind a &dyn Vehicle answers like the truck itself"
);
let boxed: Box<dyn Vehicle> = Box::new(Car);
assert!(
    boxed.label() == "car" && boxed.toll_cents() == 250,
    "a car behind a Box<dyn Vehicle> answers like the car itself"
);
