//! Parcel Counter
//!
//! A post office in three modules: `counter`, its child `counter::rates`,
//! and `desk` beside them. What is marked `pub` decides what the rest of the
//! program may use, and paths say where each item lives.

pub mod counter {
    /// A parcel that was weighed at the counter.
    #[derive(Debug, Clone, PartialEq)]
    pub struct Parcel {
        pub label: String,
        grams: u32, // private: only code inside `counter` can touch it
    }

    impl Parcel {
        /// Builds a parcel. Called as `counter::Parcel::new("books", 1200)`.
        pub fn new(label: &str, grams: u32) -> Parcel {
            Parcel { label: label.to_string(), grams }
        }

        /// The weight in grams.
        pub fn grams(&self) -> u32 {
            self.grams
        }
    }

    /// The weight band of a parcel: 1, 2 or 3. Private on purpose.
    fn band(grams: u32) -> u32 {
        if grams <= 500 {
            1
        } else if grams <= 2000 {
            2
        } else {
            3
        }
    }

    pub mod rates {
        use super::Parcel;

        /// The postage in cents for the parcel's weight band.
        pub fn postage(parcel: &Parcel) -> u32 {
            // A child module may use its parent's private items.
            match super::band(parcel.grams()) {
                1 => 350,
                2 => 590,
                _ => 990,
            }
        }
    }
}

pub mod desk {
    use crate::counter::{Parcel, rates};

    /// One line for the customer's receipt.
    pub fn receipt(parcel: &Parcel) -> String {
        format!("{}: {} g, {} cents", parcel.label, parcel.grams(), rates::postage(parcel))
    }
}

pub use counter::rates::postage;
