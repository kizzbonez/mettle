//! Loading Dock Ledger
//!
//! Parse scanner uploads into typed stock movements. Nothing in this file may
//! panic on bad input: every problem is reported through a `Result`.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The direction of a stock movement.
#[derive(Debug, Clone, PartialEq)]
pub enum Kind {
    Inbound,
    Outbound,
}

/// One validated line of a ledger.
#[derive(Debug, Clone, PartialEq)]
pub struct Movement {
    pub sku: String,
    pub kind: Kind,
    pub quantity: u32,
}

/// Why a single line was rejected.
#[derive(Debug, Clone, PartialEq)]
pub enum ParseError {
    /// The line did not have exactly three fields. Carries the number found.
    WrongFieldCount(usize),
    /// Each of these carries the offending field, trimmed.
    InvalidSku(String),
    UnknownKind(String),
    InvalidQuantity(String),
}

/// A `ParseError` together with the 1-based number of the line it came from.
#[derive(Debug, Clone, PartialEq)]
pub struct LineError {
    pub line: usize,
    pub error: ParseError,
}

/// Parses one line of the form `SKU,KIND,QUANTITY`.
pub fn parse_movement(line: &str) -> Result<Movement, ParseError> {
    // TODO 1: split on ',' and trim every field
    // TODO 2: check the field count
    // TODO 3: validate SKU, KIND and QUANTITY, in that order
    todo!("parse_movement")
}

/// Parses a whole upload, skipping blank lines and `#` comments.
pub fn parse_ledger(text: &str) -> Result<Vec<Movement>, LineError> {
    // TODO 4: number the lines from 1, skip what must be skipped, and stop at
    //         the first error
    todo!("parse_ledger")
}

/// Inbound minus outbound quantity for one SKU.
pub fn net_quantity(movements: &[Movement], sku: &str) -> i64 {
    // TODO 5: add inbound quantities and subtract outbound ones
    todo!("net_quantity")
}
