// The example from the instructions.
let news = "07:00 Morning News with Ada";
let quiz = "06:30 Early Quiz";

assert_eq!(earlier(news, quiz), "06:30 Early Quiz", "the earlier of a 07:00 line and a 06:30 line");
assert_eq!(host(news, " with "), "Ada", "the text after the marker in the news line");
assert_eq!(host(quiz, " with "), "", "the text after a marker that the quiz line does not contain");

let programme = Programme::new(news);
assert_eq!(programme.time(), "07:00", "the time of the news line");
assert_eq!(programme.title(), "Morning News with Ada", "the title of the news line");

// The result of `host` borrows from the line only, so the marker may be
// dropped first. This block builds only if the signature says so.
let line = String::from("19:30 Garden Hour with Bo");
let name;
{
    let marker = String::from(" with ");
    name = host(&line, &marker);
} // `marker` is dropped here
assert_eq!(name, "Bo", "the host of the garden line, used after the marker was dropped");

// A title is a slice of the line, so it may outlive the `Programme`.
let title;
{
    let programme = Programme::new(&line);
    title = programme.title();
} // `programme` is dropped here
assert_eq!(
    title,
    "Garden Hour with Bo",
    "the title of the garden line, used after the Programme was dropped"
);

// No copies: the results point into the text they were given.
assert!(
    std::ptr::eq(earlier(news, quiz).as_ptr(), quiz.as_ptr()),
    "the result of earlier is the argument itself, not a new string with the same text"
);
assert!(
    std::ptr::eq(title.as_ptr(), line[6..].as_ptr()),
    "the title is a slice of the line, not a new string with the same text"
);
