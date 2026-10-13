//! Dice Bag
//!
//! An error type that callers can match on, the conversions that let `?`
//! produce it, and two conversions that are allowed to fail: a number into a
//! die with `TryFrom`, and a text into a die with `FromStr`.

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
    /// The number of sides.
    pub fn sides(&self) -> u32 {
        self.0
    }
}

impl fmt::Display for DieError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DieError::Format => write!(f, "a die is written as d and a number"),
            DieError::Number(inner) => write!(f, "not a number of sides: {inner}"),
            DieError::Sides(sides) => write!(f, "no die has {sides} sides"),
        }
    }
}

// All the methods of `Error` have defaults, so the body is empty. This is
// what lets `?` turn a `DieError` into a `Box<dyn Error>`.
impl Error for DieError {}

// The conversion `?` uses when a `parse` fails inside a function that
// returns `DieError`.
impl From<ParseIntError> for DieError {
    fn from(inner: ParseIntError) -> DieError {
        DieError::Number(inner)
    }
}

impl TryFrom<u32> for Die {
    type Error = DieError;

    fn try_from(sides: u32) -> Result<Die, DieError> {
        match sides {
            4 | 6 | 8 | 10 | 12 | 20 => Ok(Die(sides)),
            _ => Err(DieError::Sides(sides)),
        }
    }
}

impl FromStr for Die {
    type Err = DieError;

    fn from_str(text: &str) -> Result<Die, DieError> {
        if !text.starts_with('d') {
            return Err(DieError::Format);
        }
        let sides: u32 = text[1..].parse()?; // ParseIntError becomes DieError
        Die::try_from(sides)
    }
}

/// The dice on a bag's label, or the first thing that is wrong with it.
pub fn open_bag(text: &str) -> Result<Vec<Die>, Box<dyn Error>> {
    let mut dice = Vec::new();
    for word in text.split_whitespace() {
        dice.push(word.parse::<Die>()?); // DieError becomes Box<dyn Error>
    }
    if dice.is_empty() {
        return Err("the bag is empty".into());
    }
    Ok(dice)
}
