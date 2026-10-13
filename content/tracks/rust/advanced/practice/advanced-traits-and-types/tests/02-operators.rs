// Add.
assert!(Seconds(0) + Seconds(0) == Seconds(0), "nothing plus nothing");
assert!(Seconds(75) + Seconds(0) == Seconds(75), "adding a playing time of zero changes nothing");
assert!(Seconds(1) + Seconds(59) == Seconds(60), "the sum is kept in seconds, with no carrying into minutes");
assert!(
    Seconds(200) + Seconds(45) == Seconds(45) + Seconds(200),
    "the order of the two playing times does not matter"
);
assert!(
    Seconds(10) + Seconds(20) + Seconds(30) == Seconds(60),
    "the result of + is a Seconds again, so three playing times can be added in a row"
);

// `Seconds` is `Copy`, so both operands can be used again.
let intro = Seconds(12);
let song = Seconds(200);
let both = intro + song;
assert!(
    both == Seconds(212) && intro == Seconds(12) && song == Seconds(200),
    "adding does not change the two playing times that were added"
);

// Mul with a plain number on the right.
assert!(Seconds(90) * 1 == Seconds(90), "a track played once");
assert!(Seconds(90) * 2 == Seconds(180), "a track played twice");
assert!(Seconds(7) * 12 == Seconds(84), "a jingle played twelve times");
assert!(Seconds(90) * 0 == Seconds(0), "a track that is not played at all takes no time");
assert!(Seconds(0) * 9 == Seconds(0), "silence repeated is still silence");

// The two operators together.
assert!(
    (intro + song) * 2 == Seconds(424),
    "the result of + can be repeated with *"
);
assert!(
    intro + song * 3 == Seconds(612),
    "* binds more tightly than +, as it does for numbers"
);
assert!(
    (Seconds(30) * 4).to_string() == "2:00",
    "the result of * is a Seconds, so it prints as a playing time"
);
