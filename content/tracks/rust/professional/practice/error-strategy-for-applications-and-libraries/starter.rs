//! Ledger Import
//!
//! Reads a bank's export, one `label;cents` entry on a line. The line parser
//! returns a typed error, the importer adds the line number as context, and
//! `report` prints the whole chain of causes.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

/// Why one line could not be read: one variant for each situation a caller
/// might treat differently.
#[derive(Debug)]
#[non_exhaustive]
pub enum LineError {
    /// A field is absent or empty. Carries the name of the field.
    MissingField(&'static str),
    /// The amount is not a whole number of cents. Carries the cause.
    BadAmount(ParseIntError),
}

impl fmt::Display for LineError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // TODO 1: one message for each variant, without the cause
        todo!("Display for LineError")
    }
}

impl Error for LineError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        // TODO 2: the cause, for the variant that has one
        todo!("LineError::source")
    }
}

impl From<ParseIntError> for LineError {
    fn from(cause: ParseIntError) -> Self {
        // TODO 3: this is what the `?` in `parse_line` calls
        todo!("From<ParseIntError> for LineError")
    }
}

/// Reads one line such as `rent;120000` into its label and its amount in cents.
pub fn parse_line(line: &str) -> Result<(String, u32), LineError> {
    let (label, amount) = line.split_once(';').ok_or(LineError::MissingField("amount"))?;
    let label = label.trim();
    if label.is_empty() {
        return Err(LineError::MissingField("label"));
    }
    let cents = amount.trim().parse::<u32>()?; // `?` calls `From<ParseIntError>`
    Ok((label.to_string(), cents))
}

/// A line error together with the context only the importer knows: the
/// number of the line.
#[derive(Debug)]
pub struct ImportError {
    line: usize,
    source: LineError,
}

impl ImportError {
    /// The number of the line that failed, counted from 1.
    pub fn line(&self) -> usize {
        self.line
    }
}

impl fmt::Display for ImportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // TODO 4: what was being attempted, and nothing about why it failed
        todo!("Display for ImportError")
    }
}

impl Error for ImportError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        // TODO 4: the line error that this context wraps
        todo!("ImportError::source")
    }
}

/// Adds up the amounts of an export. Blank lines are skipped. The first line
/// that cannot be read ends the import with its number and its error.
pub fn import_total(text: &str) -> Result<u64, ImportError> {
    // TODO 5: call `parse_line` for each line and wrap its error with `map_err`
    todo!("import_total")
}

/// The error and every cause behind it, outermost first, one on each line.
pub fn report(error: &(dyn Error + 'static)) -> String {
    // TODO 6: follow `source()` until it returns `None`
    todo!("report")
}
