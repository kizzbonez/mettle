// The example from the instructions. One Vec holds values of two types.
let lane: Vec<Box<dyn Vehicle>> = vec![Box::new(Car), Box::new(Truck { axles: 3 }), Box::new(Car)];
assert_eq!(lane[1].label(), "3-axle truck", "the label of a truck with 3 axles");
assert_eq!(total_toll(&lane), 1700, "the toll of a car, a 3-axle truck and another car");

assert_eq!(
    arrive("truck", 2).map(|vehicle| vehicle.toll_cents()),
    Some(800),
    "the toll of the vehicle built for the kind truck with 2 axles"
);
assert_eq!(arrive("tram", 2).is_none(), true, "whether the kind tram gives no vehicle");

let discounts: Vec<Box<dyn Fn(u32) -> u32>> = vec![
    Box::new(|toll| toll / 2),
    Box::new(|toll| toll.saturating_sub(100)),
];
assert_eq!(
    apply_discounts(1700, &discounts),
    750,
    "a toll of 1700 after it was halved and then reduced by 100"
);
