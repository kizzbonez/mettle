//! Mixtape
//!
//! Playing times as a newtype with operators of its own, a trait whose
//! implementors choose their own measure, and a supertrait that builds a
//! label out of `Display`.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::fmt;
use std::ops::{Add, Mul};

/// A playing time in whole seconds.
///
/// A newtype: a `Seconds` cannot be mixed up with any other `u32`, and
/// because the type is ours we may implement operators and `Display` for it.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Seconds(pub u32);

/// Given: a playing time is shown as minutes, a colon and two-digit seconds.
impl fmt::Display for Seconds {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{:02}", self.0 / 60, self.0 % 60)
    }
}

impl Add for Seconds {
    type Output = Seconds;

    fn add(self, other: Seconds) -> Seconds {
        todo!("Seconds + Seconds")
    }
}

impl Mul<u32> for Seconds {
    type Output = Seconds;

    fn mul(self, times: u32) -> Seconds {
        todo!("Seconds * u32")
    }
}

/// Something that has a size. Each implementor decides what it is measured in.
pub trait Measure {
    type Size;

    fn size(&self) -> Self::Size;
}

/// One side of a cassette: the lengths of its tracks, in playing order.
pub struct Side(pub Vec<Seconds>);

impl Measure for Side {
    // TODO 3: `()` is only a placeholder that lets the file compile. Replace
    //         it with the type a side is measured in.
    type Size = ();

    fn size(&self) -> Self::Size {
        todo!("Side::size")
    }
}

/// Anything that can be written on the spine of a cassette box.
///
/// `fmt::Display` is a supertrait: every type that implements `Spine` can be
/// formatted with `{}`, so the default method may rely on that.
pub trait Spine: fmt::Display {
    fn spine(&self) -> String {
        todo!("Spine::spine")
    }
}

impl Spine for Seconds {}
