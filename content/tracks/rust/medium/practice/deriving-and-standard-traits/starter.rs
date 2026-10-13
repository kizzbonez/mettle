//! Scoop Shop
//!
//! Two types for an ice cream stand. `derive` writes most of their traits,
//! and what it writes depends on the order of the variants and the fields.
//! `Display` and `From` are written by hand.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::fmt;

/// How big a cone is.
// TODO 1: order the variants from the smallest size to the largest, and move
// `#[default]` to `Regular`.
// TODO 3: add the traits that `smaller` needs.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum Size {
    #[default]
    Large,
    Regular,
    Kids,
}

/// One cone on the till.
// TODO 2: put the field that is compared first at the top.
// TODO 3: add the traits that `smaller` needs.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Cone {
    pub flavour: String,
    pub size: Size,
}

/// The cone that the till lines up first.
pub fn smaller(a: Cone, b: Cone) -> Cone {
    todo!("smaller")
}

impl fmt::Display for Size {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!("Display for Size")
    }
}

impl fmt::Display for Cone {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!("Display for Cone")
    }
}

impl From<&str> for Cone {
    fn from(flavour: &str) -> Cone {
        todo!("From<&str> for Cone")
    }
}
