//! Parcel Counter
//!
//! A post office in three modules: `counter`, its child `counter::rates`,
//! and `desk` beside them. What is marked `pub` decides what the rest of the
//! program may use, and paths say where each item lives.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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
            todo!("Parcel::new")
        }

        /// The weight in grams.
        pub fn grams(&self) -> u32 {
            todo!("grams")
        }
    }

    /// The weight band of a parcel: 1, 2 or 3. Private on purpose.
    fn band(grams: u32) -> u32 {
        todo!("band")
    }

    pub mod rates {
        /// The postage in cents for the parcel's weight band.
        pub fn postage(parcel: &super::Parcel) -> u32 {
            // TODO 3: ask the parent module for the band with `super::`.
            todo!("postage")
        }
    }
}

pub mod desk {
    // TODO 4: give this module a `use` line of its own, or write full paths
    // in the body of `receipt`.

    /// One line for the customer's receipt.
    pub fn receipt(parcel: &crate::counter::Parcel) -> String {
        todo!("receipt")
    }
}

// TODO 5: replace this stand-in function with a re-export of
// `counter::rates::postage`.
pub fn postage(parcel: &counter::Parcel) -> u32 {
    todo!("re-export postage")
}
