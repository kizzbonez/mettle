// The two structs of the lab.
assert!(Single { zones: 0, used: false }.price_cents() == 150, "a ticket for 0 zones costs the boarding charge alone");
assert!(Single { zones: 1, used: false }.price_cents() == 230, "one zone adds the zone charge once");
assert!(Single { zones: 4, used: true }.price_cents() == 470, "four zones add the zone charge four times, used or not");
assert!(Single { zones: 4, used: true }.zones() == 4, "a single ticket covers the zones in its field");
assert!(
    Single { zones: 1, used: false }.label() == "1-zone ticket, 230 cents",
    "the label is the zones, the words -zone ticket, a comma, and the price with cents"
);
assert!(DayPass.zones() == 4, "a day pass covers 4 zones");
assert!(DayPass.price_cents() == 900, "a day pass has its own price instead of the default");
assert!(
    DayPass.label() == "4-zone ticket, 900 cents",
    "the default label asks price_cents for the price, so a day pass shows its own price"
);

// A type written later gets both defaults for one required method.
struct Night;
impl Ticket for Night {
    fn zones(&self) -> u32 {
        6
    }
}
assert!(Night.price_cents() == 630, "a new type that only writes zones gets the default price");
assert!(Night.label() == "6-zone ticket, 630 cents", "a new type that only writes zones gets the default label");

// A type may replace the price and keep the label.
struct Child {
    zones: u32,
}
impl Ticket for Child {
    fn zones(&self) -> u32 {
        self.zones
    }
    fn price_cents(&self) -> u32 {
        40 * self.zones
    }
}
assert!(
    Child { zones: 3 }.label() == "3-zone ticket, 120 cents",
    "the default label of a new type shows the price that type replaced"
);
