use std::panic;

// Runs a piece of code that is expected to panic and returns the panic
// message, or None if it did not panic. The usual report of a panic is
// switched off meanwhile, so that an expected panic leaves no trace.
fn panic_message<F: FnOnce() + panic::UnwindSafe>(body: F) -> Option<String> {
    panic::set_hook(Box::new(|_| {}));
    let outcome = panic::catch_unwind(body);
    let _ = panic::take_hook();
    let payload = outcome.err()?;
    let text = payload.downcast_ref::<String>().cloned();
    Some(text.or_else(|| payload.downcast_ref::<&str>().map(|text| text.to_string())).unwrap_or_default())
}

// The example from the instructions.
assert_eq!(pedal("boost").map(|effect| effect(5)), Some(15), "a level of 5 through the pedal called boost");
assert_eq!(pedal("wah").is_none(), true, "whether there is no pedal called wah");

assert_eq!(play(&["boost", "double"], 1), 22, "a level of 1 through boost and then double");
assert_eq!(
    panic_message(|| {
        play(&["boost", "wah"], 1);
    }),
    Some(String::from("no pedal called wah")),
    "the panic message when a row of pedals names one that does not exist"
);

let clip = dial("clip", 50);
assert_eq!(clip(80), 50, "a level of 80 through a clip pedal set to 50");
assert_eq!(clip(30), 30, "a level of 30 through the same clip pedal");
assert_eq!(dial("gain", -4)(10), 6, "a level of 10 through a gain pedal set to -4");
assert_eq!(dial("gate", 10)(9), 0, "a level of 9 through a gate pedal set to 10");
assert_eq!(dial("tremolo", 7)(42), 42, "a level of 42 through a pedal of an unknown kind");
