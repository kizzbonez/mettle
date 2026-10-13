//! Flat Share
//!
//! One shopping list with several owners. Every flatmate can add to it through
//! a shared reference, and a note on the fridge refers to it without owning it.

use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};

/// One person in the flat.
pub struct Flatmate {
    list: Rc<RefCell<Vec<String>>>,
    added: Cell<u32>,
}

impl Flatmate {
    /// A flatmate who shares `list` with everyone else who holds it.
    pub fn new(list: &Rc<RefCell<Vec<String>>>) -> Flatmate {
        Flatmate { list: Rc::clone(list), added: Cell::new(0) }
    }

    /// Puts `item` on the list unless it is there already. Says whether it was added.
    pub fn add(&self, item: &str) -> bool {
        // The reading guard is a temporary: it is gone at the end of this
        // statement, before the list is borrowed mutably below.
        let listed = self.list.borrow().iter().any(|entry| entry == item);
        if listed {
            return false;
        }
        self.list.borrow_mut().push(item.to_string());
        self.added.set(self.added.get() + 1);
        true
    }

    /// How many items this flatmate has added.
    pub fn added(&self) -> u32 {
        self.added.get()
    }
}

/// A note on the fridge door. It refers to the list but does not own it.
pub struct FridgeNote {
    list: Weak<RefCell<Vec<String>>>,
}

impl FridgeNote {
    /// A note about `list`.
    pub fn new(list: &Rc<RefCell<Vec<String>>>) -> FridgeNote {
        FridgeNote { list: Rc::downgrade(list) }
    }

    /// The number of items on the list, or `None` once the list is gone.
    pub fn items_left(&self) -> Option<usize> {
        let list = self.list.upgrade()?;
        let count = list.borrow().len();
        Some(count)
    }
}
