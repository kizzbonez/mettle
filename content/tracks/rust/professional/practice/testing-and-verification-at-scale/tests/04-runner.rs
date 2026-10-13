use std::cell::RefCell;
use std::collections::BTreeSet;

/// The input of a test case as the instructions define it, written out again
/// so that this test does not depend on your `sample`.
fn reference(seed: u64) -> Vec<u32> {
    let mut state = seed;
    let mut next = || {
        state = state.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1_442_695_040_888_963_407);
        (state >> 33) as u32
    };
    let len = next() % 31;
    (0..len).map(|_| next() % 10).collect()
}

/// A simple, obviously correct `unique_sorted`.
fn model(input: &[u32]) -> Vec<u32> {
    input.iter().copied().collect::<BTreeSet<u32>>().into_iter().collect()
}

/// The first seed from 1 to `cases` on which a candidate and the model disagree.
fn expected(candidate: impl Fn(&[u32]) -> Vec<u32>, cases: u64) -> Option<u64> {
    (1..=cases).find(|&seed| {
        let input = reference(seed);
        candidate(&input) != model(&input)
    })
}

// Correct implementations raise no alarm.
assert!(first_failure(model, 500).is_none(), "a correct implementation passes all 500 cases");
let sort_then_dedup = |input: &[u32]| {
    let mut values = input.to_vec();
    values.sort();
    values.dedup();
    values
};
assert!(
    first_failure(sort_then_dedup, 500).is_none(),
    "a second correct implementation, written differently, passes all 500 cases"
);

// The three pull requests of the starter.
assert!(
    first_failure(candidate_a, 500) == expected(candidate_a, 500),
    "pull request A fails at the first seed whose input has a repeated value that is not next to its twin"
);
assert!(
    first_failure(candidate_b, 500) == expected(candidate_b, 500),
    "pull request B fails at the first seed whose input has a gap between its smallest and largest value"
);
assert!(
    first_failure(candidate_c, 500) == expected(candidate_c, 500),
    "pull request C fails at the first seed whose input has a new value after its 24th"
);

// The number of cases is a limit, and the last case counts.
assert!(first_failure(candidate_a, 0).is_none(), "with no cases there is nothing to fail");
assert!(
    first_failure(candidate_c, 14).is_none(),
    "a bug that first shows at seed 15 is not found in 14 cases"
);
assert!(
    first_failure(candidate_c, 15) == Some(15),
    "the last seed, which is the number of cases itself, is tried too"
);

// Candidates you have not seen. Each breaks one part of the property, and
// some need an input that only a few seeds produce.
let loses_largest = |input: &[u32]| {
    let mut values = model(input);
    values.pop();
    values
};
assert!(
    first_failure(loses_largest, 500) == expected(loses_largest, 500),
    "a candidate that loses the largest value is caught at the first seed whose input has a value"
);

let replaces_largest = |input: &[u32]| {
    let mut values = model(input);
    if let Some(last) = values.last_mut() {
        *last = 10;
    }
    values
};
assert!(
    first_failure(replaces_largest, 500) == expected(replaces_largest, 500),
    "a candidate that returns the right number of values, one of them wrong, is caught"
);

let wrong_when_empty =|input: &[u32]| if input.is_empty() { vec![0] } else { model(input) };
assert!(
    expected(wrong_when_empty, 500).is_some()
        && first_failure(wrong_when_empty, 500) == expected(wrong_when_empty, 500),
    "a candidate that is only wrong for an empty input is caught at the first seed whose input is empty"
);

let decreasing = |input: &[u32]| {
    let mut values = model(input);
    values.reverse();
    values
};
assert!(
    first_failure(decreasing, 500) == expected(decreasing, 500),
    "a candidate that returns the right values in decreasing order is caught"
);

let keeps_one_twin = |input: &[u32]| {
    let mut values = input.to_vec();
    values.sort();
    let mut output = Vec::new();
    let mut index = 0;
    while index < values.len() {
        output.push(values[index]);
        // Skips one equal neighbour, so a value that occurs three times stays twice.
        index += if values.get(index + 1) == Some(&values[index]) { 2 } else { 1 };
    }
    output
};
assert!(
    first_failure(keeps_one_twin, 500) == expected(keeps_one_twin, 500),
    "a candidate that removes only one twin of each value is caught at the first seed with a value three times"
);

let wrong_when_full = |input: &[u32]| {
    let mut values = model(input);
    if input.len() > 28 {
        values.push(10);
    }
    values
};
assert!(
    expected(wrong_when_full, 500).is_some()
        && first_failure(wrong_when_full, 500) == expected(wrong_when_full, 500),
    "a candidate that invents a value only for the longest inputs is caught at the first such seed"
);

// The candidate is given the sample of each seed, in order.
let seen = RefCell::new(Vec::new());
let recording = |input: &[u32]| {
    seen.borrow_mut().push(input.to_vec());
    model(input)
};
assert!(first_failure(recording, 20).is_none(), "a correct candidate that records its inputs passes");
let mut seen = seen.into_inner();
seen.dedup();
let samples: Vec<Vec<u32>> = (1..=20).map(reference).collect();
assert!(
    seen == samples,
    "the candidate is run on the sample of every seed from 1 to the number of cases, in that order"
);
