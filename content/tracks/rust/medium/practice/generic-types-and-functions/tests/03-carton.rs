// A new carton is empty.
let empty: Carton<u32> = Carton::new("spare");
assert!(empty.label() == "spare", "new stores the label it was given");
assert!(empty.items().is_empty(), "a new carton holds no items");

// Items stay in packing order.
let mut books = Carton::new("study, top shelf");
books.pack(String::from("atlas"));
books.pack(String::from("dictionary"));
books.pack(String::from("cookbook"));
assert!(
    books.items() == [String::from("atlas"), String::from("dictionary"), String::from("cookbook")],
    "pack adds each item after the ones already there"
);
assert!(books.label() == "study, top shelf", "a label with a comma and spaces is kept whole");
assert!(books.items().len() == 3, "reading the items does not change the carton");

// Two cartons do not share their contents.
let mut hall = Carton::new("hall");
let mut attic = Carton::new("attic");
hall.pack(1);
attic.pack(2);
hall.pack(3);
assert!(hall.items() == [1, 3] && attic.items() == [2], "every carton has its own items");

// `impl<T>` promises the methods for every type, even one with no traits.
struct Lamp;
let mut fragile = Carton::new("fragile");
fragile.pack(Lamp);
fragile.pack(Lamp);
assert!(fragile.items().len() == 2, "a carton holds items of a type that has no traits at all");

// Tuples are a type like any other.
let mut mixed = Carton::new("mixed");
mixed.pack(("vase", 2));
assert!(mixed.items() == [("vase", 2)], "a carton holds pairs as well");
