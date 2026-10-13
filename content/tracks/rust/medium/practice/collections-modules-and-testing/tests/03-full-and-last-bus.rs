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

fn correct(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 {
        return Err(String::from("no seats"));
    }
    Ok(passengers.div_ceil(seats))
}

// A test that fails for everything catches nothing, so each test must first pass.
assert!(passes(|| test_full_buses(correct)), "test_full_buses passes for a correct version");
assert!(passes(|| test_last_bus(correct)), "test_last_bus passes for a correct version");

// Bugs in the cases that test_full_buses lists.
fn spare_bus_for_one_full_bus(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats != 0 && passengers == seats { Ok(2) } else { correct(passengers, seats) }
}
fn spare_bus_for_several_full_buses(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats != 0 && passengers > seats && passengers % seats == 0 {
        Ok(passengers / seats + 1)
    } else {
        correct(passengers, seats)
    }
}
assert!(
    fails(|| test_full_buses(spare_bus_for_one_full_bus)),
    "test_full_buses fails for a version that is wrong only when the passengers fill one bus exactly"
);
assert!(
    fails(|| test_full_buses(spare_bus_for_several_full_buses)),
    "test_full_buses fails for a version that is wrong only when the passengers fill several buses exactly"
);

// Bugs in the cases that test_last_bus lists.
fn forgets_a_single_passenger(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats > 1 && passengers % seats == 1 {
        Ok(passengers / seats)
    } else {
        correct(passengers, seats)
    }
}
fn no_bus_for_a_small_group(passengers: u32, seats: u32) -> Result<u32, String> {
    if passengers < seats { Ok(0) } else { correct(passengers, seats) }
}
fn rounds_down(passengers: u32, seats: u32) -> Result<u32, String> {
    if seats == 0 { Err(String::from("no seats")) } else { Ok(passengers / seats) }
}
assert!(
    fails(|| test_last_bus(forgets_a_single_passenger)),
    "test_last_bus fails for a version that is wrong only when one passenger is left over after the full buses"
);
assert!(
    fails(|| test_last_bus(no_bus_for_a_small_group)),
    "test_last_bus fails for a version that is wrong only when the group is smaller than one bus"
);
assert!(
    fails(|| test_last_bus(rounds_down)),
    "test_last_bus fails for a version that never books a bus for the passengers left over"
);
