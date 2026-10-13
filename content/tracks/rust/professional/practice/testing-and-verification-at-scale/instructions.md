`unique_sorted(input: &[u32]) -> Vec<u32>` must return the different values of its input in
increasing order. The starter holds three attempts at it, `candidate_a`, `candidate_b` and
`candidate_c`. Each has a bug, and you do not repair them. You write the property check that
exposes them: four functions.

1. `Lcg::next(&mut self) -> u32` is a deterministic generator. Each call first replaces the
   state with `state * 6364136223846793005 + 1442695040888963407`, wrapping around on
   overflow, and then returns the new state shifted right by 33 bits, as a `u32`.
2. `sample(seed: u64) -> Vec<u32>` is the input of test case `seed`. Create `Lcg::new(seed)`.
   Its first number, modulo 31, is the length. Each further number, modulo 10, is one value.
   So an input has 0 to 30 values, each from 0 to 9.
3. `holds(input: &[u32], output: &[u32]) -> bool` is the property. It is `true` exactly when
   all three of these are true:
   - `output` is in strictly increasing order, which also means no value appears twice;
   - every value of `output` occurs in `input`;
   - every value of `input` occurs in `output`.
4. `first_failure(candidate, cases: u64) -> Option<u64>` runs the check. For each seed from 1
   to `cases`, in that order and with `cases` included, it calls the candidate on
   `sample(seed)` and tests the result with `holds`. It returns the first seed for which the
   property does not hold, and `None` if every case passes. No candidate panics.

The generator draws from only ten values on purpose. Values taken from the whole range of a
`u32` would almost never repeat, and a test whose inputs have no repeated value says little
about a function that removes them.

The hidden tests also run `first_failure` on correct implementations, which must pass, and on
broken ones you have not seen. A property with a part missing, or a generator that never
produces an empty or a long input, lets some of those through.

Example:

```rust
let mut rng = Lcg::new(1);
rng.next()                          // 908834774
rng.next()                          // 1093944153

sample(2)                           // [2, 6, 4, 5, 9, 8, 8, 5, 2]

holds(&[3, 1, 3], &[1, 3])          // true
holds(&[3, 1, 3], &[1, 3, 3])       // false: 3 appears twice
holds(&[3, 1, 3], &[3])             // false: 1 was lost
holds(&[3, 1, 3], &[1, 2, 3])       // false: 2 was never in the input

first_failure(candidate_a, 500)     // Some(1)
first_failure(candidate_c, 10)      // None: ten cases are too few to show this bug
first_failure(candidate_c, 500)     // Some(15)
```

`sample(15)` replays the failure of `candidate_c` whenever you want to look at it. That is
what the seed is for.

**Tip:** this build panics when an integer overflows, so `*` and `+` are the wrong tools for
step 1. Use `wrapping_mul` and `wrapping_add`.
