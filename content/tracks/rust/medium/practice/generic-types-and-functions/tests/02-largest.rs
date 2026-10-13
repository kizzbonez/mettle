// One definition, many types.
assert!(largest(&[3, 9, 4]) == Some(&9), "the largest of three integers, with the largest in the middle");
assert!(largest(&[12, 9, 4]) == Some(&12), "the largest item can be the first one");
assert!(largest(&[3, 9, 40]) == Some(&40), "the largest item can be the last one");
assert!(largest(&[-8, -2, -5]) == Some(&-2), "the largest of negative numbers is the one closest to zero");
assert!(largest(&[7]) == Some(&7), "a slice of one item has that item as its largest");
assert!(largest(&[2.5, 0.1, 9.75]) == Some(&9.75), "the largest of three floats");
assert!(largest(&['m', 'x', 'c']) == Some(&'x'), "the largest of three characters");
assert!(
    largest(&[String::from("pear"), String::from("fig"), String::from("plum")])
        == Some(&String::from("plum")),
    "the largest of three owned strings"
);

// Nothing to return.
assert!(largest::<i32>(&[]) == None, "an empty slice of integers has no largest item");
assert!(largest::<&str>(&[]) == None, "an empty slice of text has no largest item");

// The result is a reference into the slice, and ties go to the first.
let lengths = [4, 9, 9, 2, 9];
assert!(
    std::ptr::eq(largest(&lengths).unwrap(), &lengths[1]),
    "when several items are equally large, the reference points at the first of them"
);

// A type that can be compared, and nothing else: no Copy, no Clone, no Display.
#[derive(PartialEq, PartialOrd)]
struct Kilograms(f64);

let loads = [Kilograms(12.0), Kilograms(31.5), Kilograms(8.25)];
assert!(
    largest(&loads) == Some(&Kilograms(31.5)),
    "the largest item of a type that offers comparison and nothing more"
);
