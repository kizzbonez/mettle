use std::panic::{UnwindSafe, catch_unwind, set_hook, take_hook};

fn passes(test: impl FnOnce() + UnwindSafe) -> bool {
    catch_unwind(test).is_ok()
}

// A failure is the wanted outcome here, so the panic is not printed.
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

fn correct(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 {
        return Err(String::from("no seats"));
    }
    Ok(passengers.div_ceil(seats))
}

// A test that fails for everything catches nothing, so the test must first pass.
assert!(passes(|| edge_cases(correct)), "test_edge_cases passes for a correct version");
assert!(
    matches!(test_edge_cases(correct), Ok(())),
    "test_edge_cases returns Ok(()) when every check holds"
);

// No passengers.
fn at_least_one_bus(passengers: u32, seats: u32) -> Result<u32, String> {
    if passengers == 0 && seats != 0 { Ok(1) } else { correct(passengers, seats) }
}
fn refuses_an_empty_group(passengers: u32, seats: u32) -> Result<u32, String> {
    if passengers == 0 { Err(String::from("nobody is travelling")) } else { correct(passengers, seats) }
}
assert!(
    fails(|| edge_cases(at_least_one_bus)),
    "test_edge_cases fails for a version that books a bus for no passengers"
);
assert!(
    fails(|| edge_cases(refuses_an_empty_group)),
    "test_edge_cases fails for a version that returns an error for no passengers"
);

// No seats.
fn no_seats_no_buses(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 { Ok(0) } else { correct(passengers, seats) }
}
fn no_seats_a_bus_each(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 { Ok(passengers) } else { correct(passengers, seats) }
}
assert!(
    fails(|| edge_cases(no_seats_no_buses)),
    "test_edge_cases fails for a version that answers 0 buses when a bus has 0 seats"
);
assert!(
    fails(|| edge_cases(no_seats_a_bus_each)),
    "test_edge_cases fails for a version that answers with a number of buses when a bus has 0 seats"
);
