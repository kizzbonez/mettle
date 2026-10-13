/// One step of the generator as the instructions define it, written out again
/// so that this test does not depend on your `Lcg`.
fn step(state: &mut u64) -> u32 {
    *state = state
        .wrapping_mul(6_364_136_223_846_793_005)
        .wrapping_add(1_442_695_040_888_963_407);
    (*state >> 33) as u32
}

/// The input of a test case as the instructions define it.
fn reference(seed: u64) -> Vec<u32> {
    let mut state = seed;
    let len = step(&mut state) % 31;
    (0..len).map(|_| step(&mut state) % 10).collect()
}

// The numbers of the generator.
for seed in [0, 1, 2, 77, 1_000_003, u64::MAX] {
    let mut rng = Lcg::new(seed);
    let mut state = seed;
    for _ in 0..200 {
        assert!(
            rng.next() == step(&mut state),
            "the generator follows the formula for every seed and every step, and wraps around instead of overflowing"
        );
    }
}

// The same seed replays the same numbers.
let mut first = Lcg::new(42);
let mut second = Lcg::new(42);
let replayed = (0..50).all(|_| first.next() == second.next());
assert!(replayed, "two generators with the same seed give the same numbers");

let mut other = Lcg::new(43);
let mut again = Lcg::new(42);
let differs = (0..50).any(|_| other.next() != again.next());
assert!(differs, "generators with different seeds give different numbers");

// The inputs.
for seed in (0..=400).chain([u64::MAX - 1, u64::MAX]) {
    assert!(
        sample(seed) == reference(seed),
        "sample uses the first number of the seed's generator for the length and each further number for one value"
    );
}
assert!(sample(7) == sample(7), "the same seed gives the same input every time");

// What the recipe is for: inputs that reach the interesting cases.
let inputs: Vec<Vec<u32>> = (1..=500).map(sample).collect();
assert!(
    inputs.iter().all(|input| input.len() <= 30 && input.iter().all(|value| *value <= 9)),
    "an input has at most 30 values, and every value is from 0 to 9"
);
assert!(inputs.iter().any(|input| input.is_empty()), "500 inputs include an empty one");
assert!(inputs.iter().any(|input| input.len() == 30), "500 inputs include one of the full length");
let with_repeats = inputs
    .iter()
    .filter(|input| {
        let mut sorted = input.to_vec();
        sorted.sort();
        sorted.windows(2).any(|pair| pair[0] == pair[1])
    })
    .count();
assert!(
    with_repeats > 250,
    "most of the 500 inputs contain a repeated value, because there are only ten values to draw from"
);
