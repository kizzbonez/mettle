// The test owns every value and only lends it to your functions, so it can
// still read each one after the call.
let mut score = 10;
add_points(&mut score, 5);
assert_eq!(score, 15, "a score of 10 after 5 more points");

let mut roster = String::from("");
sign_up(&mut roster, "Owls");
assert_eq!(roster, "Owls", "the roster after the first team signed up");
sign_up(&mut roster, "Foxes");
assert_eq!(roster, "Owls, Foxes", "the roster after a second team signed up");

let owls = String::from("Owls");
let foxes = String::from("Foxes");
assert_eq!(banner_width(&owls), 8, "the banner width for the name Owls");

assert_eq!(leader(&owls, 12, &foxes, 9), &owls, "the leader when the first team has more points");
assert_eq!(leader(&owls, 12, &foxes, 20), &foxes, "the leader when the second team has more points");

// Both names were only borrowed, so they are still here.
assert_eq!(owls, "Owls", "the first name after it was lent out");
assert_eq!(foxes, "Foxes", "the second name after it was lent out");
