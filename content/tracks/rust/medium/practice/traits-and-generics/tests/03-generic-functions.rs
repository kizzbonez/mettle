// A ticket type the lab has never seen.
struct Group {
    riders: u32,
}
impl Ticket for Group {
    fn zones(&self) -> u32 {
        2
    }
    fn price_cents(&self) -> u32 {
        250 * self.riders
    }
}

// total_cents
assert!(total_cents::<Single>(&[]) == 0, "an empty slice of tickets costs nothing");
assert!(total_cents(&[Single { zones: 5, used: false }]) == 550, "a slice of one ticket costs that ticket's price");
assert!(total_cents(&[DayPass, DayPass, DayPass]) == 2700, "the total uses the price a type replaced, not the default");
assert!(
    total_cents(&[Group { riders: 2 }, Group { riders: 5 }]) == 1750,
    "total_cents works for a ticket type that was written after it"
);

// pass_pays_off: strictly cheaper, for any two ticket types.
let two_zones = Single { zones: 2, used: false }; // 310 cents
assert!(!pass_pays_off(&DayPass, &two_zones, 0), "with no rides at all a pass never pays off");
assert!(!pass_pays_off(&DayPass, &two_zones, 1), "one ride is cheaper than a day pass");
assert!(pass_pays_off(&DayPass, &two_zones, 3), "three rides of 310 cents cost more than a day pass");

let short_hop = Group { riders: 1 }; // 250 cents
let family = Group { riders: 3 }; // 750 cents
assert!(
    !pass_pays_off(&family, &short_hop, 3),
    "a pass that costs exactly as much as the rides does not pay off"
);
assert!(pass_pays_off(&family, &short_hop, 4), "one ride more than the break-even point pays off");
assert!(
    pass_pays_off(&two_zones, &DayPass, 1),
    "the two arguments may be any two ticket types, in either order"
);
assert!(
    !pass_pays_off(&DayPass, &DayPass, 1),
    "the two arguments may also be of the same type, and equal prices do not pay off"
);
