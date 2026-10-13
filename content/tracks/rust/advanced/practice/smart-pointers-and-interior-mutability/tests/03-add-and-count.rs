use std::cell::RefCell;
use std::rc::Rc;

let list = Rc::new(RefCell::new(Vec::new()));
let ada = Flatmate::new(&list);
let lin = Flatmate::new(&list);
assert!(ada.added() == 0 && lin.added() == 0, "a new flatmate has added nothing yet");

assert!(ada.add("bread") == true, "an item that is not on the list is added");
assert!(ada.add("bread") == false, "the same flatmate adding the same item again is refused");
assert!(lin.add("bread") == false, "another flatmate adding an item that is on the list is refused");
assert!(list.borrow().len() == 1, "a refused item is not put on the list a second time");

assert!(
    ada.add("Bread") == true,
    "items are compared exactly as written, so a capital letter makes a different item"
);
assert!(ada.added() == 2, "a flatmate's count goes up once for every item that was really added");
assert!(lin.added() == 0, "a refused item is not counted");

// `add` and `added` take `&self`: a shared reference is enough.
let borrowed: &Flatmate = &lin;
assert!(borrowed.add("plums") == true, "an item can be added through a shared reference to a flatmate");
assert!(borrowed.added() == 1 && ada.added() == 2, "each flatmate has a count of their own");

for number in 0..40 {
    let item = format!("tin {number}");
    ada.add(&item);
    lin.add(&item);
}
assert!(ada.added() == 42, "forty more items, each added by the flatmate who asked first");
assert!(lin.added() == 1, "forty items that were on the list already change nothing for the second flatmate");
assert!(list.borrow().len() == 43, "the list holds every item exactly once");
assert!(
    list.borrow().last().map(|item| item.as_str()) == Some("tin 39"),
    "the newest item is at the end of the list"
);
assert!(list.try_borrow_mut().is_ok(), "no borrow of the list is left open once add has returned");
