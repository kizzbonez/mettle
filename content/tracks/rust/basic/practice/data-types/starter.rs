// Weather Station
//
// The tests call the four functions below. Each one is nearly complete:
// write only where a comment says YOUR CODE, and keep the last line of each
// function, which hands the result to the tests.
//
// The names in the parentheses, such as `total_minutes`, are variables that
// the tests fill in. The type after each colon says what they hold. Later
// lessons explain the parts you have not met yet, such as `pub fn` and `->`.

// Splits minutes of sunshine into whole hours and the minutes left over.
pub fn hours_and_minutes(total_minutes: u32) -> (u32, u32) {
    // YOUR CODE (task 1): replace the two zeros with calculations.
    let hours = 0;
    let minutes = 0;

    (hours, minutes)
}

// Adds rain to the gauge. A u8 cannot hold more than 255.
pub fn add_rain(gauge: u8, extra: u8) -> u8 {
    // YOUR CODE (task 2): `+` panics when the sum does not fit in a u8.
    // Replace it with the method that stops at the limit.
    let level = gauge + extra;

    level
}

// The average of three temperature readings.
pub fn average_temperature(readings: [i32; 3]) -> f64 {
    // YOUR CODE (task 3): replace the 0.0. Add the three readings, convert
    // the sum to an f64 and divide it by 3.0.
    let average = 0.0;

    average
}

// The whole degrees between the lowest and the highest temperature of a day.
pub fn temperature_span(day: (f64, f64)) -> i32 {
    // YOUR CODE (task 4): replace the 0. `day.0` is the lowest temperature
    // and `day.1` the highest. Subtract, then cast the result to an i32.
    let degrees = 0;

    degrees
}
