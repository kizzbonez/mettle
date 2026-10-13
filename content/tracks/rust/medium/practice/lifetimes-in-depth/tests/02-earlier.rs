let breakfast = "08:15 Breakfast Show";
let jazz = "23:00 Night Jazz";
let noon = "12:00 Midday Report";
let lunch = "12:45 Lunch Concert";

assert!(earlier(breakfast, jazz) == breakfast, "the first argument is returned when it starts first");
assert!(earlier(jazz, breakfast) == breakfast, "the second argument is returned when it starts first");
assert!(earlier(noon, lunch) == noon, "within one hour the minutes decide");
assert!(earlier(lunch, noon) == noon, "within one hour the minutes decide, in either argument order");
assert!(
    earlier("09:59 Traffic", "10:00 Weather") == "09:59 Traffic",
    "one minute before the hour comes before the hour"
);
assert!(
    earlier("00:00 Midnight Chimes", "00:01 Late News") == "00:00 Midnight Chimes",
    "midnight is the earliest time of the day"
);

// The time decides, not the title.
assert!(
    earlier("18:00 Zebra Hour", "19:00 Aardvark Hour") == "18:00 Zebra Hour",
    "the titles play no part in the comparison"
);

// A tie goes to the first argument.
let story = "20:00 Story Time";
let debate = "20:00 Big Debate";
assert!(
    std::ptr::eq(earlier(story, debate).as_ptr(), story.as_ptr()),
    "when both lines have the same time, the result is the first argument"
);
assert!(
    std::ptr::eq(earlier(debate, story).as_ptr(), debate.as_ptr()),
    "when both lines have the same time, the result is the first argument, whichever title it has"
);

// The result is one of the arguments, not a copy of it.
assert!(
    std::ptr::eq(earlier(breakfast, jazz).as_ptr(), breakfast.as_ptr()),
    "the result points at the first argument when that one wins"
);
assert!(
    std::ptr::eq(earlier(jazz, breakfast).as_ptr(), breakfast.as_ptr()),
    "the result points at the second argument when that one wins"
);

// Two arguments that live for different lengths of time.
let morning = String::from("06:05 Farm Report");
{
    let evening = String::from("21:30 Radio Play");
    let first = earlier(&evening, &morning);
    assert!(first == "06:05 Farm Report", "two lines that are owned by different strings can be compared");
}
