//! Bike Rental
//!
//! One struct with an associated function and three methods. The form of
//! `self` in each signature says what the method does with the rental.

/// One bicycle rental.
#[derive(Debug, Clone, PartialEq)]
pub struct Rental {
    rider: String,
    hours: u32,
}

impl Rental {
    /// Builds a rental. Called as `Rental::new("Ada", 2)`.
    pub fn new(rider: &str, hours: u32) -> Self {
        Self { rider: rider.to_string(), hours }
    }

    /// The price so far, in cents. Reads the rental.
    pub fn price_cents(&self) -> u32 {
        300 + self.hours * 450
    }

    /// Adds hours. Changes the rental.
    pub fn extend(&mut self, extra_hours: u32) {
        self.hours += extra_hours;
    }

    /// The receipt line. Takes ownership, so the rental is gone afterwards.
    pub fn into_receipt(self) -> String {
        format!("{}: {} h, {} cents", self.rider, self.hours, self.price_cents())
    }
}
