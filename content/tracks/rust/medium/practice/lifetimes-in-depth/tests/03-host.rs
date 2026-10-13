let line = "10:00 Tea Time with Mia";

assert!(host(line, " with ") == "Mia", "the text after the marker");
assert!(host(line, "Tea ") == "Time with Mia", "the result runs from the end of the marker to the end of the line");
assert!(host(line, "10:00 ") == "Tea Time with Mia", "a marker at the very start leaves the rest of the line");
assert!(host(line, "Mia") == "", "a marker at the very end leaves nothing after it");
assert!(host(line, line) == "", "a marker that is the whole line leaves nothing after it");

// No marker in the line.
assert!(host(line, " and ") == "", "a line without the marker gives the empty text");
assert!(host(line, "WITH") == "", "the marker must match letter for letter, capitals included");
assert!(host("", " with ") == "", "an empty line does not contain the marker");

// The first occurrence counts.
assert!(
    host("14:00 Duets with Cy with Di", " with ") == "Cy with Di",
    "when the marker occurs twice, the result starts after the first occurrence"
);
assert!(
    host("15:00 la la la", "la ") == "la la",
    "when the marker repeats back to back, the result starts after the first occurrence"
);

// The result is a slice of the line.
assert!(
    std::ptr::eq(host(line, " with ").as_ptr(), line[20..].as_ptr()),
    "the result points into the line, it is not a new string with the same text"
);

// The marker may be dropped while the result is still in use.
let guide = String::from("16:20 Book Club with Noor");
let name;
{
    let marker = String::from("Club with ");
    name = host(&guide, &marker);
}
assert!(name == "Noor", "the result is still valid after the marker was dropped");
