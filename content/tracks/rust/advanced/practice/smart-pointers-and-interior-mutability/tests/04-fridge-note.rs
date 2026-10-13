use std::cell::RefCell;
use std::rc::Rc;

let list = Rc::new(RefCell::new(vec![String::from("salt"), String::from("tea")]));
let note = FridgeNote::new(&list);
assert!(Rc::strong_count(&list) == 1, "a note is not an owner of the list");
assert!(Rc::weak_count(&list) == 1, "a note refers to the list through one weak pointer");
assert!(note.items_left() == Some(2), "the note gives the number of items on a list that exists");

let mate = Flatmate::new(&list);
mate.add("jam");
assert!(note.items_left() == Some(3), "the note follows the list as it grows");

{
    let reading = list.borrow();
    assert!(
        note.items_left() == Some(reading.len()),
        "the note only reads the list, so it can be asked while somebody else is reading"
    );
}
assert!(Rc::strong_count(&list) == 2, "asking the note leaves no extra owner behind");

drop(list);
assert!(note.items_left() == Some(3), "the list still exists while one flatmate owns it");
drop(mate);
assert!(note.items_left() == None, "the note has nothing to say once the last owner is gone");
assert!(note.items_left() == None, "asking a second time gives the same answer");

// An empty list that exists is not the same as no list.
let empty: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
let note = FridgeNote::new(&empty);
assert!(note.items_left() == Some(0), "a list with nothing on it still exists");
