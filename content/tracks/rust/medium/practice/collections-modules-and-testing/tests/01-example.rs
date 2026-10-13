// The example from the instructions: your three tests are run against the
// correct function and against the three faulty versions in the starter.
use std::panic::{UnwindSafe, catch_unwind, set_hook, take_hook};

// Runs one of your tests and says whether it passed. If it panics, the
// message of the panic is printed above the result of this check.
fn passes(test: impl FnOnce() + UnwindSafe) -> bool {
    catch_unwind(test).is_ok()
}

// Runs one of your tests where a failure is expected, and says whether it
// failed. The panic is the wanted outcome, so its message is not printed.
fn fails(test: impl FnOnce() + UnwindSafe) -> bool {
    let hook = take_hook();
    set_hook(Box::new(|_| {}));
    let failed = catch_unwind(test).is_err();
    set_hook(hook);
    failed
}

// `test_edge_cases` may also fail by returning an `Err`.
fn edge_cases(version: fn(u32, u32) -> Result<u32, String>) {
    if let Err(message) = test_edge_cases(version) {
        panic!("test_edge_cases returned an Err: {message}");
    }
}

// Each test passes for the correct function.
assert!(
    passes(|| test_full_buses(fleet::buses_needed)),
    "test_full_buses passes when it is given the correct fleet::buses_needed"
);
assert!(
    passes(|| test_last_bus(fleet::buses_needed)),
    "test_last_bus passes when it is given the correct fleet::buses_needed"
);
assert!(
    passes(|| edge_cases(fleet::buses_needed)),
    "test_edge_cases passes when it is given the correct fleet::buses_needed"
);

// Each test fails for the faulty version it is aimed at.
assert!(
    fails(|| test_full_buses(faulty::always_one_extra)),
    "test_full_buses fails when it is given faulty::always_one_extra"
);
assert!(
    fails(|| test_last_bus(faulty::leaves_people_behind)),
    "test_last_bus fails when it is given faulty::leaves_people_behind"
);
assert!(
    fails(|| edge_cases(faulty::accepts_no_seats)),
    "test_edge_cases fails when it is given faulty::accepts_no_seats"
);
