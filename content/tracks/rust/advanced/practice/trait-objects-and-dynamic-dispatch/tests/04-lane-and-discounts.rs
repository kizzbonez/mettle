// Two vehicle types this lab has never heard of. A trait object is an open
// set: anything that implements the trait can join the lane.
struct Tractor;

impl Vehicle for Tractor {
    fn label(&self) -> String {
        String::from("tractor")
    }
    fn toll_cents(&self) -> u32 {
        75
    }
}

struct Coach {
    seats: u32,
}

impl Vehicle for Coach {
    fn label(&self) -> String {
        format!("coach for {}", self.seats)
    }
    fn toll_cents(&self) -> u32 {
        10 * self.seats
    }
}

assert!(total_toll(&[]) == 0, "an empty lane pays nothing");

let one: Vec<Box<dyn Vehicle>> = vec![Box::new(Tractor)];
assert!(total_toll(&one) == 75, "a vehicle type defined outside the lab pays what its own toll_cents says");

let mixed: Vec<Box<dyn Vehicle>> = vec![
    Box::new(Tractor),
    Box::new(Car),
    Box::new(Coach { seats: 52 }),
    Box::new(Truck { axles: 4 }),
    Box::new(Tractor),
];
assert!(
    total_toll(&mixed) == 2520,
    "a lane of five vehicles of four types: each one is asked for its own toll"
);
assert!(total_toll(&mixed) == 2520, "the lane is only borrowed, so it can be added up again");

// Discounts: closures of different types behind one trait object type.
assert!(apply_discounts(900, &[]) == 900, "with no discounts the toll comes back unchanged");

let rebate = 120;
let halve_then_rebate: Vec<Box<dyn Fn(u32) -> u32>> =
    vec![Box::new(|toll| toll / 2), Box::new(move |toll| toll.saturating_sub(rebate))];
let rebate_then_halve: Vec<Box<dyn Fn(u32) -> u32>> =
    vec![Box::new(move |toll| toll.saturating_sub(rebate)), Box::new(|toll| toll / 2)];
assert!(
    apply_discounts(1000, &halve_then_rebate) == 380,
    "discounts are applied in the order of the slice: the first one first"
);
assert!(
    apply_discounts(1000, &rebate_then_halve) == 440,
    "the same two discounts in the other order give another result"
);

let single: Vec<Box<dyn Fn(u32) -> u32>> = vec![Box::new(|toll| toll - toll / 10)];
assert!(apply_discounts(2400, &single) == 2160, "a single discount is applied once");

let five: Vec<Box<dyn Fn(u32) -> u32>> = vec![
    Box::new(|toll| toll + 1),
    Box::new(|toll| toll * 3),
    Box::new(|toll| toll - 2),
    Box::new(|toll| toll / 4),
    Box::new(|toll| toll * 10),
];
assert!(
    apply_discounts(9, &five) == 70,
    "every step in a longer list is applied, each to the result of the one before"
);
