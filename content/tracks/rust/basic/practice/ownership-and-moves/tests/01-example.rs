// Each block calls one of your functions and compares the result with the
// example in the instructions.
assert_eq!(new_tag("LIS"), "To: LIS", "the tag for the destination LIS");

assert_eq!(
    mark_fragile(String::from("To: LIS")),
    "To: LIS [fragile]",
    "the tag for LIS after it was marked as fragile"
);

let (original, copy) = copy_tag(String::from("To: OSL"));
assert_eq!(original, "To: OSL", "the first tag that copy_tag returns");
assert_eq!(copy, "To: OSL", "the second tag that copy_tag returns");

assert_eq!(prepare("OSL", true), "To: OSL [fragile]", "a prepared tag for a fragile suitcase");
assert_eq!(prepare("OSL", false), "To: OSL", "a prepared tag for an ordinary suitcase");
