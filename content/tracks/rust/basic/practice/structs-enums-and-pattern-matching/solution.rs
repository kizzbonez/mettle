//! Library Loans
//!
//! A book is exactly one of four things, and each function takes that value
//! apart with a pattern.

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
    match loan {
        Loan::OnShelf => String::from("on the shelf"),
        Loan::Borrowed { days_left } if *days_left == 0 => String::from("due today"),
        Loan::Borrowed { days_left } => format!("due in {days_left} days"),
        Loan::Overdue(days) => format!("{days} days late"),
        Loan::Reserved(name) => format!("held for {name}"),
    }
}

/// The fee in cents for a number of days late.
pub fn late_fee(days_late: u32) -> u32 {
    match days_late {
        0 => 0,
        1..=7 => 50,
        8..=30 => 200,
        _ => 500,
    }
}

/// The days left on a borrowed book, or `None` for any other loan.
pub fn remaining_days(loan: &Loan) -> Option<u32> {
    let Loan::Borrowed { days_left } = loan else {
        return None;
    };
    Some(*days_left)
}

/// The late fee of an overdue book, or 0 for any other loan.
pub fn fee_due(loan: &Loan) -> u32 {
    if let Loan::Overdue(days) = loan {
        late_fee(*days)
    } else {
        0
    }
}
