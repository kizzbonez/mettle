// Pay Station
//
// The tests call the four functions below.

const CENTS_PER_HOUR: u32 = 250;

// The fee in cents for a number of hours.
pub fn parking_fee(hours: u32) -> u32 {
    let fee = hours * CENTS_PER_HOUR;

    fee
}

// The number of free spaces after some cars arrived and some left.
pub fn free_spaces(spaces: u32, arrived: u32, left: u32) -> u32 {
    let mut free = spaces;
    free -= arrived;
    free += left;

    free
}

// Whether the driver's answer is exactly the text `paid`.
pub fn is_paid(answer: &str) -> bool {
    let answer = answer == "paid";

    answer
}

// Prints one line of the attendant's list.
pub fn print_ticket(bay: u32, plate: &str, due: f64) {
    println!("Bay {bay:>4}: {plate:?} owes {due:.2}");
}
