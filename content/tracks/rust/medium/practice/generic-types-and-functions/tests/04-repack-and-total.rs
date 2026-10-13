// Repacking keeps the label and swaps the contents, whatever their type.
let mut carton = Carton::new("bedroom 2");
carton.pack("pillow");
carton.pack("duvet");

let counted = carton.repack(vec![4_u32, 1]);
assert!(counted.label() == "bedroom 2", "repack keeps the label of the carton");
assert!(
    counted.items() == [4, 1],
    "after repack the carton holds the new items only, in the order they were given"
);

let weighed = counted.repack(vec![0.75, 3.5]);
assert!(weighed.label() == "bedroom 2", "the label survives a second repack");
assert!(weighed.items() == [0.75, 3.5], "the second repack replaces the contents again");
assert!(weighed.total_kg() == 4.25, "total_kg adds up the weights in the carton");

let emptied = weighed.repack(Vec::<f64>::new());
assert!(emptied.items().is_empty(), "repacking with no items leaves an empty carton");
assert!(emptied.total_kg() == 0.0, "an empty carton of weights weighs nothing");

// Packing after a repack carries on from the new contents.
let mut tools = Carton::<&str>::new("shed").repack(vec![2.5]);
tools.pack(0.25);
tools.pack(10.0);
assert!(tools.items() == [2.5, 0.25, 10.0], "pack adds to the items that repack put in");
assert!(tools.total_kg() == 12.75, "total_kg counts every weight, the packed ones included");
assert!(
    largest(tools.items()) == Some(&10.0),
    "the heaviest item of a carton, found by handing its items to largest"
);

let mut single = Carton::new("piano");
single.pack(280.5);
assert!(single.total_kg() == 280.5, "a carton with one weight weighs exactly that much");
