//! Bike Rental
//!
//! One struct with an associated function and three methods. The form of
//! `self` in each signature says what the method does with the rental.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// One bicycle rental.
#[derive(Debug, Clone, PartialEq)]
pub struct Rental {
    // TODO 1: add the two fields, `rider` and then `hours`.
}

impl Rental {
    /// Builds a rental. Called as `Rental::new("Ada", 2)`.
    pub fn new(rider: &str, hours: u32) -> Self {
        // TODO 2: create the instance once the struct has its fields.
        todo!("Rental::new")
    }

    /// The price so far, in cents. Reads the rental.
    pub fn price_cents(&self) -> u32 {
        todo!("price_cents")
    }

    /// Adds hours. Changes the rental.
    pub fn extend(&mut self, extra_hours: u32) {
        todo!("extend")
    }

    /// The receipt line. Takes ownership, so the rental is gone afterwards.
    pub fn into_receipt(self) -> String {
        todo!("into_receipt")
    }
}
