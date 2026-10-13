use std::collections::BTreeSet;

// Outputs that are right.
assert!(holds(&[], &[]), "an empty output is right for an empty input");
assert!(holds(&[5], &[5]), "one value gives that value");
assert!(holds(&[4, 4, 4], &[4]), "a value repeated three times gives that value once");
assert!(holds(&[9, 0, 9, 3, 0], &[0, 3, 9]), "the different values, in increasing order");
assert!(holds(&[1, 2, 3], &[1, 2, 3]), "an input that is already unique and sorted is its own output");
assert!(
    holds(&[u32::MAX, 0, u32::MAX], &[0, u32::MAX]),
    "the smallest and the largest u32 are values like any other"
);

// Outputs that are not in strictly increasing order.
assert!(!holds(&[2, 1], &[2, 1]), "an output in decreasing order breaks the property");
assert!(!holds(&[1, 2, 3], &[1, 3, 2]), "an output with two values swapped breaks the property");
assert!(!holds(&[3, 1, 3], &[1, 3, 3]), "an output that holds a value twice breaks the property");
assert!(!holds(&[5, 5], &[5, 5]), "equal neighbours are not in increasing order");

// Outputs that lost a value of the input.
assert!(!holds(&[3, 1, 3], &[3]), "an output without the smallest value of the input breaks the property");
assert!(!holds(&[3, 1, 3], &[1]), "an output without the largest value of the input breaks the property");
assert!(!holds(&[1, 5, 9], &[1, 9]), "an output without a value from the middle breaks the property");
assert!(!holds(&[7], &[]), "an empty output is wrong for an input that has a value");

// Outputs that invented a value.
assert!(!holds(&[3, 1, 3], &[1, 2, 3]), "an output with a value the input never had breaks the property");
assert!(!holds(&[1, 9], &[1, 5, 9]), "a value between two real ones is still invented");
assert!(!holds(&[], &[0]), "any value is one too many for an empty input");
assert!(
    !holds(&[1, 2, 3], &[1, 2, 4]),
    "an output of the right length with one wrong value breaks the property"
);

// Many inputs: the right output always holds, and each kind of damage is seen.
let mut state = 2024_u64;
let mut next = || {
    state = state.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1_442_695_040_888_963_407);
    (state >> 33) as u32
};
for _ in 0..300 {
    let len = next() % 25 + 1;
    let input: Vec<u32> = (0..len).map(|_| next() % 12).collect();
    let right: Vec<u32> = input.iter().copied().collect::<BTreeSet<u32>>().into_iter().collect();
    assert!(holds(&input, &right), "the different values of an input in increasing order always hold");

    let mut lost = right.clone();
    lost.remove(next() as usize % lost.len());
    assert!(!holds(&input, &lost), "an output with any one value removed breaks the property");

    let mut repeated = right.clone();
    let at = next() as usize % repeated.len();
    repeated.insert(at, repeated[at]);
    assert!(!holds(&input, &repeated), "an output with any one value doubled breaks the property");

    let mut invented = right.clone();
    invented.push(100);
    assert!(!holds(&input, &invented), "an output with one extra value at the end breaks the property");

    if right.len() > 1 {
        let mut reversed = right.clone();
        reversed.reverse();
        assert!(!holds(&input, &reversed), "an output in decreasing order breaks the property");
    }
}
