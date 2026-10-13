//! Dice Bag
//!
//! An error type that callers can match on, the conversions that let `?`
//! produce it, and two conversions that are allowed to fail: a number into a
//! die with `TryFrom`, and a text into a die with `FromStr`.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::error::Error;
use std::fmt;
use std::num::ParseIntError;
use std::str::FromStr;

/// Why a text or a number is not a die.
#[derive(Debug, PartialEq)]
pub enum DieError {
    /// The text does not start with `d`.
    Format,
    /// What follows the `d` is not a number. Wraps the error of `parse`.
    Number(ParseIntError),
    /// No die has this many sides.
    Sides(u32),
}

/// A die with 4, 6, 8, 10, 12 or 20 sides.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Die(u32);

impl Die {
    /// The number of sides. Complete: nothing to write here.
    pub fn sides(&self) -> u32 {
        self.0
    }
}

impl fmt::Display for DieError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!("Display for DieError")
    }
}

// TODO 2: write `impl Error for DieError` and `impl From<ParseIntError> for DieError` here.

impl TryFrom<u32> for Die {
    type Error = DieError;

    fn try_from(sides: u32) -> Result<Die, DieError> {
        todo!("TryFrom<u32> for Die")
    }
}

impl FromStr for Die {
    type Err = DieError;

    fn from_str(text: &str) -> Result<Die, DieError> {
        todo!("FromStr for Die")
    }
}

/// The dice on a bag's label, or the first thing that is wrong with it.
pub fn open_bag(text: &str) -> Result<Vec<Die>, Box<dyn Error>> {
    todo!("open_bag")
}
