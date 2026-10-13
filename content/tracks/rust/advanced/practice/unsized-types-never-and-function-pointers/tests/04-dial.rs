// gain
let gain = dial("gain", 5);
assert!(gain(1) == 6, "a gain pedal adds its amount to the level");
assert!(gain(-5) == 0 && gain(100) == 105, "the same gain pedal can be used for one level after another");
assert!(dial("gain", -30)(10) == -20, "a gain pedal with a negative amount turns the level down");
assert!(dial("gain", 0)(42) == 42, "a gain of zero changes nothing");

// clip
let clip = dial("clip", 50);
assert!(clip(80) == 50, "a clip pedal never lets through more than its amount");
assert!(clip(50) == 50, "a level that is exactly the amount passes a clip pedal as it is");
assert!(clip(49) == 49, "a level below the amount passes a clip pedal unchanged");
assert!(clip(-7) == -7, "a negative level is below the amount and passes a clip pedal unchanged");

// gate
let gate = dial("gate", 10);
assert!(gate(9) == 0, "a gate pedal turns a level below its amount into 0");
assert!(gate(10) == 10, "a level that is exactly the amount passes a gate pedal");
assert!(gate(11) == 11 && gate(500) == 500, "a level above the amount passes a gate pedal unchanged");
assert!(gate(-3) == 0, "a negative level is below the amount, so a gate pedal turns it into 0");

// any other kind
for kind in ["tremolo", "", "Gain", "clip ", "boost"] {
    let bypass = dial(kind, 99);
    assert!(
        bypass(42) == 42 && bypass(-1) == -1,
        "a kind that is not exactly gain, clip or gate lets every level through unchanged"
    );
}

// The closure owns what it needs: the text and the number it was built from
// are gone before it is called.
let late = {
    let kind = String::from("gain");
    let amount = 3;
    dial(&kind, amount)
};
assert!(late(4) == 7, "the closure still works after everything dial was called with is gone");

// Each call of dial makes a pedal with a setting of its own.
let low = dial("clip", 10);
let high = dial("clip", 90);
assert!(low(60) == 10 && high(60) == 60, "two pedals of one kind keep their own amounts");

// Closures and `fn` pointers side by side behind one trait object type.
let board: Vec<Box<dyn Fn(i32) -> i32>> = vec![
    Box::new(boost),
    dial("gain", 5),
    Box::new(pedal("double").unwrap_or(mute)),
    dial("clip", 30),
    dial("gate", 30),
    dial("nothing", 0),
];
let level = board.iter().fold(2, |level, effect| effect(level));
assert!(level == 30, "dial pedals work in one row with stomp boxes, each on the result of the one before");
