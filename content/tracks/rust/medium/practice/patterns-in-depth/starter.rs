//! Taxi Meter
//!
//! Three functions for a taxi meter. Each one is a single `match`, and the
//! patterns of its arms do the work: they take enums, structs and slices
//! apart and say exactly which values an arm is for.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

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
    todo!("fare_cents")
}

/// The name of a route, from its stops in driving order.
pub fn route(stops: &[&str]) -> String {
    todo!("route")
}

/// The line for the driver's log.
pub fn describe(ride: &Ride) -> String {
    todo!("describe")
}
