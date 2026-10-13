let line = "17:45 Sports Round-up";
let programme = Programme::new(line);
assert!(programme.time() == "17:45", "the time is the text before the first space");
assert!(programme.title() == "Sports Round-up", "the title is the text after the first space");
assert!(
    programme.time() == "17:45" && programme.title() == "Sports Round-up",
    "reading the time and the title does not change the programme"
);

// Only the first space splits the line.
let long = Programme::new("22:10 The Very Late Show");
assert!(long.time() == "22:10", "the time stops at the first space");
assert!(long.title() == "The Very Late Show", "the title keeps the spaces that come after the first one");

// A line with no space.
let bare = Programme::new("05:00");
assert!(bare.time() == "05:00", "for a line with no space the time is the whole line");
assert!(bare.title() == "", "for a line with no space the title is empty");

// The struct borrows the line, and its results are slices of that line.
assert!(
    std::ptr::eq(programme.time().as_ptr(), line.as_ptr()),
    "the time points at the start of the line, it is not a new string"
);
assert!(
    std::ptr::eq(programme.title().as_ptr(), line[6..].as_ptr()),
    "the title points into the line, it is not a new string"
);

// Results may outlive the Programme they came from.
let guide = String::from("07:00 Morning News\n08:15 Breakfast Show");
let mut times = Vec::new();
let mut titles = Vec::new();
for entry in guide.lines() {
    let programme = Programme::new(entry);
    times.push(programme.time());
    titles.push(programme.title());
} // each `programme` is dropped at the end of its turn
assert!(times == ["07:00", "08:15"], "the times of two programmes, used after the programmes were dropped");
assert!(
    titles == ["Morning News", "Breakfast Show"],
    "the titles of two programmes, used after the programmes were dropped"
);
assert!(
    std::ptr::eq(times[1].as_ptr(), guide[19..].as_ptr()),
    "a time taken from the second line points into the guide that owns the text"
);

// Two programmes can share one line.
let first = Programme::new(line);
let second = Programme::new(line);
assert!(first.title() == second.title(), "two programmes may borrow the same line at once");
