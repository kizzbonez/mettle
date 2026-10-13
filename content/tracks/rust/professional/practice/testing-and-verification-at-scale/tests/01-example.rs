// The example from the instructions.

// The generator: a seed always gives the same numbers.
let mut rng = Lcg::new(1);
assert_eq!(rng.next(), 908_834_774, "the first number of the generator with seed 1");
assert_eq!(rng.next(), 1_093_944_153, "the second number of the generator with seed 1");

// The first number decides the length, each further number one value.
assert_eq!(sample(2), vec![2, 6, 4, 5, 9, 8, 8, 5, 2], "the input of test case 2");

// The property, on an input with a repeated value.
assert!(holds(&[3, 1, 3], &[1, 3]), "the right output for the input 3, 1, 3");
assert!(!holds(&[3, 1, 3], &[1, 3, 3]), "an output that keeps a value twice");
assert!(!holds(&[3, 1, 3], &[3]), "an output that lost a value of the input");
assert!(!holds(&[3, 1, 3], &[1, 2, 3]), "an output with a value the input never had");

// The runner: the first seed whose input shows the bug.
assert_eq!(first_failure(candidate_a, 500), Some(1), "the first failing seed of pull request A");
assert_eq!(
    first_failure(candidate_c, 10),
    None,
    "pull request C in ten cases, which are too few to show its bug"
);
assert_eq!(
    first_failure(candidate_c, 500),
    Some(15),
    "the first failing seed of pull request C in 500 cases"
);
