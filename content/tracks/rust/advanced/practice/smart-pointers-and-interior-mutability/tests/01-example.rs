use std::cell::RefCell;
use std::rc::Rc;

// The example from the instructions, step by step.
let list = Rc::new(RefCell::new(Vec::new()));
let ada = Flatmate::new(&list);
let lin = Flatmate::new(&list);
assert_eq!(Rc::strong_count(&list), 3, "the owners of the list: this test, Ada and Lin");

assert_eq!(ada.add("milk"), true, "Ada adds milk to an empty list");
assert_eq!(lin.add("milk"), false, "Lin adds milk when it is on the list already");
assert_eq!(lin.add("rice"), true, "Lin adds rice");
assert_eq!(*list.borrow(), ["milk", "rice"], "the shared list after the three calls");
assert_eq!(ada.added(), 1, "the number of items Ada has added");
assert_eq!(lin.added(), 1, "the number of items Lin has added");

let note = FridgeNote::new(&list);
assert_eq!(Rc::strong_count(&list), 3, "the owners of the list after a note was written about it");
assert_eq!(note.items_left(), Some(2), "what the note says while the list exists");

drop(ada);
drop(lin);
drop(list);
assert_eq!(note.items_left(), None, "what the note says once every owner of the list is gone");
