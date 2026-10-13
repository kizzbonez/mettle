//! Tram Tickets
//!
//! A trait that says what every ticket can do, two types that implement it,
//! and generic functions that work for any ticket, including kinds that are
//! written later.

/// What every kind of ticket can do.
pub trait Ticket {
    /// How many zones the ticket covers. Required: every type writes it.
    fn zones(&self) -> u32;

    /// The price in cents. A default, built on the required method.
    fn price_cents(&self) -> u32 {
        150 + 80 * self.zones()
    }

    /// The line printed on the ticket. A default as well.
    fn label(&self) -> String {
        format!("{}-zone ticket, {} cents", self.zones(), self.price_cents())
    }
}

/// A ticket for one ride through a number of zones.
pub struct Single {
    pub zones: u32,
    pub used: bool,
}

/// A ticket for a whole day in every zone.
pub struct DayPass;

impl Ticket for Single {
    fn zones(&self) -> u32 {
        self.zones
    }
}

impl Ticket for DayPass {
    fn zones(&self) -> u32 {
        4
    }

    fn price_cents(&self) -> u32 {
        900
    }
}

/// The price of all the tickets in a slice.
pub fn total_cents<T: Ticket>(tickets: &[T]) -> u32 {
    let mut sum = 0;
    for ticket in tickets {
        sum += ticket.price_cents();
    }
    sum
}

/// Whether the pass is cheaper than buying the single ticket `rides` times.
pub fn pass_pays_off(pass: &impl Ticket, single: &impl Ticket, rides: u32) -> bool {
    pass.price_cents() < single.price_cents() * rides
}

/// A ticket that can be handed back.
pub trait Refundable: Ticket {
    /// Whether the ticket has been stamped.
    fn used(&self) -> bool;

    /// What the passenger gets back, in cents.
    fn refund_cents(&self) -> u32 {
        if self.used() {
            0
        } else {
            self.price_cents() - 100
        }
    }
}

impl Refundable for Single {
    fn used(&self) -> bool {
        self.used
    }
}
