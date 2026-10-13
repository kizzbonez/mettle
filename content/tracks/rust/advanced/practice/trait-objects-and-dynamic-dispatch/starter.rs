//! Toll Plaza
//!
//! One lane, several kinds of vehicle. The booth knows each of them only as
//! "something that implements `Vehicle`", so the lane holds trait objects.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Anything that can drive up to a toll booth.
pub trait Vehicle {
    /// What the receipt calls this vehicle.
    fn label(&self) -> String;

    /// The toll in cents.
    fn toll_cents(&self) -> u32;
}

/// A passenger car.
pub struct Car;

/// A truck, which pays for each axle.
pub struct Truck {
    pub axles: u32,
}

impl Vehicle for Car {
    fn label(&self) -> String {
        todo!("Car::label")
    }

    fn toll_cents(&self) -> u32 {
        todo!("Car::toll_cents")
    }
}

impl Vehicle for Truck {
    fn label(&self) -> String {
        todo!("Truck::label")
    }

    fn toll_cents(&self) -> u32 {
        todo!("Truck::toll_cents")
    }
}

/// Builds the vehicle the camera reported, or `None` for a kind it does not know.
pub fn arrive(kind: &str, axles: u32) -> Option<Box<dyn Vehicle>> {
    todo!("arrive")
}

/// The toll of every vehicle in the lane, added up.
pub fn total_toll(lane: &[Box<dyn Vehicle>]) -> u32 {
    todo!("total_toll")
}

/// Passes a toll through each discount in turn.
pub fn apply_discounts(toll: u32, discounts: &[Box<dyn Fn(u32) -> u32>]) -> u32 {
    todo!("apply_discounts")
}
