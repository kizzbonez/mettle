// add_minutes: every element changes, and the order stays.
assert!(
    add_minutes(vec![1, 2, 3], 5) == vec![6, 7, 8],
    "every waiting time gets the extra minutes, first and last included"
);
assert!(
    add_minutes(vec![40, 0, 12], 0) == vec![40, 0, 12],
    "adding 0 minutes gives back the same times in the same order"
);
assert!(add_minutes(vec![], 30) == vec![], "an empty waiting room stays empty");
assert!(add_minutes(vec![7], 3) == vec![10], "a single waiting time is changed too");
assert!(
    add_minutes(add_minutes(vec![0, 10], 5), 5) == vec![10, 20],
    "the vector that comes back can be handed in again"
);

// long_waits: strictly longer than the limit, in the original order.
assert!(
    long_waits(&[50, 5, 40, 10, 30], 20) == vec![50, 40, 30],
    "the long waits keep the order they had, they are not sorted"
);
assert!(
    long_waits(&[20, 21, 19], 20) == vec![21],
    "a time equal to the limit is not longer than the limit"
);
assert!(long_waits(&[1, 2, 3], 60) == vec![], "no wait above the limit gives an empty vector");
assert!(long_waits(&[], 0) == vec![], "an empty list gives an empty vector");
assert!(
    long_waits(&[0, 1, 0], 0) == vec![1],
    "with a limit of 0, a wait of 0 is still not longer than the limit"
);
assert!(
    long_waits(&[33, 33], 10) == vec![33, 33],
    "two equal long waits are both kept"
);

// A vector can be lent as a slice, and the caller still has it afterwards.
let waits = vec![25, 5, 90];
let long = long_waits(&waits, 20);
assert!(
    long == vec![25, 90] && waits == vec![25, 5, 90],
    "the list that was lent out is unchanged, and the result is a new vector"
);
