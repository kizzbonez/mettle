// The example from the instructions.
let tracks = [
    Track::new("Intro", 45),
    Track::new("Harbour Lights", 215),
    Track::new("Slow Train", 372),
];

assert_eq!(total_seconds(&tracks), 632, "the playing time of the three tracks together");
assert_eq!(
    long_titles(&tracks, 200),
    ["Harbour Lights", "Slow Train"],
    "the titles of the tracks longer than 200 seconds"
);

assert_eq!(parse_lengths(&["45", "215"]), Ok(vec![45, 215]), "two texts that are both numbers");
assert!(
    parse_lengths(&["45", "three"]).is_err(),
    "a list in which the second text is a word gives an error"
);

// `collect` and every other iterator method come with `next`.
let levels: Vec<u32> = FadeOut::new(100, 30).collect();
assert_eq!(levels, [100, 70, 40, 10], "the volume levels of a fade-out from 100 in steps of 30");
assert_eq!(
    FadeOut::new(100, 30).filter(|level| *level >= 40).count(),
    3,
    "the number of levels of that fade-out that are 40 or louder"
);
