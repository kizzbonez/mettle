use std::panic;

// Runs a piece of code and returns the message it panicked with, or None if
// it did not panic. The usual report of a panic is switched off meanwhile.
fn panic_message<F: FnOnce() + panic::UnwindSafe>(body: F) -> Option<String> {
    panic::set_hook(Box::new(|_| {}));
    let outcome = panic::catch_unwind(body);
    let _ = panic::take_hook();
    let payload = outcome.err()?;
    let text = payload.downcast_ref::<String>().cloned();
    Some(text.or_else(|| payload.downcast_ref::<&str>().map(|text| text.to_string())).unwrap_or_default())
}

// Rows of pedals that all exist.
assert!(play(&[], 7) == 7, "with no pedals the level comes back unchanged");
assert!(play(&["boost"], 7) == 17, "a single pedal");
assert!(play(&["boost", "double"], 1) == 22, "the pedals are used in the order of the slice");
assert!(play(&["double", "boost"], 1) == 12, "the same two pedals the other way round give another level");
assert!(play(&["double", "double", "double"], 3) == 24, "a pedal can appear more than once");
assert!(play(&["boost", "mute", "boost", "invert"], 50) == -10, "the result of each pedal is the input of the next");
assert!(
    play(&["invert", "boost", "double", "invert", "boost", "boost"], 4) == 8,
    "a longer row is played from the first pedal to the last"
);

// blow_fuse by itself.
assert!(
    panic_message(|| blow_fuse("fuzz")) == Some(String::from("no pedal called fuzz")),
    "blow_fuse panics with the words no pedal called and then the name"
);
assert!(
    panic_message(|| blow_fuse("big muff")) == Some(String::from("no pedal called big muff")),
    "the name in the message is the one blow_fuse was given"
);

// The return type `!` fits where an i32 is expected.
let outcome = panic_message(|| {
    let level: i32 = match pedal("wah") {
        Some(effect) => effect(1),
        None => blow_fuse("wah"),
    };
    assert!(level == 0, "this line is never reached");
});
assert!(outcome == Some(String::from("no pedal called wah")), "blow_fuse can stand in a match arm of any type");

// play blows the fuse for the name it cannot find, wherever it stands.
assert!(
    panic_message(|| {
        play(&["wah", "boost"], 1);
    }) == Some(String::from("no pedal called wah")),
    "an unknown name at the start of the row blows the fuse with that name"
);
assert!(
    panic_message(|| {
        play(&["boost", "double", "chorus"], 1);
    }) == Some(String::from("no pedal called chorus")),
    "an unknown name at the end of the row blows the fuse with that name"
);
assert!(
    panic_message(|| {
        play(&["boost", "Mute", "phaser"], 1);
    }) == Some(String::from("no pedal called Mute")),
    "the fuse blows at the first name that pedal does not know, and names must match exactly"
);
assert!(
    panic_message(|| {
        play(&["boost", "double"], 1);
    }) == None,
    "a row of pedals that all exist does not panic"
);
