use std::panic::{UnwindSafe, catch_unwind};

fn passes(test: impl FnOnce() + UnwindSafe) -> bool {
    catch_unwind(test).is_ok()
}

fn edge_cases(version: fn(u32, u32) -> Result<u32, String>) {
    if let Err(message) = test_edge_cases(version) {
        panic!("test_edge_cases returned an Err: {message}");
    }
}

// A correct version that is written another way and words its error differently.
fn adds_then_divides(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 {
        return Err(String::from("seats must not be 0"));
    }
    // In u64, so that the sum cannot overflow for any pair of u32 values.
    let buses = (u64::from(passengers) + u64::from(seats) - 1) / u64::from(seats);
    Ok(buses as u32)
}

// Another correct version, with an empty error message.
fn rounds_up(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 {
        Err(String::new())
    } else {
        Ok(passengers.div_ceil(seats))
    }
}

assert!(
    passes(|| test_full_buses(adds_then_divides)),
    "test_full_buses passes for a correct version that is written another way"
);
assert!(
    passes(|| test_last_bus(adds_then_divides)),
    "test_last_bus passes for a correct version that is written another way"
);
assert!(
    passes(|| edge_cases(adds_then_divides)),
    "test_edge_cases passes for a correct version whose error message has another wording"
);

assert!(
    passes(|| test_full_buses(rounds_up)),
    "test_full_buses passes for a second correct version"
);
assert!(
    passes(|| test_last_bus(rounds_up)),
    "test_last_bus passes for a second correct version"
);
assert!(
    passes(|| edge_cases(rounds_up)),
    "test_edge_cases passes for a correct version whose error message is empty"
);

// A test can be run more than once, with the same result.
assert!(
    passes(|| test_full_buses(rounds_up)) && passes(|| test_last_bus(rounds_up)) && passes(|| edge_cases(rounds_up)),
    "every test passes again when it is run a second time"
);
