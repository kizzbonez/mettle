//! Left Luggage
//!
//! Bags packed inside bags, and numbered lockers that hold them. A locker can
//! be used like the bag inside it, and says so when it is given back.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::ops::Deref;

/// A bag, which may have another bag packed inside it.
#[derive(Debug, PartialEq)]
pub enum Bag {
    /// A bag with nothing in it. The number is its weight in grams.
    Empty(u32),
    /// A bag with another bag inside: its own weight in grams, then that bag.
    Packed(u32, Box<Bag>),
}

/// Puts `inner` into a bag that weighs `weight` grams and returns the outer bag.
pub fn pack(weight: u32, inner: Bag) -> Bag {
    todo!("pack")
}

/// The weight of a bag with everything packed inside it.
pub fn total_weight(bag: &Bag) -> u32 {
    todo!("total_weight")
}

/// A numbered locker with one bag in it.
pub struct Locker {
    number: u32,
    bag: Bag,
}

impl Locker {
    /// Stores `bag` in the locker with this number.
    pub fn new(number: u32, bag: Bag) -> Locker {
        Locker { number, bag }
    }
}

impl Deref for Locker {
    type Target = Bag;

    fn deref(&self) -> &Bag {
        todo!("Locker::deref")
    }
}

impl Drop for Locker {
    fn drop(&mut self) {
        // TODO 4: print `locker N is free`, where N is this locker's number.
        // There is no `todo!` here on purpose: a panic inside `drop` would
        // hide what the test was really checking.
    }
}

/// Stores two bags, reports their weight, and gives locker 1 back early.
pub fn first_pickup(early: Bag, late: Bag) {
    todo!("first_pickup")
}
