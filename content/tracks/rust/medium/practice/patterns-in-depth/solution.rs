//! Taxi Meter
//!
//! Three functions for a taxi meter. Each one is a single `match`, and the
//! patterns of its arms do the work: they take enums, structs and slices
//! apart and say exactly which values an arm is for.

/// One kind of trip.
#[derive(Debug, Clone, PartialEq)]
pub enum Trip {
    /// A trip in town, by the kilometer.
    City { km: u32 },
    /// A trip to an airport terminal with a number of bags.
    Airport { terminal: u8, bags: u32 },
    /// Waiting for a passenger, in minutes.
    Waiting(u32),
}

/// One ride on the meter.
#[derive(Debug, Clone, PartialEq)]
pub struct Ride {
    pub id: u32,
    pub trip: Trip,
    /// The tip in cents, if the passenger gave one.
    pub tip: Option<u32>,
}

/// The price of a trip in cents.
pub fn fare_cents(trip: &Trip) -> u32 {
    match trip {
        Trip::City { km: 0 } => 0,
        Trip::City { km: 1..=3 } => 600,
        Trip::City { km } => 600 + (km - 3) * 150,
        Trip::Airport { terminal: 1 | 2, bags } => 3500 + bags * 100,
        Trip::Airport { bags, .. } => 4200 + bags * 100,
        Trip::Waiting(0..=5) => 0,
        Trip::Waiting(minutes @ 6..=60) => (minutes - 5) * 50,
        Trip::Waiting(_) => 2750,
    }
}

/// The name of a route, from its stops in driving order.
pub fn route(stops: &[&str]) -> String {
    match stops {
        [] => String::from("no stops"),
        [only] => format!("stay at {only}"),
        [from, to] => format!("{from} to {to}, direct"),
        [from, between @ .., to] => format!("{from} to {to}, {} in between", between.len()),
    }
}

/// The line for the driver's log.
pub fn describe(ride: &Ride) -> String {
    match ride {
        Ride { id: 0, .. } => String::from("test ride"),
        Ride { id, trip: Trip::Airport { terminal, .. }, .. } => {
            format!("#{id} airport, terminal {terminal}")
        }
        Ride { id, tip: Some(tip), .. } if *tip >= 500 => format!("#{id} with a generous tip"),
        Ride { id, tip: Some(_), .. } => format!("#{id} with a tip"),
        Ride { id, tip: None, .. } => format!("#{id}"),
    }
}
