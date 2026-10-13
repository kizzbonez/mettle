//! Three Pull Requests
//!
//! A property check for `unique_sorted`, the function behind a photo
//! library's tag index: a deterministic generator of inputs, the property
//! that pins the function down, and a runner that reports the first seed
//! whose input breaks a candidate.

/// A tiny deterministic generator (a linear congruential generator). The same
/// seed always gives the same numbers, so a failure can be replayed.
pub struct Lcg {
    state: u64,
}

impl Lcg {
    pub fn new(seed: u64) -> Lcg {
        Lcg { state: seed }
    }

    /// Advances the state and returns the next number.
    pub fn next(&mut self) -> u32 {
        // The multiplication is meant to wrap around: a plain `*` would panic
        // on overflow in this build.
        self.state = self
            .state
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (self.state >> 33) as u32
    }
}

/// The input of test case `seed`: up to 30 values, each from 0 to 9. Only ten
/// different values exist, so that repeated values are common.
pub fn sample(seed: u64) -> Vec<u32> {
    let mut rng = Lcg::new(seed);
    let len = rng.next() % 31;
    (0..len).map(|_| rng.next() % 10).collect()
}

/// The property of `unique_sorted`: `output` holds exactly the different
/// values of `input`, in increasing order.
pub fn holds(input: &[u32], output: &[u32]) -> bool {
    // Strictly increasing: sorted, and no value twice.
    let increasing = output.windows(2).all(|pair| pair[0] < pair[1]);
    let nothing_invented = output.iter().all(|value| input.contains(value));
    let nothing_lost = input.iter().all(|value| output.contains(value));
    increasing && nothing_invented && nothing_lost
}

/// Runs `candidate` on the samples of seeds 1 to `cases` and returns the
/// first seed whose result breaks the property.
pub fn first_failure(candidate: impl Fn(&[u32]) -> Vec<u32>, cases: u64) -> Option<u64> {
    (1..=cases).find(|&seed| {
        let input = sample(seed);
        !holds(&input, &candidate(&input))
    })
}

// ---- The three pull requests. Each has a bug. Leave them as they are. ----

/// Pull request A.
pub fn candidate_a(input: &[u32]) -> Vec<u32> {
    let mut values = input.to_vec();
    values.dedup();
    values.sort();
    values
}

/// Pull request B.
pub fn candidate_b(input: &[u32]) -> Vec<u32> {
    let (Some(&low), Some(&high)) = (input.iter().min(), input.iter().max()) else {
        return Vec::new();
    };
    (low..=high).collect()
}

/// Pull request C. Its description says: "No photo has more than 24 tags."
pub fn candidate_c(input: &[u32]) -> Vec<u32> {
    let mut values: Vec<u32> = input.iter().copied().take(24).collect();
    values.sort();
    values.dedup();
    values
}
