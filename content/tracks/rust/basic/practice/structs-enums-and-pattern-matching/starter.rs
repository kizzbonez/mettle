//! Library Loans
//!
//! A book is exactly one of four things, and each function takes that value
//! apart with a pattern.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Where a library book is right now.
#[derive(Debug, Clone, PartialEq)]
pub enum Loan {
    OnShelf,
    /// Borrowed, with the days left until it is due.
    Borrowed { days_left: u32 },
    /// Not returned in time. Carries the number of days it is late.
    Overdue(u32),
    /// Kept at the desk for a reader. Carries the reader's name.
    Reserved(String),
}

/// One line of text that describes the loan.
pub fn status_line(loan: &Loan) -> String {
    // TODO 1: a `match` with an arm for every case in the instructions
    todo!("status_line")
}

/// The fee in cents for a number of days late.
pub fn late_fee(days_late: u32) -> u32 {
    // TODO 2: a `match` on the number, with range patterns
    todo!("late_fee")
}

/// The days left on a borrowed book, or `None` for any other loan.
pub fn remaining_days(loan: &Loan) -> Option<u32> {
    // TODO 3: only one variant matters here
    todo!("remaining_days")
}

/// The late fee of an overdue book, or 0 for any other loan.
pub fn fee_due(loan: &Loan) -> u32 {
    // TODO 4: only one variant matters here, and `late_fee` does the rest
    todo!("fee_due")
}
