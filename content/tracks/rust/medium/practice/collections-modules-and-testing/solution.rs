//! Away Game
//!
//! The function `fleet::buses_needed` is finished. Its tests are three
//! functions that pass for a correct version and fail, by panicking or by
//! returning an `Err`, for a version with a bug.

/// The code under test. Complete and correct.
pub mod fleet {
    /// The smallest number of buses that seats every passenger.
    /// A bus with no seats is an error.
    pub fn buses_needed(passengers: u32, seats: u32) -> Result<u32, String> {
        if seats == 0 {
            return Err(String::from("a bus needs at least one seat"));
        }
        let full = passengers / seats;
        if passengers % seats == 0 { Ok(full) } else { Ok(full + 1) }
    }
}

/// Three versions with one bug each. The tests must catch them.
pub mod faulty {
    /// Forgets the passengers who do not fill a bus.
    pub fn leaves_people_behind(passengers: u32, seats: u32) -> Result<u32, String> {
        if seats == 0 {
            return Err(String::from("a bus needs at least one seat"));
        }
        Ok(passengers / seats)
    }

    /// Books a spare bus even when every bus is exactly full.
    pub fn always_one_extra(passengers: u32, seats: u32) -> Result<u32, String> {
        if seats == 0 {
            return Err(String::from("a bus needs at least one seat"));
        }
        Ok(passengers / seats + 1)
    }

    /// Does not refuse a bus without seats.
    pub fn accepts_no_seats(passengers: u32, seats: u32) -> Result<u32, String> {
        if seats == 0 {
            return Ok(0);
        }
        let full = passengers / seats;
        if passengers % seats == 0 { Ok(full) } else { Ok(full + 1) }
    }
}

/// The happy path: groups that fill their buses exactly.
pub fn test_full_buses(buses_needed: impl Fn(u32, u32) -> Result<u32, String>) {
    assert_eq!(buses_needed(40, 40), Ok(1), "40 passengers fill one bus of 40 seats");
    assert_eq!(buses_needed(120, 40), Ok(3), "120 passengers fill three buses of 40 seats");
}

/// The boundary: one passenger too many for the full buses, and a group
/// smaller than one bus.
pub fn test_last_bus(buses_needed: impl Fn(u32, u32) -> Result<u32, String>) {
    assert_eq!(buses_needed(41, 40), Ok(2), "one passenger more than a full bus needs a second bus");
    assert_eq!(buses_needed(5, 40), Ok(1), "a group smaller than one bus still needs a bus");
}

/// The edge cases: no passengers, and no seats. This test returns a `Result`,
/// so it can use `?` and must end with `Ok(())`.
pub fn test_edge_cases(buses_needed: impl Fn(u32, u32) -> Result<u32, String>) -> Result<(), String> {
    let buses = buses_needed(0, 40)?;
    assert_eq!(buses, 0, "no passengers need no bus");

    // Not `?` here: the error is what the test expects.
    assert!(buses_needed(30, 0).is_err(), "a bus with 0 seats is refused");
    Ok(())
}
