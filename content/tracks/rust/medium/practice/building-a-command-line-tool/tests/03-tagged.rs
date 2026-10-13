let text = "\
water plants #home
buy bread #shop

#shop buy nails
go shopping #shopping
sell bike #Shop
post parcel #post #shop
email#shop support
buy glue #shop";

// Line numbers count every line, the empty one and the ones without the tag included.
assert!(
    tagged(text, "shop", 10) == [(2, "buy bread #shop"), (4, "#shop buy nails"), (7, "post parcel #post #shop"), (9, "buy glue #shop")],
    "the tasks whose words include exactly #shop, each with the number of its line in the text"
);

// A word has to be the tag exactly.
assert!(
    tagged(text, "shopping", 10) == [(5, "go shopping #shopping")],
    "a longer tag that starts with the same letters is a different tag"
);
assert!(tagged(text, "Shop", 10) == [(6, "sell bike #Shop")], "capital letters make a different tag");
assert!(tagged(text, "home", 10) == [(1, "water plants #home")], "the first line has the number 1");
assert!(
    tagged(text, "post", 10) == [(7, "post parcel #post #shop")],
    "a task with two tags is found by either one, and the word post without # does not count"
);
assert!(tagged(text, "garden", 10).is_empty(), "a tag that no task carries gives an empty list");
assert!(tagged(text, "sho", 10).is_empty(), "the beginning of a tag is not the tag");

// The limit.
assert!(
    tagged(text, "shop", 2) == [(2, "buy bread #shop"), (4, "#shop buy nails")],
    "the limit keeps the first tasks, in the order of the text"
);
assert!(tagged(text, "shop", 1) == [(2, "buy bread #shop")], "a limit of 1 keeps the first task only");
assert!(tagged(text, "shop", 4).len() == 4, "a limit equal to the number of tagged tasks keeps them all");
assert!(tagged(text, "shop", 0).is_empty(), "a limit of 0 keeps nothing");

// Texts of other shapes.
assert!(tagged("", "shop", 5).is_empty(), "an empty text has no tasks");
assert!(
    tagged("one #a\ntwo #a\n", "a", 5) == [(1, "one #a"), (2, "two #a")],
    "a newline at the end of the text does not add a task"
);
assert!(
    tagged("tidy\tdesk\t#home", "home", 5) == [(1, "tidy\tdesk\t#home")],
    "words may be separated by tabs, and the task is returned as the line it was"
);
