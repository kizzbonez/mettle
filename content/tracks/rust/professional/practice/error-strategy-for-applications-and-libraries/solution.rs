//! Ledger Import
//!
//! Reads a bank's export, one `label;cents` entry on a line. The line parser
//! returns a typed error, the importer adds the line number as context, and
//! `report` prints the whole chain of causes.

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
        match self {
            LineError::MissingField(field) => write!(f, "missing {field} field"),
            // The cause is reachable through `source`, so it is not repeated here.
            LineError::BadAmount(_) => write!(f, "amount is not a whole number of cents"),
        }
    }
}

impl Error for LineError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            LineError::BadAmount(cause) => Some(cause),
            LineError::MissingField(_) => None,
        }
    }
}

impl From<ParseIntError> for LineError {
    fn from(cause: ParseIntError) -> Self {
        LineError::BadAmount(cause)
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
        write!(f, "cannot import line {}", self.line)
    }
}

impl Error for ImportError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.source)
    }
}

/// Adds up the amounts of an export. Blank lines are skipped. The first line
/// that cannot be read ends the import with its number and its error.
pub fn import_total(text: &str) -> Result<u64, ImportError> {
    let mut total = 0_u64;
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let (_, cents) =
            parse_line(line).map_err(|source| ImportError { line: index + 1, source })?;
        total += u64::from(cents);
    }
    Ok(total)
}

/// The error and every cause behind it, outermost first, one on each line.
pub fn report(error: &(dyn Error + 'static)) -> String {
    let mut text = format!("error: {error}");
    let mut cause = error.source();
    while let Some(inner) = cause {
        text.push_str(&format!("\n  caused by: {inner}"));
        cause = inner.source();
    }
    text
}
