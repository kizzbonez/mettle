// Each name gives the stomp box of that name.
assert!(pedal("boost").map(|effect| effect(5)) == Some(15), "the name boost gives the function boost");
assert!(pedal("double").map(|effect| effect(-3)) == Some(-6), "the name double gives the function double");
assert!(pedal("invert").map(|effect| effect(8)) == Some(-8), "the name invert gives the function invert");
assert!(pedal("mute").map(|effect| effect(99)) == Some(0), "the name mute gives the function mute");

// Anything else gives None.
for unknown in ["wah", "", "Boost", "MUTE", "boost ", " double", "boostdouble", "gain"] {
    assert!(pedal(unknown).is_none(), "a name that is not exactly one of the four gives None");
}

// What comes back is a plain `fn` pointer: it has the same type as the
// functions themselves and as a closure that captures nothing.
let row: [fn(i32) -> i32; 4] = [
    pedal("double").unwrap_or(mute),
    boost,
    |level| level - 1,
    pedal("invert").unwrap_or(mute),
];
let mut level = 4;
for effect in row {
    level = effect(level);
}
assert!(level == -17, "a pedal that was looked up works in one array with functions and a closure that captures nothing");

// The same pointer can be called as often as needed.
let twice = pedal("double").unwrap_or(mute);
assert!(twice(twice(twice(1))) == 8, "a pedal that was looked up once can be used again and again");
