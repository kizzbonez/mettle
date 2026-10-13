//! Scoop Shop
//!
//! Two types for an ice cream stand. `derive` writes most of their traits,
//! and what it writes depends on the order of the variants and the fields.
//! `Display` and `From` are written by hand.

use std::fmt;

/// How big a cone is. Variants compare in the order they are declared.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum Size {
    Kids,
    #[default]
    Regular,
    Large,
}

/// One cone on the till. `size` is declared first, so it is compared first.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Default)]
pub struct Cone {
    pub size: Size,
    pub flavour: String,
}

/// The cone that the till lines up first.
pub fn smaller(a: Cone, b: Cone) -> Cone {
    a.min(b)
}

impl fmt::Display for Size {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Size::Kids => write!(f, "kids"),
            Size::Regular => write!(f, "regular"),
            Size::Large => write!(f, "large"),
        }
    }
}

impl fmt::Display for Cone {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} cone, {}", self.size, self.flavour)
    }
}

impl From<&str> for Cone {
    fn from(flavour: &str) -> Cone {
        Cone { flavour: flavour.to_string(), ..Default::default() }
    }
}
