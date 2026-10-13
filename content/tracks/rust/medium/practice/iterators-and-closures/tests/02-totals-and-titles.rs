let none: [Track; 0] = [];
assert!(total_seconds(&none) == 0, "an empty playlist plays for 0 seconds");
assert!(long_titles(&none, 0).is_empty(), "an empty playlist has no long tracks");

let one = [Track::new("Solo", 301)];
assert!(total_seconds(&one) == 301, "a playlist of one track plays for as long as that track");

let tracks = vec![
    Track::new("Opening", 180),
    Track::new("Night Bus", 181),
    Track::new("Tea for Two", 60),
    Track::new("The Long Way Home", 544),
    Track::new("Coda", 179),
];
assert!(total_seconds(&tracks) == 1144, "every track counts toward the total, the first and the last included");

// Strictly longer than the limit, in playlist order.
assert!(
    long_titles(&tracks, 180) == ["Night Bus", "The Long Way Home"],
    "a track of exactly the limit is not long, and one second more is"
);
assert!(
    long_titles(&tracks, 179) == ["Opening", "Night Bus", "The Long Way Home"],
    "the long titles keep the order of the playlist"
);
assert!(
    long_titles(&tracks, 0) == ["Opening", "Night Bus", "Tea for Two", "The Long Way Home", "Coda"],
    "with a limit of 0 every track is long"
);
assert!(long_titles(&tracks, 544).is_empty(), "with the longest track as the limit no track is long");
assert!(long_titles(&tracks, 100_000).is_empty(), "with a huge limit no track is long");

// Titles are copied out whole. The playlist is only borrowed.
assert!(
    long_titles(&tracks, 500) == [String::from("The Long Way Home")],
    "a title of several words is returned whole, as an owned String"
);
assert!(tracks.len() == 5 && tracks[3] == Track::new("The Long Way Home", 544), "the playlist is left as it was");

// Two tracks may share a title.
let repeats = [Track::new("Reprise", 90), Track::new("Reprise", 95)];
assert!(
    long_titles(&repeats, 80) == ["Reprise", "Reprise"],
    "two long tracks with the same title are both listed"
);
