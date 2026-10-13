//! Flat Share
//!
//! One shopping list with several owners. Every flatmate can add to it through
//! a shared reference, and a note on the fridge refers to it without owning it.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

/// One person in the flat.
pub struct Flatmate {
    // TODO 1: two fields. A handle that makes this flatmate one more owner of
    //         the shared list, and a count of the items this flatmate has
    //         added, which `add` can change through `&self`.
}

impl Flatmate {
    /// A flatmate who shares `list` with everyone else who holds it.
    pub fn new(list: &Rc<RefCell<Vec<String>>>) -> Flatmate {
        todo!("Flatmate::new")
    }

    /// Puts `item` on the list unless it is there already. Says whether it was added.
    pub fn add(&self, item: &str) -> bool {
        // TODO 2: finish reading the list before you borrow it mutably
        todo!("Flatmate::add")
    }

    /// How many items this flatmate has added.
    pub fn added(&self) -> u32 {
        todo!("Flatmate::added")
    }
}

/// A note on the fridge door. It refers to the list but does not own it.
pub struct FridgeNote {
    // TODO 3: one field. The note must not keep the list alive.
}

impl FridgeNote {
    /// A note about `list`.
    pub fn new(list: &Rc<RefCell<Vec<String>>>) -> FridgeNote {
        todo!("FridgeNote::new")
    }

    /// The number of items on the list, or `None` once the list is gone.
    pub fn items_left(&self) -> Option<usize> {
        todo!("FridgeNote::items_left")
    }
}
