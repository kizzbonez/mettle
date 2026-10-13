// Single tickets.
assert!(Single { zones: 3, used: false }.used() == false, "used returns the field of an unused ticket");
assert!(Single { zones: 3, used: true }.used() == true, "used returns the field of a used ticket");
assert!(
    Single { zones: 3, used: false }.refund_cents() == 290,
    "an unused ticket is refunded at its price minus the fee"
);
assert!(Single { zones: 3, used: true }.refund_cents() == 0, "a used ticket gets no refund");
assert!(
    Single { zones: 0, used: false }.refund_cents() == 50,
    "the fee is taken off the cheapest ticket as well"
);
assert!(Single { zones: 0, used: true }.refund_cents() == 0, "the cheapest ticket gets no refund once it is used");

// A refundable ticket written later, with a price of its own.
struct Weekly {
    stamped: bool,
}
impl Ticket for Weekly {
    fn zones(&self) -> u32 {
        4
    }
    fn price_cents(&self) -> u32 {
        3200
    }
}
impl Refundable for Weekly {
    fn used(&self) -> bool {
        self.stamped
    }
}
assert!(
    Weekly { stamped: false }.refund_cents() == 3100,
    "the default refund asks the ticket for its price, so a new type is refunded at its own price minus the fee"
);
assert!(
    Weekly { stamped: true }.refund_cents() == 0,
    "the default refund asks a new type whether it was used"
);
