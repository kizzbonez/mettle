//! Tram Tickets
//!
//! A trait that says what every ticket can do, two types that implement it,
//! and generic functions that work for any ticket, including kinds that are
//! written later.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// What every kind of ticket can do.
pub trait Ticket {
    /// How many zones the ticket covers. Required: every type writes it.
    fn zones(&self) -> u32;

    /// The price in cents. A default, built on the required method.
    fn price_cents(&self) -> u32 {
        todo!("Ticket::price_cents")
    }

    /// The line printed on the ticket. A default as well.
    fn label(&self) -> String {
        todo!("Ticket::label")
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
        todo!("Single::zones")
    }
}

impl Ticket for DayPass {
    fn zones(&self) -> u32 {
        todo!("DayPass::zones")
    }

    // TODO 2: a day pass has a price of its own. Replace the default here.
}

/// The price of all the tickets in a slice.
// TODO 3: add the bound that lets the body ask a `T` for its price.
pub fn total_cents<T>(tickets: &[T]) -> u32 {
    todo!("total_cents")
}

/// Whether the pass is cheaper than buying the single ticket `rides` times.
// TODO 4: add a bound for each of the two types.
pub fn pass_pays_off<P, S>(pass: &P, single: &S, rides: u32) -> bool {
    todo!("pass_pays_off")
}

/// A ticket that can be handed back.
// TODO 5: every refundable ticket is a ticket. Say so with a supertrait.
pub trait Refundable {
    /// Whether the ticket has been stamped.
    fn used(&self) -> bool;

    /// What the passenger gets back, in cents.
    fn refund_cents(&self) -> u32 {
        todo!("Refundable::refund_cents")
    }
}

impl Refundable for Single {
    fn used(&self) -> bool {
        todo!("Single::used")
    }
}
