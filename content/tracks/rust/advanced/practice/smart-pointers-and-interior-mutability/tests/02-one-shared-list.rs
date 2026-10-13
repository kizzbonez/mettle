use std::cell::RefCell;
use std::rc::Rc;

let list = Rc::new(RefCell::new(vec![String::from("salt")]));

let first = Flatmate::new(&list);
assert!(Rc::strong_count(&list) == 2, "a new flatmate is one more owner of the list it was given");
let second = Flatmate::new(&list);
let third = Flatmate::new(&list);
assert!(Rc::strong_count(&list) == 4, "every flatmate is an owner of the same list");

first.add("tea");
third.add("jam");
second.add("oats");
first.add("eggs");
assert!(
    *list.borrow() == ["salt", "tea", "jam", "oats", "eggs"],
    "every flatmate writes on the one shared list: items go to its end, after what was there before"
);

// Something put on the list behind the flatmates' backs is there for all of them.
list.borrow_mut().push(String::from("soap"));
assert!(
    second.add("soap") == false && third.add("soap") == false,
    "an item that somebody else put on the list is on the list for every flatmate"
);

drop(second);
assert!(Rc::strong_count(&list) == 3, "a flatmate who moves out stops being an owner of the list");
assert!(list.borrow().len() == 6, "the list keeps its items when one flatmate moves out");

// The flatmates own the list: it lives as long as one of them does.
let watcher = Rc::downgrade(&list);
drop(list);
assert!(watcher.upgrade().is_some(), "the list stays alive while a flatmate still holds it");
assert!(first.add("rice"), "a flatmate can still add to the list after the first handle is gone");
assert!(
    watcher.upgrade().map(|list| list.borrow().len()) == Some(7),
    "the item went on the list that the other flatmate also holds"
);
drop(first);
drop(third);
assert!(watcher.upgrade().is_none(), "the list is freed when its last owner is gone");
