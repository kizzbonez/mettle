The shopping list is an `Rc<RefCell<Vec<String>>>`. Choose the private fields of `Flatmate` and
`FridgeNote` yourself, and keep the signatures as they are. Every method takes `&self`.

1. `Flatmate::new(list: &Rc<RefCell<Vec<String>>>) -> Flatmate` makes the flatmate one more
   owner of the list it is given. It is the same list, not a copy: `Rc::strong_count` goes up
   by one, and down again when the flatmate is dropped.
2. `add(&self, item: &str) -> bool` puts an item on the shared list.
   - If the list already contains exactly this text, nothing changes and the answer is `false`.
     Items are compared as written, so `"milk"` and `"Milk"` are two items.
   - Otherwise the item goes to the end of the list, this flatmate's own count goes up by one,
     and the answer is `true`.
3. `added(&self) -> u32` is the number of items this flatmate has added. A refused item does
   not count.
4. `FridgeNote::new(list: &Rc<RefCell<Vec<String>>>) -> FridgeNote` writes a note that refers
   to the list **without owning it**: the strong count stays as it was.
5. `items_left(&self) -> Option<usize>` is `Some(n)` with the number of items on the list while
   the list still has an owner, and `None` once every owner is gone. It only reads the list, so
   it also works while somebody else is reading it.

Example:

```rust
let list = Rc::new(RefCell::new(Vec::new()));
let ada = Flatmate::new(&list);
let lin = Flatmate::new(&list);
Rc::strong_count(&list)        // 3: `list`, Ada and Lin

ada.add("milk")                // true
lin.add("milk")                // false, it is on the list already
lin.add("rice")                // true
list.borrow()                  // ["milk", "rice"]
ada.added()                    // 1
lin.added()                    // 1

let note = FridgeNote::new(&list);
Rc::strong_count(&list)        // still 3
note.items_left()              // Some(2)

drop(ada);
drop(lin);
drop(list);
note.items_left()              // None: the list is gone
```

**Tip:** a `RefCell` panics with "already borrowed" when a reading guard is still alive at the
moment you ask for a mutable borrow. Keep what you learned from reading in a plain variable.
