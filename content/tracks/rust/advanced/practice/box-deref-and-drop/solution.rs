//! Left Luggage
//!
//! Bags packed inside bags, and numbered lockers that hold them. A locker can
//! be used like the bag inside it, and says so when it is given back.

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
    Bag::Packed(weight, Box::new(inner))
}

/// The weight of a bag with everything packed inside it.
pub fn total_weight(bag: &Bag) -> u32 {
    match bag {
        Bag::Empty(weight) => *weight,
        // `inner` is a `&Box<Bag>`. Deref coercion turns it into a `&Bag`.
        Bag::Packed(weight, inner) => weight + total_weight(inner),
    }
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
        &self.bag
    }
}

impl Drop for Locker {
    fn drop(&mut self) {
        println!("locker {} is free", self.number);
    }
}

/// Stores two bags, reports their weight, and gives locker 1 back early.
pub fn first_pickup(early: Bag, late: Bag) {
    let first = Locker::new(1, early);
    let second = Locker::new(2, late);
    println!("stored {} g", total_weight(&first) + total_weight(&second));
    drop(first);
    println!("one left");
    // `second` is dropped here, at the end of its scope.
}
