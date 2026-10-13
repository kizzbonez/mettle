//! Toll Plaza
//!
//! One lane, several kinds of vehicle. The booth knows each of them only as
//! "something that implements `Vehicle`", so the lane holds trait objects.

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
        String::from("car")
    }

    fn toll_cents(&self) -> u32 {
        250
    }
}

impl Vehicle for Truck {
    fn label(&self) -> String {
        format!("{}-axle truck", self.axles)
    }

    fn toll_cents(&self) -> u32 {
        400 * self.axles
    }
}

/// Builds the vehicle the camera reported, or `None` for a kind it does not know.
pub fn arrive(kind: &str, axles: u32) -> Option<Box<dyn Vehicle>> {
    match kind {
        "car" => Some(Box::new(Car)),
        "truck" => Some(Box::new(Truck { axles })),
        _ => None,
    }
}

/// The toll of every vehicle in the lane, added up.
pub fn total_toll(lane: &[Box<dyn Vehicle>]) -> u32 {
    lane.iter().map(|vehicle| vehicle.toll_cents()).sum()
}

/// Passes a toll through each discount in turn.
pub fn apply_discounts(toll: u32, discounts: &[Box<dyn Fn(u32) -> u32>]) -> u32 {
    discounts.iter().fold(toll, |toll, discount| discount(toll))
}
