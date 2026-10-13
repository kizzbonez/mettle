// Weather Station
//
// The tests call the four functions below.

// Splits minutes of sunshine into whole hours and the minutes left over.
pub fn hours_and_minutes(total_minutes: u32) -> (u32, u32) {
    let hours = total_minutes / 60;
    let minutes = total_minutes % 60;

    (hours, minutes)
}

// Adds rain to the gauge. A u8 cannot hold more than 255.
pub fn add_rain(gauge: u8, extra: u8) -> u8 {
    let level = gauge.saturating_add(extra);

    level
}

// The average of three temperature readings.
pub fn average_temperature(readings: [i32; 3]) -> f64 {
    let sum = readings[0] + readings[1] + readings[2];
    let average = sum as f64 / 3.0;

    average
}

// The whole degrees between the lowest and the highest temperature of a day.
pub fn temperature_span(day: (f64, f64)) -> i32 {
    let (lowest, highest) = day;
    let degrees = (highest - lowest) as i32;

    degrees
}
