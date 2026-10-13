//! Three Pull Requests
//!
//! A property check for `unique_sorted`, the function behind a photo
//! library's tag index: a deterministic generator of inputs, the property
//! that pins the function down, and a runner that reports the first seed
//! whose input breaks a candidate.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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
        // TODO 1: state = state * 6364136223846793005 + 1442695040888963407,
        //         wrapping around on overflow. Return the state shifted right
        //         by 33 bits.
        todo!("Lcg::next")
    }
}

/// The input of test case `seed`: up to 30 values, each from 0 to 9. Only ten
/// different values exist, so that repeated values are common.
pub fn sample(seed: u64) -> Vec<u32> {
    // TODO 2: a new `Lcg` for the seed. Its first number decides the length,
    //         each further number gives one value.
    todo!("sample")
}

/// The property of `unique_sorted`: `output` holds exactly the different
/// values of `input`, in increasing order.
pub fn holds(input: &[u32], output: &[u32]) -> bool {
    // TODO 3: three conditions. Leave one out and a broken candidate passes.
    todo!("holds")
}

/// Runs `candidate` on the samples of seeds 1 to `cases` and returns the
/// first seed whose result breaks the property.
pub fn first_failure(candidate: impl Fn(&[u32]) -> Vec<u32>, cases: u64) -> Option<u64> {
    // TODO 4: `sample`, `candidate`, `holds`, for one seed after another
    todo!("first_failure")
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
